import { NextResponse } from 'next/server';
import { LiqPay } from '../../../../lib/liqpay';

export async function POST(request) {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY?.trim();
  const privateKey = process.env.LIQPAY_PRIVATE_KEY?.trim();

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

  try {
    const { orderId, amount, description } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 });
    }

    // Визначаємо базу для URL: пріоритет env, інакше поточний origin
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    // Prepare parameters for LiqPay
    const params = {
      action: 'pay',
      amount: amount,
      currency: 'UAH',
      description: description || `Оплата замовлення #${orderId.slice(0, 8).toUpperCase()} в Store Olivka`,
      order_id: orderId,
      version: 3,
      result_url: `${baseUrl}/payment/success?order_id=${orderId}`,
      server_url: `${baseUrl}/api/payment/liqpay-callback`,
    };

    const { data, signature } = liqpay.cnfg_generate(params);

    return NextResponse.json({ data, signature });
  } catch (error) {
    console.error('[Prepare LiqPay] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
