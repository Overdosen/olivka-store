import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../lib/supabase';

/**
 * Nova Poshta Webhook Handler
 * Documentation: https://devcenter.novaposhta.ua/docs/services/common/operations/push_notifications
 * 
 * StatusCode Mapping for our project:
 * - 4, 5, 6, 7 -> shipped (Відправлено)
 * - 8 -> arrived (Прибуло у відділення)
 * - 9, 10, 11 -> delivered (Отримано)
 * - 102, 103, 108 -> returned (Повернуто клієнтом)
 */

const NP_STATUS_TO_INTERNAL = {
  '4': 'shipped',
  '5': 'shipped',
  '6': 'shipped',
  '7': 'shipped',
  '8': 'arrived',
  '9': 'delivered',
  '10': 'delivered',
  '11': 'delivered',
  '102': 'returned',
  '103': 'returned',
  '108': 'returned',
};

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log('[NovaPoshta Webhook] Received payload:', JSON.stringify(payload, null, 2));

    if (!payload.data || !Array.isArray(payload.data)) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }

    const updates = [];

    for (const item of payload.data) {
      const ttn = item.Number;
      const npStatusCode = item.StatusCode;
      
      if (!ttn || !npStatusCode) continue;

      const internalStatus = NP_STATUS_TO_INTERNAL[npStatusCode];

      if (internalStatus) {
        console.log(`[NovaPoshta Webhook] Updating TTN ${ttn}: NP Status ${npStatusCode} -> Internal Status ${internalStatus}`);
        
        const { data, error } = await supabaseService
          .from('orders')
          .update({ status: internalStatus })
          .eq('tracking_number', ttn)
          .select();

        if (error) {
          console.error(`[NovaPoshta Webhook] Error updating order with TTN ${ttn}:`, error);
        } else {
          updates.push({ ttn, status: internalStatus, count: data?.length || 0 });
        }
      } else {
        console.log(`[NovaPoshta Webhook] TTN ${ttn}: Status ${npStatusCode} not mapped, skipping.`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: updates.length,
      details: updates 
    });

  } catch (error) {
    console.error('[NovaPoshta Webhook] Global error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
