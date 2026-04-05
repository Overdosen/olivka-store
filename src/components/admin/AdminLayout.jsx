import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Статистика', path: '/admin', icon: LayoutDashboard },
    { name: 'Товари', path: '/admin/products', icon: Package },
  ];

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-inter text-stone-900 selection:bg-stone-200">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white/80 backdrop-blur-md border-r border-stone-200/60 flex flex-col z-10">
        <div className="p-8 border-b border-stone-200/60 flex items-center justify-between">
          <h2 className="text-3xl font-cormorant font-bold text-stone-800 tracking-tight">Olivka<span className="text-stone-400 font-light">Admin</span></h2>
        </div>
        
        <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-4 p-3.5 rounded-md transition-all duration-300 ${
                  isActive 
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
            className="group flex items-center justify-center space-x-2 text-stone-500 hover:bg-red-50 hover:text-red-600 p-3.5 rounded-md transition-all duration-300 w-full font-medium"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm tracking-wide">Вийти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto relative custom-scrollbar">
        <div className="max-w-6xl mx-auto p-4 md:p-10 pt-12 pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
