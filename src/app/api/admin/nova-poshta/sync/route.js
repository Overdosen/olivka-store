import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../../lib/supabase';

/**
 * Nova Poshta Manual Sync API
 * POST /api/admin/nova-poshta/sync
 */
export async function POST(req) {
  try {
    const { orderId, trackingNumber } = await req.json();

    if (!orderId || !trackingNumber) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const apiKey = process.env.NOVA_POSHTA_API_KEY || 'd5847e2383f7168f44172ca97ca6727d';

    // 1. Get status from Nova Poshta
    const npResponse = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      body: JSON.stringify({
        apiKey: apiKey,
        modelName: 'TrackingDocument',
        calledMethod: 'getStatusDocuments',
        methodProperties: {
          Documents: [
            {
              DocumentNumber: trackingNumber,
              Phone: ""
            }
          ]
        }
      })
    });

    const npData = await npResponse.json();

    if (!npData.success || !npData.data || npData.data.length === 0) {
      return NextResponse.json({ 
        error: npData.errors?.[0] || 'Помилка отримання даних з Нової Пошти' 
      }, { status: 400 });
    }

    const npInfo = npData.data[0];
    const statusCode = npInfo.StatusCode;

    // 2. Map NP Status to our internal status
    let newStatus = null;

    // Status mapping (consistent with webhook handler)
    if (['1', '2', '3', '4', '41', '5', '6'].includes(statusCode)) {
      newStatus = 'shipped'; // В дорозі / Створено
    } else if (['7', '8'].includes(statusCode)) {
      newStatus = 'arrived'; // Прибуло у відділення
    } else if (['9', '10', '11'].includes(statusCode)) {
      newStatus = 'delivered'; // Отримано
    } else if (['102', '103', '108'].includes(statusCode)) {
      newStatus = 'returned'; // Відмова / Повернення
    }

    if (!newStatus) {
      return NextResponse.json({ 
        message: 'Статус не потребує зміни', 
        npStatus: npInfo.Status,
        statusCode 
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

    return NextResponse.json({ 
      success: true, 
      newStatus, 
      npStatus: npInfo.Status,
      order: data 
    });

  } catch (error) {
    console.error('NP Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
