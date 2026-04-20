import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Дашборд', path: '/admin', icon: LayoutDashboard },
    { name: 'Замовлення (Клієнти)', path: '/admin/customers', icon: Users },
    { name: 'Товари', path: '/admin/products', icon: Package },
  ];

  return (
    <div className="flex h-screen bg-[#F9F9F8] font-inter text-stone-900 selection:bg-stone-200/60">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-stone-200 flex flex-col z-10 shadow-sm">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-stone-100">
          <Link to="/admin" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-md">
            <h2 className="text-2xl font-cormorant font-bold text-stone-800 tracking-tight">Olivka<span className="text-stone-400 font-medium">Admin</span></h2>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <h3 className="px-3 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Меню</h3>
          {navItems.map((item) => {
            const Icon = item.icon;
            // Проста і точна логіка активного стану
            const isActive = item.path === '/admin' 
              ? location.pathname === '/admin' || location.pathname === '/admin/'
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
                  isActive 
                    ? 'bg-stone-100 text-stone-900 shadow-sm' 
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-stone-800' : 'text-stone-400 group-hover:text-stone-600'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Area */}
        <div className="p-4 border-t border-stone-100">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut className="w-4 h-4 text-stone-400" />
            <span>Вийти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto relative custom-scrollbar flex flex-col">
        {/* Slim Topbar */}
        <header className="h-16 shrink-0 border-b border-stone-200 bg-white flex items-center px-8 shadow-sm z-10 sticky top-0">
          <div className="text-sm text-stone-500 font-medium flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>
              {location.pathname === '/admin' && 'Огляд системи'}
              {location.pathname.startsWith('/admin/products') && 'Управління: Товари'}
              {location.pathname.startsWith('/admin/customers') && 'Управління: Замовлення та Клієнти'}
              {/* Fallback */}
              {!['/admin', '/admin/products', '/admin/customers'].some(p => location.pathname.startsWith(p)) && 'Адмін-панель'}
            </span>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
