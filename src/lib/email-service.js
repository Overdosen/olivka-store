import { Resend } from 'resend';
import { supabaseService } from './supabase';
import { getOrderEmailHtml } from '../components/emails/OrderEmail';
import { getShippingEmailHtml } from '../components/emails/ShippingEmail';

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
      bcc: ['olivka.hello@gmail.com'],
      subject: `Замовлення №${order.order_number || order.id.slice(0, 8)} прийнято!`,
      html: emailHtml,
    });

    if (clientError) {
      console.error('[Email Service] Resend Client Error:', clientError);
    } else {
      console.log('[Email Service] Client email sent successfully:', clientEmail.id);
    }

    return { 
      success: true, 
      clientEmailId: clientEmail?.id 
    };

  } catch (error) {
    console.error('[Email Service] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Відправляє лист клієнту та адміну про зміну статусу доставки.
 * @param {string} orderId - ID замовлення в Supabase
 * @param {string} newStatus - Новий статус ('shipped', 'arrived', 'delivered')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendShippingUpdateEmail(orderId, newStatus) {
  try {
    console.log(`[Email Service] Starting sendShippingUpdateEmail for orderId: ${orderId}, status: ${newStatus}`);
    if (!orderId) throw new Error('Order ID is required');
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');

    if (!supabaseService) {
      throw new Error('supabaseService is not initialized');
    }

    // Отримуємо дані замовлення
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[Email Service] Order not found:', orderError);
      return { success: false, error: 'Order not found' };
    }

    // Перевіряємо, чи лист вже був відправлений
    if (order.shipping_email_sent) {
      console.log(`[Email Service] Shipping email already sent for order ${orderId}. Skipping.`);
      return { success: true, skipped: true };
    }

    // Генеруємо HTML
    const emailHtml = getShippingEmailHtml(order, newStatus);

    // Визначаємо тему листа залежно від статусу
    let subjectText = 'Ваша посилка вирушила до вас!';
    if (newStatus === 'arrived') subjectText = 'Ваша посилка прибула у відділення!';
    if (newStatus === 'delivered') subjectText = 'Вашу посилку успішно доставлено!';

    // Відправляємо лист
    console.log(`[Email Service] Sending shipping email to ${order.email}`);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Store Olivka <order@olivka.store>',
      to: [order.email],
      bcc: ['olivka.hello@gmail.com'],
      subject: `Замовлення №${order.order_number || order.id.slice(0, 8)}: ${subjectText}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('[Email Service] Resend Shipping Error:', emailError);
      return { success: false, error: emailError.message };
    }

    // Оновлюємо статус відправки в БД
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({ shipping_email_sent: true })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Email Service] Failed to update shipping_email_sent flag:', updateError);
      // Лист відправлено успішно, тому не повертаємо помилку відправки, але логуємо
    }

    return { 
      success: true, 
      emailId: emailData?.id 
    };

  } catch (error) {
    console.error('[Email Service] Shipping Update Error:', error);
    return { success: false, error: error.message };
  }
}
