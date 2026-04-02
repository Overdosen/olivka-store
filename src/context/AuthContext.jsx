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
      
      setLoading(true); // <--- Force loading true while we sync
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      console.log('[AuthContext] syncAuth complete, setting loading false');
      setLoading(false);
    };

    // Отримуємо початкову сесію
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncAuth(session);
    });

    // Підписуємось на зміни
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // При SIGNED_OUT відразу ставимо loading false
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else {
        syncAuth(session);
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
      await supabase.from('profiles').upsert({
        id:               data.user.id,
        email:            email,
        full_name:        fullName,
        phone_ua:         phoneUa || null,
        is_international: isInternational || false,
      }, { onConflict: 'id' });
      
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
