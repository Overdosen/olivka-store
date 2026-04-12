'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Package, Search, Tags } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      // We fetch categories and join with products for counts (or use the new total_stock column)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast.error('Помилка завантаження категорій');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end flex-wrap gap-6">
        <div className="flex-1 min-w-[300px]">
          <div className="flex items-center gap-6 mb-2">
            <h1 className="text-4xl font-cormorant font-bold text-stone-800 tracking-tight whitespace-nowrap">Категорії</h1>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Пошук категорії..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-md border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-sm font-medium"
              />
            </div>
          </div>
          <p className="text-stone-500 font-medium">Огляд залишків по кожній категорії товарів.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-md shadow-sm border border-stone-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-200/60">
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider">Назва категорії</th>
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider text-center">Пріоритет</th>
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider text-right">Загальний залишок (од.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-stone-400 animate-pulse font-medium">
                    Завантаження...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-stone-500">
                    <Tags className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                    <p className="font-medium">Категорій не знайдено.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-stone-400" />
                        </div>
                        <span className="font-semibold text-stone-800">{cat.name}</span>
                        <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {cat.id}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center text-stone-500 font-mono text-xs">{cat.sort_order}</td>
                    <td className="p-5 text-right font-bold text-stone-900">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={`text-2xl font-cormorant ${cat.total_stock > 0 ? 'text-emerald-700' : 'text-stone-300'}`}>
                          {cat.total_stock || 0}
                        </span>
                        <span className="text-xs text-stone-400 font-normal uppercase tracking-widest pt-1">шт.</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="p-6 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2">Підказка про залишки</h3>
          <p className="text-sm text-emerald-700/80 leading-relaxed">
            Ці цифри оновлюються автоматично кожного разу, коли ви змінюєте залишки в конкретному товарі або коли клієнт робить замовлення. 
            Використовуйте цей розділ для швидкого планування поставок.
          </p>
        </div>
      </div>
    </div>
  );
}
