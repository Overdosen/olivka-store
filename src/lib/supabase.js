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


