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
        let finalUpdateErrorObj = null;
        try {
          console.log(`[LiqPay Callback] Starting Checkbox fiscalization for Order #${orderData.order_number}...`);
          
          // Reset and start performance tracking
          checkboxService.startPerformanceTracking();

          // Helper function for timeout
          const withTimeout = (promise, ms, timeoutErrorMsg) => {
            let timeoutId;
            const timeout = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error(timeoutErrorMsg)), ms);
            });
            return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
          };

          // Wrap the entire fiscalization flow in a 8-second timeout (Vercel max is usually 10s on Hobby)
          const receipt = await withTimeout(
            (async () => {
              const shift = await checkboxService.ensureShiftOpened();
              console.log(`[LiqPay Callback] Shift confirmed: ${shift?.id} (${shift?.status})`);
              
              console.log(`[LiqPay Callback] Creating receipt for ${orderData.items?.length} items...`);
              return await checkboxService.createReceipt(orderData);
            })(),
            8000,
            'CHECKBOX_TIMEOUT'
          );

          const perfReport = checkboxService.getPerformanceReport();

          if (receipt && receipt.id) {
            receiptId = receipt.id;
            receiptUrl = `https://check.checkbox.ua/${receipt.id}`;
            console.log(`[LiqPay Callback] Checkbox receipt created: ${receiptId}`);

            // Log performance on success
            await db.from('fiscal_performance_logs').insert({
              order_id: order_id,
              order_number: orderData.order_number,
              auth_ms: perfReport.auth_ms,
              shift_check_ms: perfReport.shift_check_ms,
              shift_open_ms: perfReport.shift_open_ms,
              receipt_creation_ms: perfReport.receipt_creation_ms,
              total_ms: perfReport.total_ms,
              status: 'success',
              api_url: checkboxService.baseUrl,
              cashier_name: checkboxService.cashierName
            }).catch(err => console.error('[LiqPay Callback] Failed to log success performance:', err));
          } else {
            console.error('[LiqPay Callback] Checkbox returned no receipt ID');
            receiptId = "ERROR_EMPTY";
            receiptUrl = "БЕЗ ЧЕКА: Сервіс Checkbox повернув порожній ID";
          }
        } catch (error) {
          const perfReport = checkboxService.getPerformanceReport();
          let errorType = 'error';

          if (error.message === 'CHECKBOX_TIMEOUT') {
            receiptId = "ERROR_TIMEOUT";
            receiptUrl = "БЕЗ ЧЕКА: Таймаут 8с (Checkbox не відповів)";
            console.warn('[LiqPay Callback] Fiscalization timed out.');
            errorType = 'timeout';
          } else {
            receiptId = "ERROR_API";
            receiptUrl = `БЕЗ ЧЕКА: Checkbox API помилка: ${error.message}`;
            console.error('[LiqPay Callback] Checkbox Fiscalization Failed:', error.message);
          }

          // Log performance even on error
          await db.from('fiscal_performance_logs').insert({
            order_id: order_id,
            order_number: orderData.order_number,
            auth_ms: perfReport.auth_ms,
            shift_check_ms: perfReport.shift_check_ms,
            shift_open_ms: perfReport.shift_open_ms,
            receipt_creation_ms: perfReport.receipt_creation_ms,
            total_ms: perfReport.total_ms,
            status: errorType,
            error_details: error.message,
            api_url: checkboxService.baseUrl
          }).catch(err => console.error('[LiqPay Callback] Failed to log performance error:', err));
        }

        // Гарантовано зберігаємо результат фіскалізації (успіх або опис помилки)
        console.log(`[LiqPay Callback] Updating order ${order_id} with fiscal status: ${receiptId}`);
        const { error: finalUpdateError } = await db
          .from('orders')
          .update({ 
            fiscal_receipt_id: receiptId,
            fiscal_receipt_url: receiptUrl
          })
          .eq('id', order_id);
          
        if (finalUpdateError) {
          finalUpdateErrorObj = finalUpdateError;
          console.error('[LiqPay Callback] Failed to save final receipt info to DB:', finalUpdateError);
        }
      } else {
        console.log('[LiqPay Callback] Order already has a fiscal receipt:', receiptId);
      }


      // 5. Notify n8n with FULL order data
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    
    if (webhookUrl) {
      try {
        console.log('[LiqPay Callback] Notifying n8n webhook (Start)');
        
        const n8nPayload = {
          source: 'liqpay_callback',
          order_id: order_id,
          order_number: orderData.order_number,
          status: 'paid',
          amount: payment.amount,
          currency: payment.currency,
          payment_id: payment.payment_id,
          customer: {
            email: orderData.email,
            name: orderData.full_name,
            phone: orderData.phone
          },
          items: orderData.items || [],
          fiscal_details: receiptId ? {
            id: receiptId,
            url: receiptUrl,
            total_duration: checkboxService.performanceLog.total_ms ? `${(checkboxService.performanceLog.total_ms / 1000).toFixed(1)} сек` : 'н/д'
          } : null
        };

        // Standard fetch without AbortController for simplicity and reliability in serverless context
        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload)
        });
        
        const responseText = await webhookRes.text();
        console.log('[LiqPay Callback] n8n response status:', webhookRes.status);
        console.log('[LiqPay Callback] n8n response body:', responseText.substring(0, 100)); // Log first 100 chars
        
      } catch (webhookErr) {
        console.error('[LiqPay Callback] n8n notification error:', webhookErr.message);
      }
    } else {
      console.warn('[LiqPay Callback] n8n webhook URL missing (check NEXT_PUBLIC_N8N_WEBHOOK_URL)');
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
