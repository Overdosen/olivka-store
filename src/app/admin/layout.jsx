'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingBag, Users, Package, FolderOpen,
  LogOut, Menu, X, ChevronRight, Plus, DollarSign, MessageSquare, Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProtectedRoute from './ProtectedRoute';
import CommandPalette from '../../components/admin/ui/CommandPalette';
import NotificationBell from '../../components/admin/ui/NotificationBell';

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Замовлення', path: '/admin/orders', icon: ShoppingBag, badge: true },
      { name: 'Клієнти', path: '/admin/customers', icon: Users },
      { name: 'Відгуки', path: '/admin/reviews', icon: MessageSquare, reviewsBadge: true },
    ],
  },
  {
    label: 'Каталог',
    items: [
      { name: 'Товари', path: '/admin/products', icon: Package },
      { name: 'Категорії', path: '/admin/categories', icon: FolderOpen },
      { name: 'Інші витрати', path: '/admin/expenses', icon: DollarSign },
    ],
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newReviewsCount, setNewReviewsCount] = useState(0);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      setNewOrdersCount(count || 0);
    }
    fetchCount();

    const channel = supabase
      .channel('sidebar-orders-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    async function fetchReviewsCount() {
      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);
      setNewReviewsCount(count || 0);
    }
    fetchReviewsCount();

    const channel = supabase
      .channel('sidebar-reviews-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchReviewsCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
      console.warn('[AdminLayout] Logout error:', err);
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  const currentPage = NAV_SECTIONS.flatMap(s => s.items).find(i => isActive(i.path));

  return (
    <ProtectedRoute>
      <div className="admin-shell flex h-screen overflow-hidden" style={{ 
        background: '#f8f8f6',
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        color: '#1c1917',
        WebkitFontSmoothing: 'antialiased',
      }}>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 md:hidden"
            style={{ backgroundColor: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ═══ SIDEBAR ═══ */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex flex-col
            transform transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 md:static md:z-10
          `}
          style={{
            width: '248px',
            background: 'linear-gradient(180deg, #1c1917 0%, #292524 100%)',
            borderRight: 'none',
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5" style={{ height: '64px' }}>
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <img
                src="/favicon.png"
                alt="Store Olivka Logo"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
              <div>
                <span style={{ color: '#fafaf9', fontSize: '15px', fontWeight: '600', letterSpacing: '-0.01em' }}>
                  Store Olivka
                </span>
                <span style={{ color: '#78716c', fontSize: '15px', fontWeight: '400', marginLeft: '4px' }}>
                  CRM
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden flex items-center justify-center"
              style={{ width: '32px', height: '32px', borderRadius: '8px', color: '#78716c' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-5 px-3 space-y-6 overflow-y-auto custom-scrollbar">
            {NAV_SECTIONS.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <p style={{
                    fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#57534e', padding: '0 12px', marginBottom: '8px',
                  }}>
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center gap-3 group"
                        style={{
                          padding: '9px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: active ? '600' : '500',
                          transition: 'all 0.15s ease',
                          color: active ? '#fafaf9' : '#a8a29e',
                          background: active ? 'rgba(250,250,249,0.08)' : 'transparent',
                          ...(active ? {
                            boxShadow: 'inset 0 0 0 1px rgba(250,250,249,0.06)',
                          } : {}),
                        }}
                        onMouseEnter={e => {
                          if (!active) {
                            e.currentTarget.style.color = '#d6d3d1';
                            e.currentTarget.style.background = 'rgba(250,250,249,0.04)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!active) {
                            e.currentTarget.style.color = '#a8a29e';
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px', opacity: active ? 0.9 : 0.5 }} />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && newOrdersCount > 0 && (
                          <span style={{
                            minWidth: '20px', height: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: '700',
                            borderRadius: '6px', padding: '0 6px',
                            background: active ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.7)',
                            color: '#fff',
                          }}>
                            {newOrdersCount}
                          </span>
                        )}
                        {item.reviewsBadge && newReviewsCount > 0 && (
                          <span style={{
                            minWidth: '20px', height: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: '700',
                            borderRadius: '6px', padding: '0 6px',
                            background: active ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.7)',
                            color: '#fff',
                          }}>
                            {newReviewsCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Quick action */}
          <div className="px-3 pb-2">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 justify-center"
              style={{
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#a8a29e',
                border: '1px dashed rgba(168,162,158,0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(168,162,158,0.5)';
                e.currentTarget.style.color = '#d6d3d1';
                e.currentTarget.style.background = 'rgba(250,250,249,0.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(168,162,158,0.3)';
                e.currentTarget.style.color = '#a8a29e';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              Новий товар
            </Link>
          </div>

          {/* Logout */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="group flex items-center gap-3 w-full"
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#78716c',
                transition: 'all 0.15s ease',
                opacity: isLoggingOut ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fca5a5';
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#78716c';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut style={{ width: '18px', height: '18px', transition: 'transform 0.15s ease' }} />
              <span>{isLoggingOut ? 'Вихід...' : 'Вийти'}</span>
            </button>
          </div>
        </aside>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* ─── TOP BAR ─── */}
          <header
            className="flex items-center justify-between flex-shrink-0"
            style={{
              height: '64px',
              padding: '0 20px',
              background: '#fff',
              borderBottom: '1px solid #e7e5e4',
              boxShadow: '0 1px 3px rgba(28,25,23,0.03)',
            }}
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden flex items-center justify-center"
                style={{ width: '36px', height: '36px', borderRadius: '8px', color: '#57534e', background: '#f5f5f4' }}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Mobile logo */}
              <div className="md:hidden flex items-center gap-2">
                <img
                  src="/favicon.png"
                  alt="Store Olivka Logo"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    objectFit: 'cover'
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1c1917' }}>Store Olivka</span>
              </div>

              {/* Breadcrumb (desktop) */}
              <div className="hidden md:flex items-center gap-2" style={{ fontSize: '13px', color: '#a8a29e' }}>
                {pathname === '/admin/dashboard' ? (
                  <span style={{ color: '#44403c', fontWeight: '600' }}>Dashboard</span>
                ) : (
                  <>
                    <Link href="/admin/dashboard" style={{ transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#57534e'}
                      onMouseLeave={e => e.currentTarget.style.color = '#a8a29e'}
                    >
                      Dashboard
                    </Link>
                    <ChevronRight style={{ width: '12px', height: '12px', color: '#d6d3d1' }} />
                    <span style={{ color: '#44403c', fontWeight: '600' }}>
                      {currentPage?.name || 'Сторінка'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <CommandPalette />
              <Link
                href="/admin/settings"
                className="relative p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all flex items-center justify-center"
                title="Налаштування"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <NotificationBell />
            </div>
          </header>

          {/* ─── MAIN CONTENT ─── */}
          <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" style={{ background: '#f8f8f6' }}>
            <div className="admin-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px 80px' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
