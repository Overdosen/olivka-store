import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useContext(AuthContext);

  console.log('[ProtectedRoute] state:', {
    user: user?.email,
    profileLoaded: !!profile,
    isAdmin: profile?.is_admin,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
          <span className="font-cormorant text-xl italic">Перевірка доступу...</span>
        </div>
      </div>
    );
  }

  // Якщо не залогінений
  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to /admin/login');
    return <Navigate to="/admin/login" replace />;
  }

  // Якщо залогінений, але не адмін
  if (!profile?.is_admin) {
    console.warn('[ProtectedRoute] Access denied: User is not an admin', user.email);
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] Access granted to admin panel for:', user.email);
  return children;
}
