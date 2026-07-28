'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase, deleteImageFromStorage } from '../../../lib/supabase';
import { Trash2, Package, ChevronUp, ChevronDown, ArrowUpDown, ShoppingCart, ZoomIn, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/admin/ui/PageHeader';
import EmptyState from '../../../components/admin/ui/EmptyState';
import QuickSaleModal from '../../../components/admin/products/QuickSaleModal';
import Image from 'next/image';
import { getOptimizedUrl } from '../../../lib/image-utils';
import { getPaginatedProducts, getSoldProductsStats } from '../../actions/products';

// ── Image zoom overlay ────────────────────────────────────────────────────────
function ImageZoom({ src, alt, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          padding: '12px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
          zIndex: 10,
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        className="hover:bg-white/25 active:scale-95"
      >
        <X style={{ width: '24px', height: '24px' }} />
      </button>
      <img
        src={getOptimizedUrl(src, 1200)}
        alt={alt}
        style={{
          position: 'relative',
          zIndex: 10,
          maxHeight: '90vh',
          maxWidth: '90vw',
          borderRadius: '16px',
          objectFit: 'contain',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );

  return createPortal(content, document.body);
}

// ── Thumbnail with zoom on hover ──────────────────────────────────────────────
function ProductThumb({ src, alt, onZoom }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-11 h-11 rounded-lg overflow-hidden bg-stone-100 border border-stone-200/60 flex-shrink-0 cursor-pointer group mx-auto flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => src && onZoom()}
    >
      {src ? (
        <>
          <Image src={src} alt={alt} fill sizes="44px" style={{ objectFit: 'cover' }} className="transition-transform duration-200 group-hover:scale-110" />
          <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </>
      ) : (
        <Package className="w-5 h-5 text-stone-400" strokeWidth={1.5} />
      )}
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [saleProduct, setSaleProduct] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 20;
  const totalPages = Math.ceil(totalCount / perPage);

  // Tabs and Sold products
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'sold'
  const [soldProducts, setSoldProducts] = useState([]);
  const [soldLoading, setSoldLoading] = useState(false);
  const [soldDateFilter, setSoldDateFilter] = useState('30d'); // 'today', '7d', '30d', '90d', 'all'

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Помилка завантаження категорій:', error);
      }
    }
    fetchCategories();
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { products: fetchedProducts, totalCount: count } = await getPaginatedProducts({
        page,
        perPage,
        searchTerm,
        statusFilter,
        categoryFilter,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      });
      setProducts(fetchedProducts || []);
      setTotalCount(count || 0);
    } catch (error) {
      toast.error('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, categoryFilter, sortConfig]);

  // Load products when parameters change (debounced search)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts, searchTerm]);

  // Reset page to 1 on filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // Load sold products lazily
  const loadSoldProducts = useCallback(async () => {
    try {
      setSoldLoading(true);
      const data = await getSoldProductsStats(soldDateFilter);
      setSoldProducts(data || []);
    } catch (error) {
      toast.error('Помилка завантаження проданих товарів');
    } finally {
      setSoldLoading(false);
    }
  }, [soldDateFilter]);

  useEffect(() => {
    loadSoldProducts();
  }, [loadSoldProducts]);

  const getPurchasePrice = (product) => {
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      const prices = product.sizes
        .map(s => Number(s.cost_price))
        .filter(p => !isNaN(p) && p > 0);
      if (prices.length > 0) {
        return Math.max(...prices);
      }
    }
    return Number(product.cost_price || 0);
  };

  const getSoldProductsCount = () => {
    if (soldLoading) return '...';
    return soldProducts.length;
  };

  const getFilteredSoldProducts = (soldProductsList) => {
    return soldProductsList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesCategory = true;
      if (categoryFilter !== 'all') {
        matchesCategory = p.categoryId === categoryFilter;
      }

      return matchesSearch && matchesCategory;
    });
  };

  const getSortedSoldProducts = (soldList) => {
    return [...soldList].sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aValue, bValue;
      if (sortConfig.key === 'category') {
        aValue = a.categoryName || '';
        bValue = b.categoryName || '';
      } else if (sortConfig.key === 'totalQuantity') {
        aValue = a.totalQuantity;
        bValue = b.totalQuantity;
      } else if (sortConfig.key === 'totalRevenue') {
        aValue = a.totalRevenue;
        bValue = b.totalRevenue;
      } else if (sortConfig.key === 'lastSold') {
        aValue = new Date(a.lastSold);
        bValue = new Date(b.lastSold);
      } else if (sortConfig.key === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else {
        aValue = a[sortConfig.key] || 0;
        bValue = b[sortConfig.key] || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  async function handleDelete(id) {
    if (!window.confirm('Ви впевнені, що хочете видалити цей товар?')) return;
    try {
      const productToDelete = products.find(p => p.id === id);
      if (productToDelete && productToDelete.image_url) {
        let urls = [];
        try {
          urls = typeof productToDelete.image_url === 'string' && productToDelete.image_url.startsWith('[') 
            ? JSON.parse(productToDelete.image_url) 
            : [productToDelete.image_url];
        } catch(e) {}
        
        for (const url of urls) {
           await deleteImageFromStorage(url);
        }
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Товар видалено');
      loadProducts();
    } catch {
      toast.error('Помилка видалення');
    }
  }

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

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}.${mm}.${yy}`;
  };

  const StockBadge = ({ stock }) => {
    if (stock === 0) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200">0</span>
    );
    if (stock <= 2) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">{stock}</span>
    );
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">{stock}</span>
    );
  };

  const getImageSrc = (product) => {
    if (!product.image_url) return null;
    return product.image_url.startsWith('http') ? product.image_url : `/images/${product.image_url}`;
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header — без кнопки «Додати товар» */}
      <PageHeader
        title="Товари"
        subtitle="Керуйте своїм асортиментом, цінами та наявністю."
      />

      {/* Вкладки (Tabs) з красивим оформленням */}
      <div className="flex border-b border-stone-200/80 gap-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold relative transition-colors flex items-center gap-2 ${activeTab === 'general'
              ? 'text-stone-900 font-bold'
              : 'text-stone-400 hover:text-stone-600'
            }`}
        >
          <span>Загальні товари</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-100 text-stone-500 border border-stone-200/50 transition-all">
            {totalCount}
          </span>
          {activeTab === 'general' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sold')}
          className={`pb-3 text-sm font-semibold relative transition-colors flex items-center gap-2 ${activeTab === 'sold'
              ? 'text-stone-900 font-bold'
              : 'text-stone-400 hover:text-stone-600'
            }`}
        >
          <span>Продані товари</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-100 text-stone-500 border border-stone-200/50 transition-all">
            {getSoldProductsCount()}
          </span>
          {activeTab === 'sold' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 rounded-full" />
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Пошук за назвою або артикулом..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-sm"
          />
        </div>

        {activeTab === 'sold' && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-semibold text-stone-400">Період:</span>
            <select
              value={soldDateFilter}
              onChange={(e) => setSoldDateFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-xs font-semibold text-stone-700 cursor-pointer"
            >
              <option value="today">Сьогодні</option>
              <option value="7d">Останні 7 днів</option>
              <option value="30d">Останні 30 днів</option>
              <option value="90d">Останні 90 днів</option>
              <option value="all">Весь час</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'general' ? (
        <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-100/50">
                  <th className="px-4 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[80px]">Фото</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group max-w-[440px]" onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-1.5">Назва товару <SortIcon column="name" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[140px]">
                    <select
                      className="bg-transparent border-none outline-none cursor-pointer hover:text-stone-600 focus:ring-0 font-bold uppercase text-center w-full"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">КАТЕГОРІЯ</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group text-center w-[90px]" onClick={() => requestSort('stock')}>
                    <div className="flex items-center justify-center gap-1.5">Залишок <SortIcon column="stock" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group w-[110px] text-center" onClick={() => requestSort('cost_price')}>
                    <div className="flex items-center justify-center gap-1.5">Закупка <SortIcon column="cost_price" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group w-[110px] text-center" onClick={() => requestSort('price')}>
                    <div className="flex items-center justify-center gap-1.5">Ціна <SortIcon column="price" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group w-[110px] text-center" onClick={() => requestSort('created_at')}>
                    <div className="flex items-center justify-center gap-1.5">Дата <SortIcon column="created_at" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[120px]">
                    <select
                      className="bg-transparent border-none outline-none cursor-pointer hover:text-stone-600 focus:ring-0 font-bold uppercase"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">СТАТУС</option>
                      <option value="active">АКТИВНО</option>
                      <option value="inactive">ВИМКНЕНО</option>
                    </select>
                  </th>
                  <th className="pl-4 pr-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[150px]">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="pl-6 pr-4 py-4"><div className="h-11 w-11 bg-stone-100 rounded-lg" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-48 mb-1.5" /><div className="h-3 bg-stone-100 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-24" /></td>
                      <td className="px-6 py-4 text-center flex items-center justify-center"><div className="h-5 bg-stone-100 rounded w-10 mt-3" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-stone-100 rounded-full w-16 mx-auto" /></td>
                      <td className="pl-4 pr-6 py-4"><div className="h-8 bg-stone-100 rounded w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <EmptyState
                        icon={Package}
                        title="Товарів не знайдено"
                        description={searchTerm ? 'Спробуйте змінити пошуковий запит' : 'Поки що немає жодного товару'}
                      />
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const imgSrc = getImageSrc(product);
                    return (
                      <tr key={product.id} className="hover:bg-stone-100 transition-colors">
                        <td className="px-4 py-3.5 text-center">
                          <ProductThumb
                            src={imgSrc}
                            alt={product.name}
                            onZoom={() => setZoomedImage({ src: imgSrc, alt: product.name })}
                          />
                        </td>
                        <td className="px-6 py-3.5 max-w-[440px] break-words">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-semibold text-stone-800 text-sm leading-tight hover:text-stone-500 hover:underline underline-offset-2 transition-colors"
                          >
                            {product.name}
                          </Link>
                          {product.sku && <div className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-tight">Арт: {product.sku}</div>}
                          <div className="lg:hidden flex flex-wrap gap-x-2 gap-y-1 mt-1.5 text-[10px] text-stone-400 font-medium">
                            <span className="bg-stone-50 border border-stone-200/60 px-1.5 py-0.5 rounded text-stone-600">
                              {product.categories?.name || 'Без категорії'}
                            </span>
                            <span className="bg-stone-50 border border-stone-200/60 px-1.5 py-0.5 rounded text-stone-500 tabular-nums">
                              Додано: {formatDate(product.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-stone-500 font-medium text-center">
                          {product.categories?.name || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <StockBadge stock={product.stock || 0} />
                        </td>
                        <td className="px-6 py-3.5 font-medium text-stone-500 tabular-nums text-sm whitespace-nowrap text-center">
                          {getPurchasePrice(product) > 0 ? `${getPurchasePrice(product)} ₴` : '—'}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-stone-800 tabular-nums text-sm whitespace-nowrap text-center">
                          {product.price} ₴
                        </td>
                        <td className="px-6 py-3.5 text-stone-400 text-xs tabular-nums whitespace-nowrap text-center">
                          {formatDate(product.created_at)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap ${product.is_published
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-400 border border-stone-200'
                            }`}>
                            {product.is_published ? 'АКТИВНО' : 'ВИМКНЕНО'}
                          </span>
                        </td>
                        <td className="pl-4 pr-6 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSaleProduct(product)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all whitespace-nowrap"
                              title="Зафіксувати продаж"
                            >
                              <ShoppingCart size={12} />
                              Продаж
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination for general catalog */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50/20">
              <p className="text-xs text-stone-400">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} з {totalCount}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 disabled:opacity-40 transition-all"
                >
                  ←
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${page === p ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 disabled:opacity-40 transition-all"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-100/50">
                  <th className="px-4 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[80px]">Фото</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group max-w-[440px]" onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-1.5">Назва товару <SortIcon column="name" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[140px]">
                    <select
                      className="bg-transparent border-none outline-none cursor-pointer hover:text-stone-600 focus:ring-0 font-bold uppercase text-center w-full"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">КАТЕГОРІЯ</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[110px]">Розмір</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 text-center w-[140px]">Замовлення</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group text-center w-[110px]" onClick={() => requestSort('totalQuantity')}>
                    <div className="flex items-center justify-center gap-1.5">Кількість <SortIcon column="totalQuantity" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group w-[110px] text-center" onClick={() => requestSort('costPrice')}>
                    <div className="flex items-center justify-center gap-1.5">Закупка <SortIcon column="costPrice" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group w-[130px] text-center" onClick={() => requestSort('totalRevenue')}>
                    <div className="flex items-center justify-center gap-1.5">Виручка <SortIcon column="totalRevenue" /></div>
                  </th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-stone-500 cursor-pointer hover:text-stone-600 transition-colors group w-[90px] text-center" onClick={() => requestSort('lastSold')}>
                    <div className="flex items-center justify-center gap-1.5">Дата <SortIcon column="lastSold" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {soldLoading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="pl-6 pr-4 py-4"><div className="h-11 w-11 bg-stone-100 rounded-lg" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-48 mb-1.5" /><div className="h-3 bg-stone-100 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-24" /></td>
                      <td className="px-6 py-4 text-center"><div className="h-5 bg-stone-100 rounded w-20 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><div className="h-5 bg-stone-100 rounded w-24 mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-10 mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-16 mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-16 mx-auto" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-stone-100 rounded w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : getSortedSoldProducts(getFilteredSoldProducts(soldProducts)).length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <EmptyState
                        icon={Package}
                        title="Проданих товарів не знайдено"
                        description={searchTerm ? 'Спробуйте змінити пошуковий запит' : 'Немає продажів за цей період'}
                      />
                    </td>
                  </tr>
                ) : (
                  getSortedSoldProducts(getFilteredSoldProducts(soldProducts)).map((product) => {
                    const imgSrc = getImageSrc(product);
                    const isDeleted = product.isDeleted;
                    return (
                      <tr key={product.id} className="hover:bg-stone-100 transition-colors">
                        {/* Фото */}
                        <td className="px-4 py-3.5 text-center">
                          <ProductThumb
                            src={imgSrc}
                            alt={product.name}
                            onZoom={() => setZoomedImage({ src: imgSrc, alt: product.name })}
                          />
                        </td>

                        {/* Назва */}
                        <td className="px-6 py-3.5 max-w-[440px] break-words">
                          {isDeleted ? (
                            <span className="font-semibold text-stone-400 text-sm leading-tight line-through" title="Товар видалено з каталогу">
                              {product.name}
                            </span>
                          ) : (
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="font-semibold text-stone-800 text-sm leading-tight hover:text-stone-500 hover:underline underline-offset-2 transition-colors"
                            >
                              {product.name}
                            </Link>
                          )}
                          {product.sku && <div className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-tight">Арт: {product.sku}</div>}
                          {isDeleted && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 mt-1">ВИДАЛЕНО</span>}

                          <div className="lg:hidden flex flex-wrap gap-x-2 gap-y-1 mt-1.5 text-[10px] text-stone-400 font-medium">
                            <span className="bg-stone-50 border border-stone-200/60 px-1.5 py-0.5 rounded text-stone-600">
                              {product.categoryName || 'Без категорії'}
                            </span>
                            <span className="bg-stone-50 border border-stone-200/60 px-1.5 py-0.5 rounded text-stone-500 tabular-nums">
                              Ост. продаж: {formatDate(product.lastSold)}
                            </span>
                          </div>
                        </td>

                        {/* Категорія */}
                        <td className="px-6 py-3.5 text-stone-500 font-medium text-center">
                          {product.categoryName || '—'}
                        </td>

                        {/* Продажі за розмірами */}
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex flex-wrap justify-center gap-1.5 max-w-[110px] mx-auto">
                            {Object.entries(product.sizes).map(([size, qty]) => (
                              <span key={size} className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-50 text-[10px] font-bold text-stone-600 border border-stone-200/40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                {size}: <span className="ml-1 text-stone-800">{qty} шт</span>
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Замовлення */}
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex flex-wrap justify-center gap-1.5 max-w-[140px] mx-auto max-h-[80px] overflow-y-auto">
                            {product.orders && product.orders.map((o) => (
                              <Link key={o.id} href={`/admin/orders/${o.id}`} className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-200/60 hover:bg-blue-100 transition-colors">
                                #{o.number}
                              </Link>
                            ))}
                          </div>
                        </td>

                        {/* Кількість */}
                        <td className="px-6 py-3.5 font-bold text-stone-800 tabular-nums text-sm text-center">
                          {product.totalQuantity} шт
                        </td>

                        {/* Закупка */}
                        <td className="px-6 py-3.5 font-medium text-stone-500 tabular-nums text-sm whitespace-nowrap text-center">
                          {product.costPrice > 0 ? `${product.costPrice} ₴` : '—'}
                        </td>

                        {/* Виручка */}
                        <td className="px-6 py-3.5 font-semibold text-stone-900 tabular-nums text-sm whitespace-nowrap text-center">
                          {product.totalRevenue.toLocaleString()} ₴
                        </td>

                        {/* Останній продаж */}
                        <td className="px-6 py-3.5 text-stone-400 text-xs tabular-nums whitespace-nowrap text-center">
                          {formatDate(product.lastSold)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Zoom Overlay */}
      {zoomedImage && (
        <ImageZoom
          src={zoomedImage.src}
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}

      {/* Quick Sale Modal */}
      {saleProduct && (
        <QuickSaleModal
          product={saleProduct}
          onClose={() => setSaleProduct(null)}
          onSuccess={() => {
            setSaleProduct(null);
            loadProducts();
            if (activeTab === 'sold') {
              loadSoldProducts();
            }
          }}
        />
      )}
    </div>
  );
}
