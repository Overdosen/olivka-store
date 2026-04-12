import { NextResponse } from 'next/server';
import { LiqPay } from '../../../../lib/liqpay';
import { supabase } from '../../../../lib/supabase';

const liqpay = new LiqPay(
  process.env.LIQPAY_PUBLIC_KEY,
  process.env.LIQPAY_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const data = formData.get('data');
    const signature = formData.get('signature');

    if (!data || !signature) {
      return NextResponse.json({ error: 'Missing data or signature' }, { status: 400 });
    }

    // 1. Verify Signature
    if (!liqpay.verify_signature(data, signature)) {
      console.error('[LiqPay Callback] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Decode and Analyze Data
    const payment = liqpay.decode_data(data);
    console.log('[LiqPay Callback] Payment Data:', payment);

    const { status, order_id, amount, currency } = payment;

    // LiqPay Success statuses: 'success', 'sandbox', 'wait_accept'
    const isSuccess = ['success', 'sandbox', 'wait_accept'].includes(status);

    if (isSuccess) {
      // 3. Update Order Status in Supabase
      // Assuming order_id is the UUID from our orders table
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order_id)
        .select()
        .single();

      if (orderError) {
        console.error('[LiqPay Callback] Supabase Update Error:', orderError);
        // We still return 200 to LiqPay to stop retries, but log it
        return NextResponse.json({ status: 'error', message: 'DB update failed' });
      }

      // 4. Stock Deduction is now handled automatically by a Postgres trigger (trigger_on_order_paid)
      // in the database when status changes to 'paid'.

      // 5. Notify n8n with FULL order data
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_order_paid',
              source: 'olivka-store-liqpay-callback',
              data: {
                ...order, // Include full order data (items, customer, etc.)
                payment_info: {
                  status: status,
                  amount: amount,
                  currency: currency,
                  timestamp: new Date().toISOString()
                }
              },
              timestamp: new Date().toISOString()
            })
          });
        } catch (err) {
          console.error('[LiqPay Callback] n8n Notify Error:', err);
        }
      }

      return NextResponse.json({ status: 'ok' });
    } else {
      console.warn(`[LiqPay Callback] Unsuccessful payment status: ${status} for order ${order_id}`);
      
      // Update status to payment_error
      await supabase
        .from('orders')
        .update({ status: 'payment_error' })
        .eq('id', order_id);

      return NextResponse.json({ status: 'unsuccessful', paymentStatus: status });
    }

  } catch (error) {
    console.error('[LiqPay Callback] General Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
