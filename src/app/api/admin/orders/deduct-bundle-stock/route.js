import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../../lib/supabase';

/**
 * POST /api/admin/orders/deduct-bundle-stock
 * Body: { items: BundleItem[] }
 * Deducts stock for each bundle component (the box itself is handled by DB trigger).
 */
export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid items array' }, { status: 400 });
    }

    if (!supabaseService) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    for (const item of items) {
      const prodId = item.product_id;
      const qtyToDeduct = item.quantity || item.qty || 1;
      if (!prodId) continue;

      const { data: product, error: fetchError } = await supabaseService
        .from('products')
        .select('stock, sizes')
        .eq('id', prodId)
        .single();

      if (fetchError || !product) {
        console.error(`[deduct-bundle-stock] Product ${prodId} not found:`, fetchError);
        continue;
      }

      let updatePayload = {};

      if (item.size && Array.isArray(product.sizes) && product.sizes.length > 0) {
        const newSizes = product.sizes.map(s =>
          s.name === item.size
            ? { ...s, quantity: Math.max(0, (s.quantity || 0) - qtyToDeduct) }
            : s
        );
        updatePayload = { sizes: newSizes, stock: Math.max(0, (product.stock || 0) - qtyToDeduct) };
      } else {
        updatePayload = { stock: Math.max(0, (product.stock || 0) - qtyToDeduct) };
      }

      const { error: updateError } = await supabaseService
        .from('products')
        .update(updatePayload)
        .eq('id', prodId);

      if (updateError) {
        console.error(`[deduct-bundle-stock] Error updating ${prodId}:`, updateError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[deduct-bundle-stock] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
