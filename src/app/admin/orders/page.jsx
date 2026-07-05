'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { STATUS_MAP, STATUS_OPTIONS, DELIVERY_LABELS, PAYMENT_LABELS, getAuthHeaders, formatDateShort, formatMoney } from '../../../lib/admin-constants';
import { getPaginatedOrders, getOrderStatusCounts } from '../../actions/orders';
import StatusBadge from '../../../components/admin/ui/StatusBadge';
import PageHeader from '../../../components/admin/ui/PageHeader';
import EmptyState from '../../../components/admin/ui/EmptyState';
import { Search, X, ShoppingBag, Filter, ChevronDown, ChevronUp, ArrowUpDown, RefreshCw, Check, ExternalLink, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ all: 0 });
  const perPage = 20;

  // Keep latest parameters in ref for the realtime subscription to avoid connection churn
  const paramsRef = useRef({ page, statusFilter, search, sortConfig });
  useEffect(() => {
    paramsRef.current = { page, statusFilter, search, sortConfig };
  }, [page, statusFilter, search, sortConfig]);

  const loadData = useCallback(async (params) => {
    setLoading(true);
    try {
      const { orders: fetchedOrders, totalCount: count } = await getPaginatedOrders(params);
      setOrders(fetchedOrders);
      setTotalCount(count);
      
      const counts = await getOrderStatusCounts();
      setStatusCounts(counts);
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Помилка завантаження замовлень');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when filters/pagination changes (debounced search)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData({
        page,
        perPage,
        statusFilter,
        search,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      });
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, statusFilter, search, sortConfig, loadData]);

  // Realtime subscription (stable)
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        const currentParams = paramsRef.current;
        loadData({
          page: currentParams.page,
          perPage,
          statusFilter: currentParams.statusFilter,
          search: currentParams.search,
          sortKey: currentParams.sortConfig.key,
          sortDirection: currentParams.sortConfig.direction,
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // Status update (preserved logic from customers page)
  async function updateOrderStatus(orderId, newStatus) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Also update counts since status has changed
    const counts = await getOrderStatusCounts();
    setStatusCounts(counts);
  }

  // Tracking update (preserved logic)
  async function updateOrderTracking(orderId, trackingNumber) {
    await supabase.from('orders').update({ tracking_number: trackingNumber }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_number: trackingNumber } : o));
  }

  const totalPages = Math.ceil(totalCount / perPage);
  const paginated = orders; // Already paginated from the server

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
    setPage(1); // reset to page 1 on sort change
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-stone-700" />
      : <ChevronDown className="w-3.5 h-3.5 text-stone-700" />;
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Замовлення" />

      {/* Status filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === 'all'
            ? 'bg-stone-900 text-white'
            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
        >
          Всі ({statusCounts.all || 0})
        </button>
        {STATUS_OPTIONS.map(s => (
          statusCounts[s.id] ? (
            <button
              key={s.id}
              onClick={() => { setStatusFilter(s.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${statusFilter === s.id
                ? 'text-white shadow-sm'
                : 'bg-white border border-stone-200 hover:bg-stone-50'
                }`}
              style={statusFilter === s.id ? { backgroundColor: s.color, color: '#fff' } : { color: s.color }}
            >
              {s.label} ({statusCounts[s.id]})
            </button>
          ) : null
        ))}
      </div>

      {/* Search + toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Пошук за ім'ям, №, ТТН, телефоном..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-10 py-3 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-sm"
            style={{ paddingLeft: '44px', paddingRight: '40px' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-xs text-stone-400 font-medium">
          Показано {orders.length} з {totalCount}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                {[
                  { label: '№', key: 'order_number', cls: 'w-20' },
                  { label: 'Клієнт', key: 'full_name', cls: 'w-56 sm:w-64 lg:w-72 text-center' },
                  { label: 'Сума', key: 'total', cls: 'w-28' },
                  { label: 'Статус', key: 'status', cls: 'w-36 text-center' },
                  { label: 'ТТН', key: 'tracking_number', cls: 'w-56 hidden lg:table-cell text-center' },
                  { label: 'Дата', key: 'created_at', cls: 'w-28 hidden md:table-cell' },
                  { label: '', key: null, cls: 'w-14' },
                  { label: '', key: null, cls: 'w-auto' },
                ].map((h, idx) => {
                  const isCentered = h.cls?.includes('text-center');
                  return (
                    <th
                      key={h.key || h.label || `col-${idx}`}
                      className={`px-6 py-5 text-xs uppercase tracking-widest font-bold text-stone-700 bg-stone-100/50 ${h.key ? 'cursor-pointer hover:text-stone-900 transition-colors group' : ''} ${h.cls}`}
                      onClick={() => h.key && requestSort(h.key)}
                    >
                      {h.key ? (
                        <div className={`flex items-center gap-1 ${isCentered ? 'justify-center' : ''}`}>
                          {h.label} <SortIcon column={h.key} />
                        </div>
                      ) : h.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-10" /></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-32" /></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-16" /></td>
                    <td className="px-6 py-5"><div className="h-5 bg-stone-100 rounded-full w-24" /></td>
                    <td className="px-6 py-5 hidden lg:table-cell"><div className="h-4 bg-stone-100 rounded w-28" /></td>
                    <td className="px-6 py-5 hidden md:table-cell"><div className="h-4 bg-stone-100 rounded w-20" /></td>
                    <td className="px-6 py-5" />
                    <td className="px-6 py-5 w-auto" />
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState
                      icon={ShoppingBag}
                      title="Замовлень не знайдено"
                      description={search || statusFilter !== 'all' ? 'Спробуйте змінити фільтри або пошук' : 'Нових замовлень поки немає'}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <OrderTableRow
                    key={order.id}
                    order={order}
                    onUpdateStatus={updateOrderStatus}
                    onUpdateTracking={updateOrderTracking}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100">
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
    </div>
  );
}

// ─── Order Table Row ──────────────────────────────────────────────────────────

function OrderTableRow({ order, onUpdateStatus, onUpdateTracking }) {
  const [updating, setUpdating] = useState(false);
  const [ttn, setTtn] = useState(order.tracking_number || '');
  const [isTtnChanged, setIsTtnChanged] = useState(false);
  const status = STATUS_MAP[order.status] || STATUS_MAP.new;

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    setUpdating(true);
    await onUpdateStatus(order.id, newStatus);

    const isShippingStatus = ['shipped', 'arrived', 'delivered'].includes(newStatus);

    if (isShippingStatus) {
      if (!order.tracking_number) {
        toast.custom((t) => (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg shadow-lg flex items-start gap-3 max-w-sm">
            <span className="text-xl leading-none">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Статус оновлено</p>
              <p className="text-xs mt-1">Лист клієнту <b>не відправлено</b>, оскільки не вказано ТТН.</p>
            </div>
          </div>
        ), { duration: 5000 });
      } else {
        try {
          const res = await fetch('/api/admin/orders/shipping-email', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ orderId: order.id, newStatus })
          });
          const data = await res.json();
          if (data.success && !data.skipped) {
            toast.success('Лист про доставку відправлено');
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    setUpdating(false);
  }

  async function handleTtnSave() {
    setUpdating(true);
    await onUpdateTracking(order.id, ttn);
    setIsTtnChanged(false);
    toast.success('ТТН збережено');
    setUpdating(false);
  }

  async function handleSyncStatus() {
    if (!order.tracking_number) return;
    setUpdating(true);

    const isUkrposhta = order.delivery_method === 'ukrposhta';
    const apiUrl = isUkrposhta ? '/api/admin/ukrposhta/sync' : '/api/admin/nova-poshta/sync';
    const serviceName = isUkrposhta ? 'Укрпошти' : 'Нової Пошти';

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ orderId: order.id, trackingNumber: order.tracking_number })
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || `Помилка ${serviceName}`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        await onUpdateStatus(order.id, data.newStatus);
        const statusMsg = isUkrposhta ? data.upStatus : data.npStatus;
        toast.success(`Статус: ${statusMsg}`);
      } else {
        toast.error(data.error || 'Помилка синхронізації');
      }
    } catch (err) {
      toast.error('Помилка запиту');
    } finally {
      setUpdating(false);
    }
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <tr className="hover:bg-stone-50/60 transition-colors group">
      {/* № або платформа */}
      <td className="px-6 py-5">
        {order.marketplace_platform ? (
          <Link href={`/admin/orders/${order.id}`} className="flex flex-col items-center gap-1 w-fit">
            {order.marketplace_platform === 'instagram' ? (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="1.8">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
                </svg>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-400 shadow-sm">
                <span className="text-white font-black text-sm">K</span>
              </div>
            )}
            <span className="text-[10px] text-stone-400 font-medium">#{order.order_number}</span>
          </Link>
        ) : (
          <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-stone-800 hover:text-stone-600 transition-colors">
            #{order.order_number}
          </Link>
        )}
      </td>

      {/* Client */}
      <td className="px-6 py-5 text-center">
        <Link href={`/admin/orders/${order.id}`} className="min-w-0 block hover:opacity-80 transition-opacity">
          <p className="text-sm font-medium text-stone-800 truncate">{order.full_name || 'Гість'}</p>
          <p className="text-xs text-stone-400 truncate">{order.phone || order.email || '—'}</p>
        </Link>
      </td>

      {/* Total */}
      <td className="px-6 py-5">
        <span className="text-sm font-semibold text-stone-800 tabular-nums">{formatMoney(order.total)} ₴</span>
      </td>

      {/* Status */}
      <td className="px-6 py-5">
        <select
          value={order.status}
          onChange={handleStatusChange}
          disabled={updating}
          style={{ color: status.color, backgroundColor: status.bg, textAlignLast: 'center' }}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border-0 cursor-pointer outline-none focus:ring-2 focus:ring-stone-300 transition-all w-full max-w-[130px] text-center"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </td>

      {/* TTN */}
      <td className="px-5 py-4 whitespace-nowrap hidden lg:table-cell">
        <div className="flex items-center gap-2 w-[180px] mr-4">
          {order.delivery_method === 'nova_poshta' && (
            <img src="/footerlogos/NP-mini-icon.svg" alt="Нова Пошта" className="w-5 h-5 object-contain opacity-80 shrink-0" />
          )}
          {order.delivery_method === 'ukrposhta' && (
            <img src="/footerlogos/Ukrposhta-mini-icon.svg" alt="Укрпошта" className="w-5 h-5 object-contain opacity-80 shrink-0" />
          )}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="—"
              value={ttn}
              onChange={(e) => {
                setTtn(e.target.value);
                setIsTtnChanged(e.target.value !== (order.tracking_number || ''));
              }}
              onKeyDown={(e) => e.key === 'Enter' && isTtnChanged && handleTtnSave()}
              className="text-[11px] font-mono px-2 py-1.5 w-full bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 transition"
            />
            {isTtnChanged && (
              <button
                onClick={handleTtnSave}
                disabled={updating}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all"
              >
                <Check size={12} strokeWidth={3} />
              </button>
            )}
          </div>
          {order.tracking_number && (
            <button
              onClick={handleSyncStatus}
              disabled={updating}
              className={`p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-all flex-shrink-0 ${updating ? 'animate-spin opacity-50' : ''}`}
              title="Синхронізація з поштою"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </td>

      {/* Date */}
      <td className="px-6 py-5 hidden md:table-cell">
        <span className="text-xs text-stone-400">{formatDateShort(order.created_at)}</span>
      </td>

      {/* Actions */}
      <td className="px-6 py-5">
        <Link
          href={`/admin/orders/${order.id}`}
          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-all inline-flex"
          title="Деталі"
        >
          <ExternalLink size={14} />
        </Link>
      </td>

      {/* Spacer to push columns left */}
      <td className="px-6 py-5 w-auto"></td>
    </tr>
  );
}
