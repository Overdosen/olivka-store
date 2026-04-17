import { NextResponse } from 'next/server';
import { LiqPay } from '../../../../lib/liqpay';
import { supabase, supabaseService } from '../../../../lib/supabase';
import { checkboxService } from '../../../../lib/checkbox';


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

    // 1. Verify Signature (Bypass for local testing if header is present)
    const isTestBypass = request.headers.get('x-test-bypass') === 'true';
    
    if (!isTestBypass && !liqpay.verify_signature(data, signature)) {
      console.error('[LiqPay Callback] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (isTestBypass) {
      console.log('[LiqPay Callback] SIGNATURE BYPASS ENABLED for testing');
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
        .update({ status: 'paid' })
        .eq('id', order_id)
        .select()
        .single();

      if (orderError) {
        console.error('[LiqPay Callback] Supabase Update Error:', orderError);
        return NextResponse.json({ status: 'error', message: 'DB update failed', error: orderError.message });
      }

      console.log('[LiqPay Callback] Order status updated to paid for ID:', order_id);

      // 4. Stock Deduction is now handled automatically by a Postgres trigger (trigger_on_order_paid)
      // in the database when status changes to 'paid'.

      // 4. Checkbox Fiscalization
      let receiptId = orderData.fiscal_receipt_id;
      let receiptUrl = orderData.fiscal_receipt_url;

      if (!receiptId) {
        try {
          console.log(`[LiqPay Callback] Starting Checkbox fiscalization for Order #${orderData.order_number}...`);
          console.log('[LiqPay Callback] Items for fiscalization:', JSON.stringify(orderData.items));
          
          const receipt = await checkboxService.createReceipt(orderData);
          
          if (receipt && receipt.id) {
            receiptId = receipt.id;
            receiptUrl = `https://check.checkbox.ua/${receipt.id}`;
            
            console.log(`[LiqPay Callback] Checkbox receipt created: ${receiptId}. Updating order...`);
            
            await db
              .from('orders')
              .update({ 
                fiscal_receipt_id: receiptId,
                fiscal_receipt_url: receiptUrl
              })
              .eq('id', order_id);
              
            console.log('[LiqPay Callback] Order successfully updated with receipt details.');
          } else {
            console.error('[LiqPay Callback] Checkbox returned no receipt ID');
          }
        } catch (error) {
          console.error('[LiqPay Callback] Checkbox Fiscalization Failed');
          console.error('[LiqPay Callback] Error Message:', error.message);
          // Optional: log object if it helps
          if (error.responseBody) {
             console.error('[LiqPay Callback] Full Error Response:', error.responseBody);
          }
        }
      } else {
        console.log('[LiqPay Callback] Order already has a fiscal receipt:', receiptId);
      }

      // 5. Notify n8n with FULL order data
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
      
      if (webhookUrl) {
        console.log('[LiqPay Callback] Notifying n8n webhook:', webhookUrl);
        try {
          const n8nPayload = {
            event: 'new_order_paid',
            source: 'olivka-store-liqpay-callback',
            data: {
              ...orderData,
              fiscal_receipt_id: receiptId || null,
              fiscal_receipt_url: receiptUrl || null,
              payment_info: {
                status: status,
                amount: amount,
                currency: currency,
                timestamp: new Date().toISOString()
              }
            },
            timestamp: new Date().toISOString()
          };

          const webhookRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload)
          });
          
          console.log('[LiqPay Callback] n8n response status:', webhookRes.status);
          if (!webhookRes.ok) {
            const errorText = await webhookRes.text();
            console.error('[LiqPay Callback] n8n error response:', errorText);
          }
        } catch (webhookErr) {
          console.error('[LiqPay Callback] n8n notification error:', webhookErr.message);
        }
      } else {
        console.warn('[LiqPay Callback] n8n webhook URL missing (NEXT_PUBLIC_N8N_WEBHOOK_URL)');
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
