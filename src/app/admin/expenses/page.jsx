'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { 
  Package, Search, X, Plus, DollarSign, 
  Trash2, Calendar, ArrowUpDown, ChevronDown, ChevronUp 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../../components/admin/ui/PageHeader';
import EmptyState from '../../../components/admin/ui/EmptyState';
import StatCard from '../../../components/admin/ui/StatCard';

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('other_expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      toast.error('Помилка завантаження витрат');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Calculate stats
  const totalExpensesSum = expenses.reduce((acc, exp) => {
    const price = parseFloat(exp.price) || 0;
    const quantity = parseInt(exp.quantity) || 0;
    const delivery = parseFloat(exp.delivery_price) || 0;
    return acc + (price * quantity) + delivery;
  }, 0);

  // Filter & Sort logic
  const filteredExpenses = expenses.filter(exp =>
    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exp.supplier && exp.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-stone-700" />
      : <ChevronDown className="w-3.5 h-3.5 text-stone-700" />;
  };

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === 'created_at') {
      return sortConfig.direction === 'asc'
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    }

    // Для числових значень (price, quantity тощо)
    aValue = parseFloat(aValue) || 0;
    bValue = parseFloat(bValue) || 0;

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  async function handleCreate(formData) {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('other_expenses')
        .insert([formData])
        .select();

      if (error) throw error;

      toast.success('Витрату успішно додано');
      setExpenses(prev => [data[0], ...prev]);
      setIsCreateOpen(false);
    } catch (error) {
      toast.error('Помилка при збереженні');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(formData) {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('other_expenses')
        .update(formData)
        .eq('id', editingExpense.id);

      if (error) throw error;

      toast.success('Витрату оновлено');
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, ...formData } : e));
      setEditingExpense(null);
    } catch (error) {
      toast.error('Помилка при оновленні');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingExpense) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('other_expenses')
        .delete()
        .eq('id', deletingExpense.id);

      if (error) throw error;

      toast.success('Витрату видалено');
      setExpenses(prev => prev.filter(e => e.id !== deletingExpense.id));
      setDeletingExpense(null);
    } catch (error) {
      toast.error('Помилка при видаленні');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12 admin-stagger">
      {/* Header */}
      <PageHeader 
        title="Інші витрати" 
        subtitle="Облік господарських та супутніх витрат магазину."
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
        >
          <Plus size={16} />
          <span>Додати витрату</span>
        </button>
      </PageHeader>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          label="Всього витрат" 
          value={totalExpensesSum} 
          icon={DollarSign}
          accentColor="#1c1917"
        />
        <StatCard 
          label="Кількість позицій" 
          value={expenses.length} 
          icon={Package}
          suffix=" записів"
          accentColor="#1c1917"
        />
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Пошук за назвою..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '44px', paddingRight: '40px' }}
            className="w-full py-3 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-sm font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
              title="Очистити пошук"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid or Table Card */}
      <div className="bg-white rounded-lg border border-stone-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">Назва</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 hidden md:table-cell">Постачальник</th>
                <th 
                  onClick={() => requestSort('price')}
                  className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-right cursor-pointer hover:text-stone-700 select-none transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Ціна <SortIcon column="price" />
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('quantity')}
                  className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-center cursor-pointer hover:text-stone-700 select-none transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Кількість <SortIcon column="quantity" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-right">Доставка</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-right font-semibold">Разом</th>
                <th 
                  onClick={() => requestSort('created_at')}
                  className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-right hidden sm:table-cell cursor-pointer hover:text-stone-700 select-none transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Дата <SortIcon column="created_at" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100" />
                        <div className="space-y-2">
                          <div className="h-4 bg-stone-100 rounded w-28" />
                          <div className="h-3 bg-stone-100 rounded w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <div className="h-4 bg-stone-100 rounded w-24" />
                    </td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-16 ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-8 mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-12 ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-20 ml-auto" /></td>
                    <td className="px-6 py-5 text-right hidden sm:table-cell"><div className="h-4 bg-stone-100 rounded w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      icon={Package}
                      title="Витрат не знайдено"
                      description={searchTerm ? 'Спробуйте змінити критерії пошуку' : 'Почніть облік, додавши першу господарську витрату'}
                    />
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((exp) => {
                  const price = parseFloat(exp.price) || 0;
                  const qty = parseInt(exp.quantity) || 1;
                  const del = parseFloat(exp.delivery_price) || 0;
                  const total = (price * qty) + del;

                  return (
                    <tr key={exp.id} className="hover:bg-stone-50/30 transition-colors group">
                      {/* Name & custom box placeholder */}
                      <td 
                        onClick={() => setEditingExpense(exp)}
                        className="px-6 py-4.5 cursor-pointer group/name select-none"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-amber-50/60 border border-amber-200/40 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover/name:scale-[1.03] transition-transform duration-200 shadow-sm">
                            <Package className="w-5 h-5 text-amber-700/80 relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-white/40 pointer-events-none" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-stone-850 text-sm truncate max-w-[180px] sm:max-w-xs group-hover/name:text-stone-900 group-hover/name:underline underline-offset-4 decoration-stone-400">
                              {exp.name}
                            </span>
                            <span className="text-[10px] text-stone-400 sm:hidden">Пост.: {exp.supplier || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4.5 hidden md:table-cell">
                        <span className="text-stone-600 font-medium text-sm">
                          {exp.supplier || <span className="text-stone-300">—</span>}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="px-6 py-4.5 text-right font-medium text-stone-700 tabular-nums">
                        {price.toLocaleString('uk-UA')} ₴
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4.5 text-center text-stone-600 font-mono text-sm tabular-nums">
                        {qty}
                      </td>

                      {/* Delivery Price */}
                      <td className="px-6 py-4.5 text-right text-stone-600 tabular-nums">
                        {del > 0 ? `${del.toLocaleString('uk-UA')} ₴` : <span className="text-stone-300">0 ₴</span>}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4.5 text-right font-bold text-stone-850 tabular-nums">
                        {total.toLocaleString('uk-UA')} ₴
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4.5 text-stone-400 text-xs text-right hidden sm:table-cell font-medium">
                        {formatDate(exp.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & AnimatePresence */}
      <Portal>
        <div className="admin-shell">
          <AnimatePresence>
            {/* Create modal */}
            {isCreateOpen && (
              <ExpenseFormModal 
                title="Додавання витрати"
                onClose={() => setIsCreateOpen(false)}
                onSave={handleCreate}
                saving={saving}
              />
            )}

            {/* Edit modal */}
            {editingExpense && (
              <ExpenseFormModal 
                title="Редагування витрати"
                expense={editingExpense}
                onClose={() => setEditingExpense(null)}
                onSave={handleUpdate}
                onDelete={() => {
                  setEditingExpense(null);
                  setDeletingExpense(editingExpense);
                }}
                saving={saving}
              />
            )}

            {/* Deletion confirmation modal */}
            {deletingExpense && (
              <DeleteConfirmModal 
                expenseName={deletingExpense.name}
                onClose={() => setDeletingExpense(null)}
                onConfirm={handleDelete}
                deleting={deleting}
              />
            )}
          </AnimatePresence>
        </div>
      </Portal>
    </div>
  );
}

// A client-side portal component to mount modals to document.body,
// preventing transform/animation parent container positioning bugs.
function Portal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ExpenseFormModal({ title, expense = null, onClose, onSave, onDelete = null, saving }) {
  const [formData, setFormData] = useState({
    name: expense?.name || '',
    supplier: expense?.supplier || '',
    price: expense?.price || '',
    quantity: expense?.quantity || '1',
    delivery_price: expense?.delivery_price || '0',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Назва обов’язкова';
    
    const priceNum = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceNum) || priceNum < 0) {
      newErrors.price = 'Введіть коректну ціну (>= 0)';
    }

    const qtyNum = parseInt(formData.quantity);
    if (formData.quantity === '' || isNaN(qtyNum) || qtyNum < 1) {
      newErrors.quantity = 'Кількість має бути >= 1';
    }

    const deliveryNum = parseFloat(formData.delivery_price);
    if (formData.delivery_price !== '' && (isNaN(deliveryNum) || deliveryNum < 0)) {
      newErrors.delivery_price = 'Введіть коректну доставку (>= 0)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: formData.name.trim(),
      supplier: formData.supplier.trim() || null,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      delivery_price: parseFloat(formData.delivery_price) || 0,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[8px] bg-stone-900/10"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="bg-white rounded-xl shadow-[0_32px_96px_rgba(0,0,0,0.16)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-stone-200/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 md:px-8 border-b border-stone-100 bg-stone-50/50 sticky top-0 bg-white/95 backdrop-blur z-10 flex-shrink-0">
          <h2 className="text-lg font-bold text-stone-850">{title}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 custom-scrollbar">
            {/* Назва */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Назва витрати <span className="text-red-500">*</span></label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                placeholder="Наприклад: Коробки Нова Пошта 3кг, Плівка стрейч..."
                disabled={saving}
                className={`w-full px-4 py-2.5 bg-stone-50/80 border ${errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-400/10' : 'border-stone-200 focus:border-stone-400 focus:ring-stone-400/10'} rounded-lg focus:bg-white outline-none focus:ring-4 transition-all text-sm font-medium`}
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
            </div>

            {/* Постачальник */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-650 uppercase tracking-wider">Постачальник</label>
              <input 
                name="supplier" 
                value={formData.supplier} 
                onChange={handleChange}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 focus:border-stone-400 focus:ring-stone-400/10 focus:bg-white rounded-lg outline-none focus:ring-4 transition-all text-sm font-medium"
              />
            </div>

            {/* Ціна & Кількість */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Ціна за одиницю (₴) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  step="0.01"
                  name="price" 
                  value={formData.price} 
                  onChange={handleChange}
                  placeholder="0.00"
                  disabled={saving}
                  className={`w-full px-4 py-2.5 bg-stone-50/80 border ${errors.price ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-stone-400'} rounded-lg focus:bg-white outline-none focus:ring-4 focus:ring-stone-400/10 transition-all text-sm font-medium tabular-nums`}
                />
                {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Кількість <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  name="quantity" 
                  value={formData.quantity} 
                  onChange={handleChange}
                  placeholder="1"
                  disabled={saving}
                  className={`w-full px-4 py-2.5 bg-stone-50/80 border ${errors.quantity ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-stone-400'} rounded-lg focus:bg-white outline-none focus:ring-4 focus:ring-stone-400/10 transition-all text-sm font-medium tabular-nums`}
                />
                {errors.quantity && <p className="text-xs text-red-500 font-medium">{errors.quantity}</p>}
              </div>
            </div>

            {/* Вартість доставки */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Вартість доставки (₴)</label>
              <input 
                type="number"
                step="0.01"
                name="delivery_price" 
                value={formData.delivery_price} 
                onChange={handleChange}
                placeholder="0.00"
                disabled={saving}
                className={`w-full px-4 py-2.5 bg-stone-50/80 border ${errors.delivery_price ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-stone-400'} rounded-lg focus:bg-white outline-none focus:ring-4 focus:ring-stone-400/10 transition-all text-sm font-medium tabular-nums`}
              />
              {errors.delivery_price && <p className="text-xs text-red-500 font-medium">{errors.delivery_price}</p>}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex justify-between items-center px-6 py-4 md:px-8 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all cursor-pointer disabled:opacity-55"
              >
                <Trash2 size={14} />
                <span>Видалити</span>
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer disabled:opacity-80"
              >
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({ expenseName, onClose, onConfirm, deleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[8px] bg-stone-900/10"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="bg-white rounded-xl shadow-[0_32px_96px_rgba(0,0,0,0.16)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-stone-200/80"
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div className="flex items-center gap-3 text-red-600">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-850">Видалити витрату?</h3>
          </div>
          
          <p className="text-sm text-stone-500 leading-relaxed">
            Ви впевнені, що хочете видалити витрату <span className="font-semibold text-stone-700">"{expenseName}"</span>? Цю дію не можна буде скасувати.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            {deleting ? 'Видалення...' : 'Видалити'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
