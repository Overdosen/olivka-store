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

    // 1. Verify Signature (Bypass for local testing if header is present)
    const isTestBypass = request.headers.get('x-test-bypass') === 'true';
    
    if (!isTestBypass && !liqpay.verify_signature(data, signature)) {
      console.error('[LiqPay Callback] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Decode Payment Data
    const payment = liqpay.decode_data(data);
    console.log('[LiqPay Callback] Payment Data Received:', payment);

    if (!payment) {
      console.error('[LiqPay Callback] Failed to decode payment data');
      return NextResponse.json({ error: 'Failed to decode data' }, { status: 400 });
    }

    const { status, order_id } = payment;
    const isSuccess = ['success', 'sandbox', 'wait_accept'].includes(status);

    if (isSuccess) {
      console.log(`[LiqPay Callback] Processing successful payment for order ${order_id}...`);
      
      if (!supabaseService) {
        console.warn('[LiqPay Callback] WARNING: supabaseService is MISSING. Using anonymous client (may fail due to RLS).');
      }
      
      const db = supabaseService || supabase;
      
      // 3. Atomic Update: Try to mark as 'paid' and get the full order data
      const { data: orderData, error: orderError } = await db
        .from('orders')
        .update({ 
          status: 'paid',
          payment_details: payment,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id)
        .select()
        .single();

      if (orderError) {
        // CASE: Order was already marked 'paid' (PGRST116 returned by .single() when no rows match criteria or filter)
        if (orderError.code === 'PGRST116' || orderError.message?.includes('0 rows')) {
          console.log(`[LiqPay Callback] Order ${order_id} already marked as paid or not found. Fetching current data for n8n...`);
          
          const { data: existingOrder, error: fetchError } = await db
            .from('orders')
            .select()
            .eq('id', order_id)
            .single();
            
          if (fetchError) {
             console.error('[LiqPay Callback] Failed to fetch existing order:', fetchError);
             return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }

          if (existingOrder) {
            await notifyN8n(existingOrder, payment);
          }
          
          return NextResponse.json({ status: 'ok', message: 'Already processed' });
        }
        
        console.error('[LiqPay Callback] Database Update Error:', orderError);
        return NextResponse.json({ status: 'error', error: orderError.message, code: orderError.code }, { status: 500 });
      }

      console.log('[LiqPay Callback] Order status updated to paid:', order_id);

      // 4. Notify n8n Webhook
      await notifyN8n(orderData, payment);

      return NextResponse.json({ status: 'ok' });

    } else {
      console.warn(`[LiqPay Callback] Unsuccessful payment status: ${status} for order ${order_id}`);
      
      const db = supabaseService || supabase;
      await db
        .from('orders')
        .update({ 
          status: 'payment_error',
          payment_details: payment,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      return NextResponse.json({ status: 'unsuccessful', paymentStatus: status });
    }

  } catch (error) {
    console.error('[LiqPay Callback] Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Sends order data to n8n webhook
 */
async function notifyN8n(order, payment) {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('[LiqPay Callback] n8n webhook URL missing. Skipping notification.');
    return;
  }

  try {
    console.log(`[LiqPay Callback] Notifying n8n for Order #${order.order_number}... Webhook: ${webhookUrl}`);
    
    // Construct rich payload for n8n
    const n8nPayload = {
      source: 'liqpay_callback',
      event: 'payment_success',
      order_id: order.id,
      order_number: order.order_number,
      status: 'paid',
      amount: payment.amount || order.total,
      currency: payment.currency || 'UAH',
      payment_id: payment.payment_id,
      customer: {
        email: order.email,
        name: order.full_name,
        phone: order.phone
      },
      items: order.items || [],
      delivery: {
        method: order.delivery_method,
        address: order.address
      },
      notes: order.notes,
      created_at: order.created_at,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload)
    });
    
    const responseText = await response.text();
    console.log(`[LiqPay Callback] n8n response: ${response.status} ${responseText.substring(0, 50)}`);
    
  } catch (error) {
    console.error('[LiqPay Callback] n8n notification failed:', error.message);
  }
}
