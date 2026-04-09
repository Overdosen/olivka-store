'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('[ProtectedRoute] No user, redirecting to /admin/login');
        router.replace('/admin/login');
      } else if (profile && !profile.is_admin) {
        console.warn('[ProtectedRoute] Access denied: User is not an admin', user.email);
        router.replace('/');
      }
    }
  }, [loading, user, profile, router]);

  if (loading || !user || !profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
          <span className="font-cormorant text-xl italic">Перевірка доступу...</span>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] Access granted to admin panel for:', user.email);
  return <>{children}</>;
}
