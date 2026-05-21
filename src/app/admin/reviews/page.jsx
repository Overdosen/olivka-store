'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { 
  Star, Search, X, Trash2, Calendar, ArrowUpDown, 
  ChevronDown, ChevronUp, Check, Eye, EyeOff, Edit3, Pin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../../components/admin/ui/PageHeader';
import EmptyState from '../../../components/admin/ui/EmptyState';
import StatCard from '../../../components/admin/ui/StatCard';

const Instagram = ({ size = 24, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'moderation', 'approved'
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  
  const [editingReview, setEditingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      toast.error('Помилка завантаження відгуків');
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

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => !r.is_approved).length;
    const approved = reviews.filter(r => r.is_approved).length;
    const pinned = reviews.filter(r => r.is_pinned).length;
    
    const approvedWithRating = reviews.filter(r => r.rating);
    const avgRating = approvedWithRating.length
      ? (approvedWithRating.reduce((acc, r) => acc + r.rating, 0) / approvedWithRating.length).toFixed(1)
      : '5.0';

    return { total, pending, approved, avgRating, pinned };
  }, [reviews]);

  // Tab Filtering
  const tabFilteredReviews = useMemo(() => {
    if (activeTab === 'moderation') {
      return reviews.filter(r => !r.is_approved);
    }
    if (activeTab === 'approved') {
      return reviews.filter(r => r.is_approved);
    }
    return reviews;
  }, [reviews, activeTab]);

  // Search Filtering
  const filteredReviews = useMemo(() => {
    return tabFilteredReviews.filter(rev =>
      (rev.name && rev.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rev.text && rev.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rev.email && rev.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tabFilteredReviews, searchTerm]);

  // Sorting
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

  const sortedReviews = useMemo(() => {
    return [...filteredReviews].sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc'
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredReviews, sortConfig]);

  // Toggle approval
  async function handleToggleApprove(review) {
    const newStatus = !review.is_approved;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: newStatus })
        .eq('id', review.id);

      if (error) throw error;
      
      toast.success(newStatus ? 'Відгук схвалено та опубліковано!' : 'Відгук приховано');
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_approved: newStatus } : r));
    } catch (err) {
      toast.error('Помилка зміни статусу відгуку');
      console.error(err);
    }
  }

  // Toggle pinned status ("Вивести першим")
  async function handleTogglePin(review) {
    const newPinned = !review.is_pinned;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_pinned: newPinned })
        .eq('id', review.id);

      if (error) throw error;
      
      toast.success(newPinned ? 'Відгук закріплено вгорі списку!' : 'Відгук відкріплено');
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_pinned: newPinned } : r));
    } catch (err) {
      toast.error('Помилка закріплення відгуку');
      console.error(err);
    }
  }

  // Save edits
  async function handleUpdate(formData) {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('reviews')
        .update(formData)
        .eq('id', editingReview.id);

      if (error) throw error;

      toast.success('Відгук успішно оновлено');
      setReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, ...formData } : r));
      setEditingReview(null);
    } catch (error) {
      toast.error('Помилка при збереженні');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  // Delete review
  async function handleDelete() {
    if (!deletingReview) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', deletingReview.id);

      if (error) throw error;

      toast.success('Відгук видалено');
      setReviews(prev => prev.filter(r => r.id !== deletingReview.id));
      setDeletingReview(null);
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
        title="Управління відгуками" 
        subtitle="Модерація відгуків клієнтів, закріплення найкращих вгорі головної сторінки."
      />

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Всього відгуків" 
          value={stats.total} 
          icon={Star}
          accentColor="#1c1917"
        />
        <StatCard 
          label="На модерації" 
          value={stats.pending} 
          icon={EyeOff}
          accentColor="#d97706"
        />
        <StatCard 
          label="Схвалено" 
          value={stats.approved} 
          icon={Check}
          accentColor="#16a34a"
        />
        <StatCard 
          label="Закріплено" 
          value={stats.pinned} 
          icon={Pin}
          accentColor="#2563eb"
        />
      </div>

      {/* Controls & Tabs */}
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/50 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'all' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Всі ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'moderation' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            На модерації ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'approved' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Схвалені ({stats.approved})
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Пошук за ім'ям, текстом або email..."
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
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-lg border border-stone-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">Клієнт</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400">Відгук</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-center">Статус</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-center">Закріплено</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-stone-400 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <div className="h-4 bg-stone-100 rounded w-28" />
                        <div className="h-3 bg-stone-100 rounded w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <div className="h-4 bg-stone-100 rounded w-full" />
                        <div className="h-3 bg-stone-100 rounded w-1/2" />
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-5 bg-stone-100 rounded w-16 mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-5 bg-stone-100 rounded w-10 mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-8 bg-stone-100 rounded w-28 ml-auto" /></td>
                  </tr>
                ))
              ) : sortedReviews.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState
                      icon={Star}
                      title="Відгуків не знайдено"
                      description={searchTerm ? 'Спробуйте змінити критерії пошуку' : 'Наразі нових відгуків немає.'}
                    />
                  </td>
                </tr>
              ) : (
                sortedReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-stone-50/30 transition-colors group">
                    {/* Client info */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        {rev.is_instagram ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-pink-50 border border-pink-100 text-xs font-bold text-pink-600 self-start shadow-sm">
                            <Instagram size={12} className="stroke-[2.5]" />
                            Відгук з Instagram
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold text-stone-850 text-sm">
                              {rev.name}
                            </span>
                            <span className="text-xs text-stone-400">{rev.email || 'Без email'}</span>
                          </>
                        )}
                        <span className="text-[10px] text-stone-400 mt-1.5 flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(rev.created_at)}
                        </span>
                      </div>
                    </td>

                    {/* Review text & rating */}
                    <td className="px-6 py-4.5 max-w-md">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < rev.rating ? "#f59e0b" : "transparent"} 
                              color={i < rev.rating ? "#f59e0b" : "#d6d3d1"} 
                            />
                          ))}
                        </div>
                        <p className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {rev.text}
                        </p>
                      </div>
                    </td>

                    {/* Status approved */}
                    <td className="px-6 py-4.5 text-center">
                      <button
                        onClick={() => handleToggleApprove(rev)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                          rev.is_approved 
                            ? 'bg-green-50 text-green-700 border border-green-200/50 hover:bg-green-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200/50 hover:bg-amber-100'
                        }`}
                      >
                        {rev.is_approved ? (
                          <>
                            <Check size={12} />
                            Схвалено
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            Модерація
                          </>
                        )}
                      </button>
                    </td>

                    {/* Status pinned ("Вивести першим") */}
                    <td className="px-6 py-4.5 text-center">
                      <button
                        onClick={() => handleTogglePin(rev)}
                        className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                          rev.is_pinned 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                            : 'border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50'
                        }`}
                        title={rev.is_pinned ? "Відкріпити" : "Вивести першим (Закріпити)"}
                      >
                        <Pin size={14} className={rev.is_pinned ? 'fill-blue-600' : ''} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick approve/hide switch */}
                        <button
                          onClick={() => handleToggleApprove(rev)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            rev.is_approved 
                              ? 'border-amber-200 bg-amber-50/50 text-amber-600 hover:bg-amber-100' 
                              : 'border-green-200 bg-green-50/50 text-green-600 hover:bg-green-100'
                          }`}
                          title={rev.is_approved ? "Приховати" : "Схвалити"}
                        >
                          {rev.is_approved ? <EyeOff size={14} /> : <Check size={14} />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditingReview(rev)}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                          title="Редагувати"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingReview(rev)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Видалити"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Portal>
        <div className="admin-shell">
          <AnimatePresence>
            {/* Edit modal */}
            {editingReview && (
              <ReviewFormModal 
                title="Редагування відгуку"
                review={editingReview}
                onClose={() => setEditingReview(null)}
                onSave={handleUpdate}
                saving={saving}
              />
            )}

            {/* Deletion modal */}
            {deletingReview && (
              <DeleteConfirmModal 
                reviewerName={deletingReview.is_instagram ? 'Відгук з Instagram' : deletingReview.name}
                onClose={() => setDeletingReview(null)}
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

function ReviewFormModal({ title, review, onClose, onSave, saving }) {
  const [formData, setFormData] = useState({
    name: review?.name || '',
    email: review?.email || '',
    rating: review?.rating || 5,
    text: review?.text || '',
    is_instagram: review?.is_instagram || false,
  });

  const [hoveredRating, setHoveredRating] = useState(null);
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
    if (!formData.is_instagram && !formData.name.trim()) newErrors.name = "Ім'я обов'язкове";
    if (!formData.text.trim()) newErrors.text = 'Текст відгуку обов’язковий';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const finalData = {
      ...formData,
      name: formData.is_instagram ? 'Відгук з Instagram' : formData.name,
      email: formData.is_instagram ? 'instagram@store.olivka' : formData.email,
    };
    onSave(finalData);
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
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 custom-scrollbar">
            {/* Ім'я */}
            {!formData.is_instagram && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Ім'я автора <span className="text-red-500">*</span></label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  disabled={saving}
                  className={`w-full px-4 py-2.5 bg-stone-50/80 border ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-stone-400'} rounded-lg focus:bg-white outline-none focus:ring-4 focus:ring-stone-400/10 transition-all text-sm font-medium`}
                />
                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
              </div>
            )}

            {/* Email */}
            {!formData.is_instagram && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Email (не публікується)</label>
                <input 
                  type="email"
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-stone-50/80 border border-stone-200 focus:border-stone-400 focus:ring-stone-400/10 focus:bg-white rounded-lg outline-none focus:ring-4 transition-all text-sm font-medium"
                />
              </div>
            )}

            {/* Зірочки */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block">Оцінка</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isHighlighted = (hoveredRating !== null ? hoveredRating : formData.rating) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      disabled={saving}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(null)}
                      onClick={() => setFormData(prev => ({ ...prev, rating: starValue }))}
                      className="p-1 text-stone-300 hover:text-amber-500 transition-colors"
                    >
                      <Star 
                        size={24} 
                        fill={isHighlighted ? "#f59e0b" : "transparent"} 
                        color={isHighlighted ? "#f59e0b" : "#d6d3d1"} 
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Джерело Instagram */}
            <div className="flex items-center gap-3 py-1">
              <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="is_instagram"
                  checked={formData.is_instagram}
                  disabled={saving}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      is_instagram: e.target.checked
                    }));
                  }}
                  className="w-4 h-4 rounded border-stone-300 text-pink-600 focus:ring-pink-500/20 focus:ring-offset-0 accent-pink-600 transition-all cursor-pointer"
                />
                <span className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                  <Instagram size={16} className="text-pink-600 stroke-[2]" />
                  Відгук з Instagram
                </span>
              </label>
            </div>

            {/* Текст відгуку */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Відгук <span className="text-red-500">*</span></label>
              <textarea 
                name="text" 
                rows="4"
                value={formData.text} 
                onChange={handleChange}
                disabled={saving}
                className={`w-full px-4 py-2.5 bg-stone-50/80 border ${errors.text ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-stone-400'} rounded-lg focus:bg-white outline-none focus:ring-4 focus:ring-stone-400/10 transition-all text-sm font-medium leading-relaxed resize-none`}
              />
              {errors.text && <p className="text-xs text-red-500 font-medium">{errors.text}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 md:px-8 border-t border-stone-100 bg-stone-50/50 flex-shrink-0">
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
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({ reviewerName, onClose, onConfirm, deleting }) {
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
            <h3 className="text-lg font-bold text-stone-850">Видалити відгук?</h3>
          </div>
          
          <p className="text-sm text-stone-500 leading-relaxed">
            Ви впевнені, що хочете видалити відгук від <span className="font-semibold text-stone-700">"{reviewerName}"</span>? Цю дію не можна скасувати.
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
