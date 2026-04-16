import { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId) {
    console.log('[AuthContext] Fetching profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      console.log('[AuthContext] Profile loaded:', data);
      setProfile(data ?? null);
    } catch (err) {
      console.error('[AuthContext] Error fetching profile:', err);
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    const syncAuth = async (session) => {
      console.log('[AuthContext] syncAuth event:', !!session);
      if (!mounted) return;
      
      // Removed: setLoading(true) - this causes unmounting of children in ProtectedRoute
      // on every background session sync (e.g. when window is focused).
      
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      console.log('[AuthContext] syncAuth complete');
      setLoading(false);
    };

    // Отримуємо початкову сесію
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        // Застарілий токен або інша помилка сесії
        console.warn('[AuthContext] getSession error:', error.message);
        
        // Якщо токен не знайдено — примусово чистимо локальний стан
        if (error.message.includes('Refresh Token Not Found') || error.status === 400) {
          supabase.auth.signOut({ scope: 'local' }).finally(() => {
            if (mounted) {
              setUser(null);
              setProfile(null);
              setLoading(false);
            }
          });
          return;
        }
        
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      syncAuth(session);
    });

    // Підписуємось на зміни
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        syncAuth(session);
      } else if (event === 'USER_UPDATED') {
        syncAuth(session);
      } else if (event === 'SIGNED_IN') {
        syncAuth(session);
      } else {
        // Невідомий event або помилка refresh — перевіряємо сесію
        if (!session) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          syncAuth(session);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /** Реєстрація */
  async function signUp({ email, password, firstName, lastName, phoneUa, isInternational }) {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:  fullName,
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          phone_ua:   phoneUa || null,
          is_international: isInternational || false,
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id:               data.user.id,
        email:            email,
        full_name:        fullName,
        phone_ua:         phoneUa || null,
        is_international: isInternational || false,
      }, { onConflict: 'id' });
      
      if (profileError) {
        console.error('[AuthContext] Profile creation error:', profileError);
        throw new Error(`Помилка створення профілю: ${profileError.message}`);
      }

      // Відразу підтягуємо профіль у стан
      await fetchProfile(data.user.id);
    }

    return data;
  }

  /** Вхід */
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  /** Вихід */
  async function signOut() {
    await supabase.auth.signOut();
  }

  /** Оновлення профілю */
  async function updateProfile(updates) {
    if (!user) throw new Error('Не авторизовано');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
