import { NextResponse } from 'next/server';
import { sendShippingUpdateEmail } from '../../../../../lib/email-service';
import { supabaseService } from '../../../../../lib/supabase';

export async function POST(req) {
  try {
    const { orderId, newStatus } = await req.json();

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: order, error } = await supabaseService
      .from('orders')
      .select('tracking_number, shipping_email_sent')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.tracking_number) {
      return NextResponse.json({ error: 'No tracking number', skipped: true });
    }

    if (order.shipping_email_sent) {
      return NextResponse.json({ message: 'Email already sent', skipped: true });
    }

    const result = await sendShippingUpdateEmail(orderId, newStatus);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Manual Shipping Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
