import { supabaseService } from './supabase';

/**
 * Автоматична реєстрація клієнта при оформленні або оплаті замовлення.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.fullName
 * @param {string} params.phone
 * @param {string} params.password
 * @param {string} params.orderId
 * @returns {Promise<{userId: string, isNew: boolean}>}
 */
export async function autoRegisterUser({ email, fullName, phone, password, orderId }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (!supabaseService) {
    console.error('[auto-register-helper] supabaseService is not initialized');
    throw new Error('Service unavailable');
  }

  let userId = null;
  let isNew   = false;

  // Спробуємо створити нового користувача
  const { data: newUserData, error: createError } = await supabaseService.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true, // підтверджуємо email одразу
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
      console.log(`[auto-register-helper] User already exists: ${email} — looking up userId`);

      // 1. Спочатку шукаємо в profiles
      const { data: profile } = await supabaseService
        .from('profiles')
        .select('id')
        .ilike('email', email.trim())
        .maybeSingle();

      if (profile?.id) {
        userId = profile.id;
        console.log(`[auto-register-helper] Found userId in profiles: ${userId}`);
      } else {
        // 2. Fallback: шукаємо напряму в auth.users
        console.log(`[auto-register-helper] Profile not found, querying auth.users via RPC...`);
        const { data: authUserId, error: rpcErr } = await supabaseService
          .rpc('get_auth_user_id_by_email', { user_email: email.trim() });

        if (rpcErr) {
          console.error('[auto-register-helper] RPC error:', rpcErr);
        } else if (authUserId) {
          userId = authUserId;
          console.log(`[auto-register-helper] Found userId in auth.users: ${userId}`);

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
      console.error('[auto-register-helper] createUser error:', createError);
      throw createError;
    }
  } else {
    userId = newUserData.user.id;
    isNew  = true;
    console.log(`[auto-register-helper] New user created: ${email} → ${userId}`);

    // Створюємо профіль
    const { error: profileError } = await supabaseService
      .from('profiles')
      .upsert({
        id:        userId,
        email:     email.toLowerCase().trim(),
        full_name: fullName || '',
        phone_ua:  phone    || '',
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[auto-register-helper] Profile upsert error:', profileError);
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
      console.error('[auto-register-helper] Order update error:', updateErr);
    } else {
      console.log(`[auto-register-helper] Order ${orderId} updated → user_id=${userId}, isNew=${isNew}`);
    }
  }

  return { userId, isNew };
}
