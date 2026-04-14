'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Package, Search, Tags, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);

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

  async function handleUpdate(updatedData) {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('categories')
        .update(updatedData)
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast.success('Категорію оновлено');
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...updatedData } : c));
      setEditingCategory(null);
    } catch (error) {
      toast.error('Помилка при збереженні');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

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
                <th className="p-5 font-semibold text-stone-600 text-xs uppercase tracking-wider text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-stone-400 animate-pulse font-medium">
                    Завантаження...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-stone-500">
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
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => setEditingCategory(cat)}
                        className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-all"
                        title="Редагувати SEO та контент"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      </div>

      <AnimatePresence>
        {editingCategory && (
          <CategoryEditModal 
            category={editingCategory} 
            onClose={() => setEditingCategory(null)} 
            onSave={handleUpdate}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryEditModal({ category, onClose, onSave, saving }) {
  const [formData, setFormData] = useState({
    name: category.name || '',
    sort_order: category.sort_order || 0,
    description: category.description || '',
    seo_title: category.seo_title || '',
    meta_description: category.meta_description || '',
    meta_keywords: category.meta_keywords || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'sort_order' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Редагування категорії</h2>
            <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mt-1">ID: {category.id}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Основна інформація */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 border-b border-stone-100 pb-2">Основна інформація</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Назва</label>
                <input 
                  name="name" value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-md focus:bg-white focus:border-stone-400 outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Порядок сортування</label>
                <input 
                  type="number" name="sort_order" value={formData.sort_order} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-md focus:bg-white focus:border-stone-400 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase">Опис (відображається на сайті)</label>
              <textarea 
                name="description" value={formData.description} onChange={handleChange} rows={3}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-md focus:bg-white focus:border-stone-400 outline-none transition-all text-sm resize-none"
                placeholder="Введіть опис категорії для клієнтів..."
              />
            </div>
          </div>

          {/* SEO Налаштування */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600/70 border-b border-emerald-50 pb-2">SEO Оптимізація</h3>
            <div className="space-y-4 bg-emerald-50/30 p-4 rounded-lg border border-emerald-100/50">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">SEO Заголовок (Title)</label>
                <input 
                  name="seo_title" value={formData.seo_title} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-md focus:border-emerald-400 outline-none transition-all text-sm"
                  placeholder="Залиште порожнім, щоб використати назву категорії"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Мета-опис (Description)</label>
                <textarea 
                  name="meta_description" value={formData.meta_description} onChange={handleChange} rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-md focus:border-emerald-400 outline-none transition-all text-sm resize-none"
                  placeholder="Стислий опис для пошукових систем (до 160 символів)..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase">Ключові слова (Keywords)</label>
                <input 
                  name="meta_keywords" value={formData.meta_keywords} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-md focus:border-emerald-400 outline-none transition-all text-sm"
                  placeholder="дитячий одяг, боді, чоловічки..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white/90 py-4 border-t border-stone-100">
            <button 
              type="submit" disabled={saving}
              className="flex-1 bg-stone-800 text-white font-bold py-3 rounded-md hover:bg-stone-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Збереження...' : 'Зберегти зміни'}
            </button>
            <button 
              type="button" onClick={onClose}
              className="px-6 py-3 font-semibold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Скасувати
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
