'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Вітаємо в адмін-панелі!');
      router.push('/admin');
    } catch (error) {
      toast.error('Помилка входу: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl shadow-stone-200/50 border border-stone-200/60 overflow-hidden p-8 md:p-10 space-y-10">
        
        <div className="text-center">
          <h2 className="text-4xl font-cormorant font-bold text-stone-800 tracking-tight">Olivka<span className="text-stone-400 font-light">Admin</span></h2>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="h-px w-8 bg-stone-200"></div>
            <p className="text-stone-400 text-xs uppercase tracking-[0.2em] font-semibold">Вхід до панелі</p>
            <div className="h-px w-8 bg-stone-200"></div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all font-medium text-stone-800"
              placeholder="admin@olivka.store"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider ml-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all font-medium text-stone-800"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 hover:bg-stone-900 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 flex justify-center items-center space-x-3 shadow-lg shadow-stone-200 disabled:opacity-70 group"
          >
            {loading ? (
              <span className="animate-pulse">Перевірка доступу...</span>
            ) : (
              <>
                <span className="tracking-wide">Увійти в систему</span>
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-stone-400 text-[10px] uppercase tracking-widest font-medium">© 2024 Store Olivka • Захищена зона</p>
        </div>
        
      </div>
    </div>
  );
}
