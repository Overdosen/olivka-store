import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // При помилці refresh token — автоматично виходимо
    onAuthStateChange: undefined,
  },
  global: {
    // Перехоплюємо мережеві помилки refresh-запитів
    fetch: async (url, options) => {
      try {
        return await fetch(url, options);
      } catch (err) {
        console.warn('[supabase] fetch error:', err.message);
        throw err;
      }
    },
  },
});

// Клієнт для серверних операцій (обхід RLS)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey && typeof window === 'undefined') {
  console.warn('[Supabase] Service Role Key is missing. Server-side operations requiring RLS bypass will fail.');
}

export const supabaseService = (supabaseUrl && serviceKey) 
  ? createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }) 
  : null;

// \u041f\u0435\u0440\u0435\u0445\u043e\u043f\u043b\u044e\u0454\u043c\u043e \u0437\u0430\u0441\u0442\u0430\u0440\u0456\u043b\u0438\u0439 refresh \u0442\u043e\u043a\u0435\u043d \u0442\u0430 \u0432\u0438\u043a\u043e\u043d\u0443\u0454\u043c\u043e signOut
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' && !session) {
      // \u0422\u043e\u043a\u0435\u043d \u043d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043d\u043e\u0432\u0438\u0442\u0438 — \u0447\u0438\u0441\u0442\u0438\u043c\u043e
      supabase.auth.signOut();
    }
  });
}
