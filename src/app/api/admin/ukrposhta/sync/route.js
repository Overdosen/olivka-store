import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../../lib/supabase';
import { sendShippingUpdateEmail } from '../../../../../lib/email-service';
import { requireAdmin } from '../../../../../lib/admin-auth';

/**
 * Ukrposhta Manual Sync API
 * POST /api/admin/ukrposhta/sync
 */
export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { orderId, trackingNumber } = await req.json();

    if (!orderId || !trackingNumber) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const bearerToken = process.env.NEXT_PUBLIC_UKRPOST_TRACKING_BEARER || process.env.NEXT_PUBLIC_UKRPOST_BEARER;

    if (!bearerToken) {
      return NextResponse.json({ error: 'Відсутній токен Укрпошти в налаштуваннях' }, { status: 500 });
    }

    // 1. Отримуємо статус з Укрпошти через StatusTracking API
    // Це правильний API для відстеження будь-яких ТТН
    const upResponse = await fetch(`https://www.ukrposhta.ua/status-tracking/0.0.1/statuses?barcode=${encodeURIComponent(trackingNumber)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Accept': 'application/json'
      }
    });

    if (!upResponse.ok) {
       console.error(`Ukrposhta API error: ${upResponse.status} ${upResponse.statusText}`);
       const text = await upResponse.text();
       console.error(`Ukrposhta response: ${text}`);
       
       if (upResponse.status === 403 || text.includes('900908')) {
         return NextResponse.json({ 
           error: 'У вашого ключа немає доступу до Status Tracking API. Перевірте підписки в кабінеті розробника.' 
         }, { status: 403 });
       }
       
       return NextResponse.json({ 
         error: `Помилка отримання даних з Укрпошти: ${upResponse.statusText}` 
       }, { status: 400 });
    }

    const upData = await upResponse.json();

    // Зазвичай Укрпошта повертає масив статусів, де останній елемент - це поточний стан
    if (!Array.isArray(upData) || upData.length === 0) {
      return NextResponse.json({ 
        error: 'Відправлення не знайдено або немає статусів' 
      }, { status: 400 });
    }

    // Відсортуємо за датою для надійності
    const sortedStatuses = upData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestStatus = sortedStatuses[sortedStatuses.length - 1];
    
    // Назва статусу (eventName)
    const eventName = (latestStatus.eventName || latestStatus.name || '').toLowerCase();

    // 2. Map UP Status to our internal status
    let newStatus = null;

    if (eventName.includes('вручен') || eventName.includes('одержан')) {
      newStatus = 'delivered'; // Вручено / Одержано
    } else if (eventName.includes('точці видачі') || eventName.includes('прибул') || eventName.includes('відділенн') || eventName.includes('очікує')) {
      newStatus = 'arrived'; // Знаходиться в точці видачі / Прибуло
    } else if (eventName.includes('повернен') || eventName.includes('відмов')) {
      newStatus = 'returned'; // Повернення
    } else if (eventName.includes('прийнят') || eventName.includes('відправлен') || eventName.includes('прямує') || eventName.includes('оброблен')) {
      newStatus = 'shipped'; // Прийняте / Прямує / Відправлене
    }

    if (!newStatus) {
      return NextResponse.json({ 
        message: 'Статус не потребує зміни або невідомий статус', 
        upStatus: latestStatus.eventName || latestStatus.name,
        raw: latestStatus
      });
    }

    // 3. Update order in DB
    const { data, error } = await supabaseService
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // 4. Відправляємо лист, якщо статус підходящий
    if (['shipped', 'arrived', 'delivered'].includes(newStatus)) {
      await sendShippingUpdateEmail(orderId, newStatus);
    }

    return NextResponse.json({ 
      success: true, 
      newStatus, 
      upStatus: latestStatus.eventName || latestStatus.name,
      order: data 
    });

  } catch (error) {
    console.error('UP Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
