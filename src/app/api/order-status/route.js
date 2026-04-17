import { NextResponse } from 'next/server';
import { supabaseService } from '../../../lib/supabase';

/**
 * GET /api/order-status?id=<order_uuid>
 *
 * Returns order status using the service role client — bypasses RLS.
 * This is safe because we only return non-sensitive public fields
 * (status, order_number, payment_method) — not PII like address or phone.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
  }

  // Basic UUID format validation to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid order id format' }, { status: 400 });
  }

  if (!supabaseService) {
    console.error('[order-status] supabaseService not initialized');
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { data, error } = await supabaseService
    .from('orders')
    .select('id, order_number, status, payment_method')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    console.error('[order-status] DB error:', error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
