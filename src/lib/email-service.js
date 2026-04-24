import { Resend } from 'resend';
import { supabaseService } from './supabase';
import { getOrderEmailHtml } from '../components/emails/OrderEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Відправляє лист клієнту та повідомлення адміну про нове замовлення.
 * @param {string} orderId - ID замовлення в Supabase
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendOrderConfirmationEmail(orderId) {
  try {
    console.log(`[Email Service] Starting sendOrderConfirmationEmail for orderId: ${orderId}`);
    if (!orderId) throw new Error('Order ID is required');
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');

    if (!supabaseService) {
      throw new Error('supabaseService is not initialized');
    }

    // 1. Отримуємо дані замовлення
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[Email Service] Order not found:', orderError);
      return { success: false, error: 'Order not found' };
    }

    // 2. Генеруємо HTML (OrderEmail.jsx повертає рядок HTML)
    const emailHtml = getOrderEmailHtml(order);

    // 3. Відправляємо лист клієнту
    console.log(`[Email Service] Attempting to send email to ${order.email} for order ${order.order_number || order.id}`);
    
    const { data: clientEmail, error: clientError } = await resend.emails.send({
      from: 'Store Olivka <order@olivka.store>',
      to: [order.email],
      subject: `Замовлення №${order.order_number || order.id.slice(0, 8)} прийнято!`,
      html: emailHtml,
    });

    if (clientError) {
      console.error('[Email Service] Resend Client Error:', clientError);
    } else {
      console.log('[Email Service] Client email sent successfully:', clientEmail.id);
    }

    // 4. Відправляємо лист адміністратору
    await resend.emails.send({
      from: 'Store Olivka System <order@olivka.store>',
      to: ['olivka.hello@gmail.com'],
      subject: `🔥 Нове замовлення №${order.order_number} (${order.total} грн)`,
      html: `
        <h2>Нове замовлення на сайті!</h2>
        <p><strong>Замовник:</strong> ${order.full_name}</p>
        <p><strong>Сума:</strong> ${order.total} грн</p>
        <p><strong>Спосіб оплати:</strong> ${order.payment_method}</p>
        <p><strong>Телефон:</strong> ${order.phone}</p>
        <hr>
        <p>Повний опис замовлення відправлено клієнту на ${order.email}</p>
        <a href="https://olivka.store/admin/orders/${order.id}" style="padding: 10px 20px; background: #524f25; color: white; text-decoration: none; border-radius: 5px;">Відкрити в адмінці</a>
      `,
    });

    return { 
      success: true, 
      clientEmailId: clientEmail?.id 
    };

  } catch (error) {
    console.error('[Email Service] Error:', error);
    return { success: false, error: error.message };
  }
}
