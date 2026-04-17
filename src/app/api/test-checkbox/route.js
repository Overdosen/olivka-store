import { NextResponse } from 'next/server';
import { checkboxService } from '../../../lib/checkbox';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple security check
  if (secret !== 'olivka-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Checkbox Debug] Starting manual test...');
    
    // 1. Test Authentication
    console.log('[Checkbox Debug] Testing authentication...');
    const token = await checkboxService.authenticate();
    console.log('[Checkbox Debug] Auth successful, token obtained.');

    // 2. Test Shift Status
    console.log('[Checkbox Debug] Checking shift...');
    const shift = await checkboxService.ensureShiftOpened();
    console.log('[Checkbox Debug] Shift status:', shift.status);

    // 3. Dummy Order for Receipt
    const dummyOrder = {
      order_number: 9999,
      email: 'denisopin@gmail.com',
      full_name: 'Debug Test',
      total: 10,
      items: [
        {
          product_id: 'test-p-1',
          name: 'Тестовий товар',
          price: 10,
          qty: 1,
          sku: 'TEST-SKU'
        }
      ]
    };

    console.log('[Checkbox Debug] Attempting to create dummy receipt...');
    const receipt = await checkboxService.createReceipt(dummyOrder);
    console.log('[Checkbox Debug] Receipt created successfully:', receipt.id);

    return NextResponse.json({
      status: 'success',
      auth: 'ok',
      shift: shift.status,
      receipt_id: receipt.id,
      receipt_url: `https://check.checkbox.ua/${receipt.id}`
    });

  } catch (error) {
    console.error('[Checkbox Debug] Test Failed:', error.message);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
