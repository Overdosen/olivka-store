import { NextResponse } from 'next/server';
import { checkboxService } from '../../../lib/checkbox';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'olivka-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Test Fiscal] Starting test receipt creation...');
    
    // Test data similar to Order #155
    const testOrder = {
      order_number: 999,
      total: 15,
      email: 'denisopin@gmail.com',
      full_name: 'Test Customer',
      items: [
        {
          qty: 1,
          price: 15,
          name: 'Тестові Шкарпетки (x1000 fix)',
          product_id: 'test-socks-1'
        }
      ]
    };

    const receipt = await checkboxService.createReceipt(testOrder);

    return NextResponse.json({
      status: 'success',
      message: 'Test receipt created successfully',
      receipt_id: receipt.id,
      receipt_url: `https://check.checkbox.ua/${receipt.id}`,
      sent_payload_details: {
        item_qty_sent: 1000,
        item_price_sent: 1500,
        item_sum_sent: 1500
      }
    });

  } catch (error) {
    console.error('[Test Fiscal] Error:', error.message);
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}
