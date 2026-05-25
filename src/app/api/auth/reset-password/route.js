import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!supabaseService) {
      console.error('[reset-password] supabaseService is not initialized');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    const targetEmail = email.toLowerCase().trim();

    // 1. Шукаємо користувача в таблиці profiles
    const { data: profile, error: profileErr } = await supabaseService
      .from('profiles')
      .select('id, phone_ua')
      .ilike('email', targetEmail)
      .maybeSingle();

    if (profileErr) {
      console.error('[reset-password] Profile query error:', profileErr);
      return NextResponse.json({ error: 'Помилка бази даних' }, { status: 500 });
    }

    let userId = profile?.id;
    let phoneUa = profile?.phone_ua;

    // 2. Якщо профілю немає або там немає телефону, можна спробувати знайти в auth.users 
    // через RPC та подивитись raw_user_meta_data
    if (!userId || !phoneUa) {
      console.log(`[reset-password] Phone not found in profiles for ${targetEmail}, checking auth.users...`);
      
      const { data: authUserId, error: rpcErr } = await supabaseService
        .rpc('get_auth_user_id_by_email', { user_email: targetEmail });
        
      if (authUserId) {
        userId = authUserId;
        
        // Отримуємо самого юзера з Auth
        const { data: userData } = await supabaseService.auth.admin.getUserById(userId);
        if (userData?.user?.user_metadata?.phone_ua) {
          phoneUa = userData.user.user_metadata.phone_ua;
        }
      }
    }

    if (!userId) {
      // Для безпеки ми можемо повертати 404, але зазвичай краще повертати універсальну відповідь 
      // щоб не було перебору email-ів. Але оскільки ми кажемо клієнту "скинуто", тут можна повернути помилку.
      return NextResponse.json({ error: 'Користувача з таким Email не знайдено' }, { status: 404 });
    }

    if (!phoneUa || phoneUa.replace(/\D/g, '').length < 7) {
      return NextResponse.json({ error: 'У профілі відсутній номер телефону для відновлення' }, { status: 400 });
    }

    // 3. Формуємо новий пароль (7 останніх цифр)
    const digitsOnly = phoneUa.replace(/\D/g, '');
    const last7 = digitsOnly.slice(-7);

    // 4. Оновлюємо пароль
    const { error: updateErr } = await supabaseService.auth.admin.updateUserById(userId, {
      password: last7
    });

    if (updateErr) {
      console.error('[reset-password] Error updating password:', updateErr);
      return NextResponse.json({ error: 'Не вдалося оновити пароль' }, { status: 500 });
    }

    console.log(`[reset-password] Password reset for user ${targetEmail} (ID: ${userId}) to last7`);

    return NextResponse.json({ success: true, message: 'Пароль успішно змінено' });

  } catch (error) {
    console.error('[reset-password] Critical error:', error);
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
