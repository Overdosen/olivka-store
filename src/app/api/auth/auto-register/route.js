import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../lib/supabase';

/**
 * Автоматична реєстрація клієнта при оформленні замовлення.
 * Якщо email вже існує — повертає наявний userId (пароль не змінюється).
 * Якщо новий — створює акаунт з паролем = 7 останніх цифр телефону.
 * Також оновлює замовлення: user_id, account_created, account_password_hint
 * через supabaseService (обходить RLS, anon-клієнт не може update).
 *
 * POST /api/auth/auto-register
 * Body: { email, fullName, phone, password, orderId }
 * Response: { userId, isNew }
 */
export async function POST(request) {
  try {
    const { email, fullName, phone, password, orderId } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!supabaseService) {
      console.error('[auto-register] supabaseService is not initialized');
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    let userId = null;
    let isNew   = false;

    // Спробуємо створити нового користувача
    const { data: newUserData, error: createError } = await supabaseService.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // підтверджуємо email одразу, без окремого листа
      user_metadata: {
        full_name: fullName || '',
        phone_ua:  phone    || '',
      },
    });

    if (createError) {
      const isAlreadyExists =
        createError.message?.toLowerCase().includes('already been registered') ||
        createError.message?.toLowerCase().includes('already exists') ||
        createError.status === 422;

      if (isAlreadyExists) {
        console.log(`[auto-register] User already exists: ${email} — looking up userId`);

        // 1. Спочатку шукаємо в profiles
        const { data: profile } = await supabaseService
          .from('profiles')
          .select('id')
          .ilike('email', email.trim())
          .maybeSingle();

        if (profile?.id) {
          userId = profile.id;
          console.log(`[auto-register] Found userId in profiles: ${userId}`);
        } else {
          // 2. Fallback: шукаємо напряму в auth.users через SQL функцію
          // (на випадок якщо профілю немає, але юзер існує в Auth)
          console.log(`[auto-register] Profile not found, querying auth.users via RPC...`);
          const { data: authUserId, error: rpcErr } = await supabaseService
            .rpc('get_auth_user_id_by_email', { user_email: email.trim() });

          if (rpcErr) {
            console.error('[auto-register] RPC error:', rpcErr);
          } else if (authUserId) {
            userId = authUserId;
            console.log(`[auto-register] Found userId in auth.users: ${userId}`);

            // Якщо профіль відсутній — створюємо його зараз
            await supabaseService.from('profiles').upsert({
              id:        userId,
              email:     email.toLowerCase().trim(),
              full_name: fullName || '',
              phone_ua:  phone    || '',
            }, { onConflict: 'id' });
          }
        }

        isNew = false;
      } else {
        console.error('[auto-register] createUser error:', createError);
        throw createError;
      }
    } else {
      userId = newUserData.user.id;
      isNew  = true;
      console.log(`[auto-register] New user created: ${email} → ${userId}`);

      // Upsert профілю
      const { error: profileError } = await supabaseService
        .from('profiles')
        .upsert({
          id:        userId,
          email:     email.toLowerCase().trim(),
          full_name: fullName || '',
          phone_ua:  phone    || '',
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('[auto-register] Profile upsert error:', profileError);
      }
    }

    // Оновлюємо замовлення через supabaseService (обходить RLS)
    if (orderId && userId) {
      const orderUpdate = { user_id: userId };
      if (isNew) {
        orderUpdate.account_created       = true;
        orderUpdate.account_password_hint = password; // password = last7
      }

      const { error: updateErr } = await supabaseService
        .from('orders')
        .update(orderUpdate)
        .eq('id', orderId);

      if (updateErr) {
        console.error('[auto-register] Order update error:', updateErr);
      } else {
        console.log(`[auto-register] Order ${orderId} updated → user_id=${userId}, isNew=${isNew}`);
      }
    }

    return NextResponse.json({ userId, isNew });

  } catch (error) {
    console.error('[auto-register] Critical error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
