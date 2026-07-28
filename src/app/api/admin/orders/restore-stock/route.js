import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../../lib/supabase';

async function restoreProductStock(prodId, qtyToRestore, size) {
  const { data: product, error: fetchError } = await supabaseService
    .from('products')
    .select('stock, sizes')
    .eq('id', prodId)
    .single();

  if (fetchError || !product) {
    console.error(`[restore-stock] Product ${prodId} not found:`, fetchError);
    return;
  }

  let updatePayload = {};

  if (size && Array.isArray(product.sizes)) {
    const newSizes = product.sizes.map(s =>
      s.name === size
        ? { ...s, quantity: (s.quantity || 0) + qtyToRestore }
        : s
    );
    const newStock = (product.stock || 0) + qtyToRestore;
    updatePayload = { sizes: newSizes, stock: newStock };
  } else {
    updatePayload = { stock: (product.stock || 0) + qtyToRestore };
  }

  const { error: updateError } = await supabaseService
    .from('products')
    .update(updatePayload)
    .eq('id', prodId);

  if (updateError) {
    console.error(`[restore-stock] Error updating product ${prodId}:`, updateError);
  }
}

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

      // Restore main product stock
      await restoreProductStock(prodId, qtyToRestore, item.size || null);

      // Also restore stock for bundle components (if this item is a bundle/box)
      if (item.bundle_items && Array.isArray(item.bundle_items)) {
        for (const bi of item.bundle_items) {
          const biQty = (bi.quantity || bi.qty || 1) * qtyToRestore;
          await restoreProductStock(bi.product_id, biQty, bi.size || null);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[restore-stock] Internal Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

