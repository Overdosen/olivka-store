import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../../lib/supabase';

export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing or invalid items array' }, { status: 400 });
    }

    if (!supabaseService) {
      console.error('[restore-stock] supabaseService not initialized');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    for (const item of items) {
      const prodId = item.product_id || item.id;
      const qtyToRestore = item.qty || item.quantity || 1;

      // Отримуємо поточний стан товару
      const { data: product, error: fetchError } = await supabaseService
        .from('products')
        .select('stock, sizes')
        .eq('id', prodId)
        .single();

      if (fetchError || !product) {
        console.error(`[restore-stock] Product ${prodId} not found or error:`, fetchError);
        continue;
      }

      let updatePayload = {};

      if (item.size && Array.isArray(product.sizes)) {
        // Якщо товар має розміри
        const newSizes = product.sizes.map(s => 
          s.name === item.size 
            ? { ...s, quantity: (s.quantity || 0) + qtyToRestore } 
            : s
        );
        // Загальний stock просто збільшуємо на кількість повернення,
        // щоб не розраховувати суму (якщо списування раніше не оновило розміри)
        const newStock = (product.stock || 0) + qtyToRestore;
        updatePayload = { sizes: newSizes, stock: newStock };
      } else {
        // Якщо товар без розмірів
        updatePayload = { stock: (product.stock || 0) + qtyToRestore };
      }

      // Оновлюємо залишки в базі (через supabaseService для обходу RLS)
      const { error: updateError } = await supabaseService
        .from('products')
        .update(updatePayload)
        .eq('id', prodId);

      if (updateError) {
        console.error(`[restore-stock] Error updating product ${prodId}:`, updateError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[restore-stock] Internal Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
