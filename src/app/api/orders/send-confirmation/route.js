import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '../../../../lib/email-service';

export async function POST(request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const result = await sendOrderConfirmationEmail(orderId);
    console.log(`[Email API] Service result for ${orderId}:`, result);

    if (!result.success) {
      console.error(`[Email API] Failed to send email for ${orderId}:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Email API] Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
