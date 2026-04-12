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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-md shadow-xl overflow-hidden p-8 space-y-8">
        
        <div className="text-center">
          <h2 className="text-3xl font-cormorant font-bold text-stone-800">Store Olivka</h2>
          <p className="text-stone-500 mt-2 font-inter">Вхід в панель керування</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 block text-left">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
              placeholder="admin@olivka.store"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 block text-left">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-800 hover:bg-stone-900 text-white font-medium py-3 px-4 rounded transition-colors flex justify-center items-center space-x-2 disabled:opacity-70"
          >
            {loading ? (
              <span className="animate-pulse">Перевірка...</span>
            ) : (
              <>
                <span>Увійти</span>
                <LogIn className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>
        
      </div>
    </div>
  );
}
