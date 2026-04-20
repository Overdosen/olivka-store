'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: '--',
    activeCategories: '--',
    recentProducts: '--',
    totalClients: '--',
    newClients: '--',
    totalOrders: '--',
    totalUnits: '--',
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        const { count: clientsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: newClientsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        const { data: stockData } = await supabase
          .from('products')
          .select('stock');
        
        const totalStockUnits = stockData?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;

        setStats({
          totalProducts:    productsCount || 0,
          activeCategories: categoriesCount || 0,
          recentProducts:   recentCount || 0,
          totalClients:     clientsCount || 0,
          newClients:       newClientsCount || 0,
          totalOrders:      ordersCount || 0,
          totalUnits:       totalStockUnits
        });
      } catch (error) {
        console.error('Помилка завантаження статистики:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-4xl font-cormorant font-bold text-stone-800 tracking-tight">Статистика та Огляд</h1>
          <p className="text-stone-500 mt-1 md:mt-2 font-medium text-sm md:text-base">Короткий огляд стану вашого магазину.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-5 md:p-8 rounded-md shadow-sm border border-stone-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-stone-100 rounded-full -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none blur-2xl md:blur-3xl"></div>
        <h2 className="text-xl md:text-2xl font-cormorant font-bold text-stone-800 mb-2 md:mb-3 relative z-10">Вітаємо у панелі керування!</h2>
        <p className="text-stone-600 leading-relaxed max-w-2xl relative z-10 text-sm md:text-base">
          Звідси ви зможете керувати асортиментом вашого інтернет-магазину.
          Скористайтеся меню зліва для переходу в розділ <strong>«Товари»</strong>.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-md shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Всього товарів</p>
          <p className="text-3xl md:text-4xl font-cormorant font-bold text-stone-800">{stats.totalProducts}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-md shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Активних категорій</p>
          <p className="text-3xl md:text-4xl font-cormorant font-bold text-stone-800">{stats.activeCategories}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-md shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Додано за 7 днів</p>
          <p className="text-3xl md:text-4xl font-cormorant font-bold text-stone-800">{stats.recentProducts}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-md shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Всього клієнтів</p>
          <p className="text-3xl md:text-4xl font-cormorant font-bold text-stone-800">{stats.totalClients}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-md shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Нових клієнтів</p>
          <p className="text-3xl md:text-4xl font-cormorant font-bold text-stone-800">{stats.newClients}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-md shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Всього замовлень</p>
          <p className="text-3xl md:text-4xl font-cormorant font-bold text-stone-800">{stats.totalOrders}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-md shadow-sm border border-emerald-200/60 hover:shadow-md transition-shadow ring-1 ring-emerald-50 sm:col-span-2 md:col-span-1">
          <p className="text-[10px] md:text-xs uppercase tracking-wider text-emerald-600 font-semibold mb-1">Одиниць на складі</p>
          <p className="text-3xl md:text-4xl font-cormorant font-bold text-stone-800">{stats.totalUnits}</p>
        </div>
      </div>
    </div>
  );
}
