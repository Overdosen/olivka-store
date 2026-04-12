import { NextResponse } from 'next/server';
import { LiqPay } from '../../../../lib/liqpay';
import { supabase, supabaseService } from '../../../../lib/supabase';

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
      // 3. Update Order Status in Supabase (USING SERVICE ROLE TO BYPASS RLS)
      console.log(`[LiqPay Callback] Attempting to update order ${order_id} to status 'paid'...`);
      
      if (!supabaseService) {
        console.error('[LiqPay Callback] supabaseService is not initialized. Using anon client (this will fail if RLS is on).');
      }
      
      const db = supabaseService || supabase;

      const { data: orderData, error: orderError } = await db
        .from('orders')
        .update({ 
          status: 'paid',
          payment_details: payment,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      if (orderError) {
        console.error('[LiqPay Callback] Supabase Update Error:', orderError);
        return NextResponse.json({ status: 'error', message: 'DB update failed', error: orderError.message });
      }

      console.log('[LiqPay Callback] Order status updated to paid for ID:', order_id);

      // 4. Stock Deduction is now handled automatically by a Postgres trigger (trigger_on_order_paid)
      // in the database when status changes to 'paid'.

      // 5. Notify n8n with FULL order data
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
      
      if (webhookUrl) {
        console.log('[LiqPay Callback] Notifying n8n webhook...');
        try {
          const webhookRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'order_paid',
              source: 'olivka-store-liqpay',
              data: {
                id: order_id,
                status: 'paid',
                payment_method: 'liqpay',
                amount: amount,
                currency: currency,
                liqpay_payment_id: payment.payment_id
              },
              timestamp: new Date().toISOString()
            })
          });
          console.log('[LiqPay Callback] n8n response status:', webhookRes.status);
        } catch (webhookErr) {
          console.error('[LiqPay Callback] n8n notification error:', webhookErr);
        }
      } else {
        console.warn('[LiqPay Callback] n8n webhook URL not found in environment variables.');
      }

      return NextResponse.json({ status: 'ok' });
    } else {
      console.warn(`[LiqPay Callback] Unsuccessful payment status: ${status} for order ${order_id}`);
      
      // Update status to payment_error
      const db = supabaseService || supabase;
      await db
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
