import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: '--',
    activeCategories: '--',
    recentProducts: '--'
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Fetch active categories
        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        // Fetch recently added today/this week (we'll just use a simple arbitrary query, e.g., last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: recentCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        setStats({
          totalProducts: productsCount || 0,
          activeCategories: categoriesCount || 0,
          recentProducts: recentCount || 0
        });
      } catch (error) {
        console.error('Помилка завантаження статистики:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-cormorant font-bold text-stone-800 tracking-tight">Статистика та Огляд</h1>
          <p className="text-stone-500 mt-2 font-medium">Короткий огляд стану вашого магазину.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-stone-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stone-100 rounded-full -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none blur-3xl"></div>
        <h2 className="text-2xl font-cormorant font-bold text-stone-800 mb-3 relative z-10">Вітаємо у панелі керування!</h2>
        <p className="text-stone-600 leading-relaxed max-w-2xl relative z-10">
          Звідси ви зможете керувати асортиментом вашого інтернет-магазину.
          Скористайтеся меню зліва для переходу в розділ <strong>«Товари»</strong>, щоб додавати нові позиції, завантажувати фото або редагувати ціни.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Всього товарів</p>
          <p className="text-4xl font-cormorant font-bold text-stone-800">{stats.totalProducts}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Активних категорій</p>
          <p className="text-4xl font-cormorant font-bold text-stone-800">{stats.activeCategories}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow">
          <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Додано за 7 днів</p>
          <p className="text-4xl font-cormorant font-bold text-stone-800">{stats.recentProducts}</p>
        </div>
      </div>
    </div>
  );
}
