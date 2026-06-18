import { NextResponse } from 'next/server';
import { autoRegisterUser } from '../../../../lib/auto-register';

/**
 * Автоматична реєстрація клієнта при оформленні замовлення.
 * (використовує спільний модуль)
 */
export async function POST(request) {
  try {
    const { email, fullName, phone, password, orderId } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await autoRegisterUser({ email, fullName, phone, password, orderId });
    return NextResponse.json(result);

  } catch (error) {
    console.error('[auto-register] Critical error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
