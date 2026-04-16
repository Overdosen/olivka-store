import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Будь ласка, заповніть усі поля' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Olivka Store <onboarding@resend.dev>',
      to: ['olivka.hello@gmail.com'],
      subject: `Нове повідомлення від ${name}`,
      replyTo: email,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #524f25; border-bottom: 2px solid #524f25; padding-bottom: 10px;">Нове повідомлення з сайту</h2>
          <p><strong>Ім'я:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <div style="background: #fdfaf6; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #524f25;">
            <p style="margin-top: 0;"><strong>Повідомлення:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
            Ви можете відповісти на цей лист прямо у вашій пошті — відповідь прийде клієнту.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Виникла помилка при відправці повідомлення' },
      { status: 500 }
    );
  }
}
