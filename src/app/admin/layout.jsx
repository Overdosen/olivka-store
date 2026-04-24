'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Package, LayoutDashboard, LogOut, Users, Menu, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProtectedRoute from './ProtectedRoute';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // If we are on the login page, don't show the sidebar, just the content
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (err) {
      console.warn('[AdminLayout] Logout technical error:', err);
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { name: 'Статистика', path: '/admin', icon: LayoutDashboard },
    { name: 'Товари', path: '/admin/products', icon: Package },
    { name: 'Категорії', path: '/admin/categories', icon: Package },
    { name: 'Клієнти', path: '/admin/customers', icon: Users },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-8 border-b border-stone-200/60 flex items-center justify-between h-24">
        <h2 className="text-3xl font-cormorant font-bold text-stone-800 tracking-tight">
          Olivka<span className="text-stone-400 font-light">Admin</span>
        </h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden p-2 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-4 p-3.5 rounded-md transition-all duration-300 ${isActive
                  ? '!bg-stone-900 !text-white shadow-md shadow-stone-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? '!text-stone-300' : ''}`} />
              <span className="font-medium tracking-wide text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-stone-200/60">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`group flex items-center justify-center space-x-2 text-stone-500 hover:bg-red-50 hover:text-red-600 p-3.5 rounded-md transition-all duration-300 w-full font-medium ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoggingOut ? (
            <span className="text-sm tracking-wide">Вихід...</span>
          ) : (
            <>
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm tracking-wide">Вийти</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col md:flex-row h-screen bg-[#FDFBF7] font-inter text-stone-900 selection:bg-stone-200 overflow-hidden">

        {/* Mobile Header */}
        <header className="md:hidden h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-6 z-20">
          <h2 className="text-xl font-cormorant font-bold text-stone-800 tracking-tight">
            Olivka<span className="text-stone-400 font-light">Admin</span>
          </h2>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-stone-600 hover:bg-stone-100 rounded-md transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Sidebar Overlay (Mobile Only) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-30 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-md border-r border-stone-200/60 
          flex flex-col z-40 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-10
        `}>
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto relative custom-scrollbar">
          <div className="max-w-6xl mx-auto p-4 md:p-10 md:pt-12 pb-20">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
