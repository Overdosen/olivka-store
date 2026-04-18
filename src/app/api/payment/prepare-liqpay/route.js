import { NextResponse } from 'next/server';
import { LiqPay } from '../../../../lib/liqpay';

export async function POST(request) {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY?.trim();
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim();
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const baseUrl = rawBaseUrl 
    ? (rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`) 
    : new URL(request.url).origin;

  // Логування для діагностики в терміналі
  console.log('[Prepare LiqPay] Checking environment variables...');
  console.log('[Prepare LiqPay] publicKey loaded:', publicKey ? `${publicKey.slice(0, 12)}...` : 'undefined');

  if (!publicKey || !privateKey) {
    console.error('[Prepare LiqPay] Missing LiqPay keys in environment variables');
    return NextResponse.json({ 
      error: 'Конфігурація LiqPay (ключі) відсутня на сервері. Перевірте .env.local та перезапустіть сервер.' 
    }, { status: 500 });
  }

  const liqpay = new LiqPay(publicKey, privateKey);
  const isSandbox = process.env.LIQPAY_SANDBOX === '1';

  if (isSandbox) {
    console.log('[Prepare LiqPay] Sandbox mode is ENABLED');
  }

  try {
    const { orderId, amount, description, order_number } = await request.json();
    console.log(`[Prepare LiqPay] Starting request for OrderID: ${orderId}`);
    const apiStartTime = Date.now();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 });
    }

    // Визначаємо базу для URL: пріоритет env, інакше поточний origin
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    // Prepare parameters for LiqPay
    const displayNum = order_number ? `№${order_number}` : '';
    const params = {
      action: 'pay',
      amount: amount,
      currency: 'UAH',
      description: description || `Оплата замовлення ${displayNum} в Store Olivka`.trim(),
      order_id: orderId,
      version: 3,
      result_url: `${baseUrl}/payment/success?order_id=${orderId}&method=liqpay`,
      server_url: `${baseUrl}/api/payment/liqpay-callback`,
    };

    if (isSandbox) {
      params.sandbox = 1;
    }

    const { data, signature } = liqpay.cnfg_generate(params);

    const apiEndTime = Date.now();
    console.log(`[Prepare LiqPay] Finished for ${orderId}. Processing took ${apiEndTime - apiStartTime}ms`);

    return NextResponse.json({ data, signature });
  } catch (error) {
    console.error('[Prepare LiqPay] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
