'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { STATUS_MAP, STATUS_OPTIONS, DELIVERY_LABELS, PAYMENT_LABELS, getAuthHeaders, formatDateShort, formatMoney } from '../../../lib/admin-constants';
import { getPaginatedOrders, getOrderStatusCounts } from '../../actions/orders';
import StatusBadge from '../../../components/admin/ui/StatusBadge';
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
    if (sortConfig.key !== column) {
      return <ArrowUpDown size={12} style={{ color: '#d6d3d1', opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp size={14} style={{ color: '#44403c' }} />
      : <ChevronDown size={14} style={{ color: '#44403c' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Page Header (Settings Style) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1c1917', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2 }}>Замовлення</h1>
          <p style={{ fontSize: '14px', color: '#78716c', margin: '6px 0 0', fontWeight: 400 }}>Управління замовленнями та відправленнями магазину</p>
        </div>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-none">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            cursor: 'pointer',
            border: statusFilter === 'all' ? 'none' : '1.5px solid #e7e5e4',
            background: statusFilter === 'all' ? '#1c1917' : 'white',
            color: statusFilter === 'all' ? 'white' : '#57534e',
            boxShadow: statusFilter === 'all' ? '0 2px 6px rgba(28,25,23,0.15)' : 'none'
          }}
        >
          Всі ({statusCounts.all || 0})
        </button>
        {STATUS_OPTIONS.map(s => (
          statusCounts[s.id] ? (
            <button
              key={s.id}
              onClick={() => { setStatusFilter(s.id); setPage(1); }}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                cursor: 'pointer',
                border: statusFilter === s.id ? 'none' : '1.5px solid #e7e5e4',
                backgroundColor: statusFilter === s.id ? s.color : 'white',
                color: statusFilter === s.id ? '#fff' : s.color,
                boxShadow: statusFilter === s.id ? '0 2px 6px rgba(0,0,0,0.12)' : 'none'
              }}
            >
              {s.label} ({statusCounts[s.id]})
            </button>
          ) : null
        ))}
      </div>

      {/* Search + toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="sm:flex-row sm:items-center sm:justify-between">
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search 
            size={16} 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a8a29e', pointerEvents: 'none' }} 
          />
          <input
            type="text"
            placeholder="Пошук за ім'ям, №, ТТН, телефоном..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{
              width: '100%',
              padding: '12px 38px 12px 44px',
              background: isSearchFocused ? 'white' : '#fafaf9',
              borderRadius: '10px',
              border: isSearchFocused ? '1.5px solid #a8a29e' : '1.5px solid #e7e5e4',
              fontSize: '14px',
              color: '#1c1917',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '13px', color: '#a8a29e', fontWeight: 500 }}>
          Показано {orders.length} з {totalCount}
        </div>
      </div>

      {/* Table SectionCard */}
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        border: '1px solid rgba(231,229,228,0.8)', 
        boxShadow: '0 2px 12px rgba(28,25,23,0.04), 0 1px 3px rgba(28,25,23,0.03)', 
        overflow: 'hidden' 
      }}>
        {/* Card Header with Gradient */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px', 
          padding: '22px 28px', 
          borderBottom: '1px solid #f5f5f4', 
          background: 'linear-gradient(to bottom, #fafaf9, white)' 
        }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: '#f0fdf4', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0 
          }}>
            <ShoppingBag size={20} color="#16a34a" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0, letterSpacing: '-0.02em' }}>
              Список замовлень
            </h2>
            <p style={{ fontSize: '13px', color: '#a8a29e', margin: '3px 0 0', fontWeight: 400 }}>
              Клікніть на заголовок колонки для сортування або на номер для деталей
            </p>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0efed', background: '#fafaf9' }}>
                {[
                  { label: '№', key: 'order_number', width: '60px', center: false },
                  { label: 'Клієнт', key: 'full_name', width: 'auto', center: true },
                  { label: 'Сума', key: 'total', width: '90px', center: false },
                  { label: 'Статус', key: 'status', width: '160px', center: true },
                  { label: 'ТТН', key: 'tracking_number', width: '220px', center: true, hiddenCls: 'hidden lg:table-cell' },
                  { label: 'Дата', key: 'created_at', width: '95px', center: false, hiddenCls: 'hidden md:table-cell' },
                  { label: '', key: null, width: '45px', center: true },
                ].map((h, idx) => (
                  <th
                    key={h.key || h.label || `col-${idx}`}
                    onClick={() => h.key && requestSort(h.key)}
                    style={{
                      padding: '14px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#a8a29e',
                      width: h.width,
                      cursor: h.key ? 'pointer' : 'default',
                      userSelect: 'none'
                    }}
                    className={`${h.hiddenCls || ''} ${h.key ? 'group hover:text-stone-900 transition-colors' : ''}`}
                  >
                    {h.key ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: h.center ? 'center' : 'flex-start' }}>
                        {h.label} <SortIcon column={h.key} />
                      </div>
                    ) : h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ divideWidth: '1px', divideColor: '#f5f5f4' }}>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f5f4' }}>
                    <td style={{ padding: '16px 24px' }}><div style={{ height: '16px', background: '#f0efed', borderRadius: '6px', width: '40px' }} /></td>
                    <td style={{ padding: '16px 24px' }}><div style={{ height: '16px', background: '#f0efed', borderRadius: '6px', width: '130px', margin: '0 auto' }} /></td>
                    <td style={{ padding: '16px 24px' }}><div style={{ height: '16px', background: '#f0efed', borderRadius: '6px', width: '64px' }} /></td>
                    <td style={{ padding: '16px 24px' }}><div style={{ height: '24px', background: '#f0efed', borderRadius: '999px', width: '96px', margin: '0 auto' }} /></td>
                    <td style={{ padding: '16px 24px' }} className="hidden lg:table-cell"><div style={{ height: '16px', background: '#f0efed', borderRadius: '6px', width: '110px', margin: '0 auto' }} /></td>
                    <td style={{ padding: '16px 24px' }} className="hidden md:table-cell"><div style={{ height: '16px', background: '#f0efed', borderRadius: '6px', width: '80px' }} /></td>
                    <td style={{ padding: '16px 24px' }} />
                    <td style={{ padding: '16px 24px' }} />
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '32px 24px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #f5f5f4', background: '#fafaf9' }}>
            <p style={{ fontSize: '13px', color: '#78716c', margin: 0, fontWeight: 500 }}>
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} з {totalCount}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: page === 1 ? '#a8a29e' : '#44403c',
                  background: 'white',
                  border: '1.5px solid #e7e5e4',
                  borderRadius: '10px',
                  cursor: page === 1 ? 'default' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                  transition: 'all 0.15s'
                }}
              >
                ←
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                const isActive = page === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: '36px',
                      height: '36px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 600,
                      borderRadius: '10px',
                      border: isActive ? 'none' : '1px solid transparent',
                      background: isActive ? '#1c1917' : 'transparent',
                      color: isActive ? 'white' : '#57534e',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: page === totalPages ? '#a8a29e' : '#44403c',
                  background: 'white',
                  border: '1.5px solid #e7e5e4',
                  borderRadius: '10px',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                  transition: 'all 0.15s'
                }}
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
  const [isHovered, setIsHovered] = useState(false);
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
    <tr 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        borderBottom: '1px solid #f5f5f4',
        background: isHovered ? '#fafaf9' : 'transparent',
        transition: 'background 0.15s'
      }}
    >
      {/* № або платформа */}
      <td style={{ padding: '14px 12px' }}>
        {order.marketplace_platform ? (
          <Link href={`/admin/orders/${order.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', width: 'fit-content' }}>
            {order.marketplace_platform === 'instagram' ? (
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #a855f7, #ec4899, #fb923c)', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }} fill="none" stroke="white" strokeWidth="1.8">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
                </svg>
              </div>
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #ef4444, #fb923c)', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '14px' }}>K</span>
              </div>
            )}
            <span style={{ fontSize: '11px', color: '#a8a29e', fontWeight: 600 }}>#{order.order_number}</span>
          </Link>
        ) : (
          <Link href={`/admin/orders/${order.id}`} style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', textDecoration: 'none' }}>
            #{order.order_number}
          </Link>
        )}
      </td>

      {/* Client */}
      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
        <Link href={`/admin/orders/${order.id}`} style={{ textDecoration: 'none', display: 'block', minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.full_name || 'Гість'}
          </p>
          <p style={{ fontSize: '12px', color: '#a8a29e', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.phone || order.email || '—'}
          </p>
        </Link>
      </td>

      {/* Total */}
      <td style={{ padding: '14px 12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(order.total)} ₴
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
        <select
          value={order.status}
          onChange={handleStatusChange}
          disabled={updating}
          style={{ 
            color: status.color, 
            backgroundColor: status.bg, 
            textAlignLast: 'center',
            fontSize: '11px',
            fontWeight: 700,
            padding: '7px 22px 7px 14px',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            width: 'auto',
            minWidth: '150px',
            maxWidth: '180px',
            display: 'inline-block'
          }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </td>

      {/* TTN */}
      <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }} className="hidden lg:table-cell">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '215px', margin: '0 auto' }}>
          {order.delivery_method === 'nova_poshta' && (
            <img src="/footerlogos/NP-mini-icon.svg" alt="Нова Пошта" style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: 0.8, flexShrink: 0 }} />
          )}
          {order.delivery_method === 'ukrposhta' && (
            <img src="/footerlogos/Ukrposhta-mini-icon.svg" alt="Укрпошта" style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: 0.8, flexShrink: 0 }} />
          )}
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input
              type="text"
              placeholder="—"
              value={ttn}
              onChange={(e) => {
                setTtn(e.target.value);
                setIsTtnChanged(e.target.value !== (order.tracking_number || ''));
              }}
              onKeyDown={(e) => e.key === 'Enter' && isTtnChanged && handleTtnSave()}
              style={{
                fontSize: '12.5px',
                fontFamily: 'monospace',
                padding: '6px 26px 6px 8px',
                width: '100%',
                background: '#fafaf9',
                border: '1.5px solid #e7e5e4',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#1c1917'
              }}
            />
            {isTtnChanged && (
              <button
                onClick={handleTtnSave}
                disabled={updating}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '999px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Check size={12} strokeWidth={3} />
              </button>
            )}
          </div>
          {order.tracking_number && (
            <button
              onClick={handleSyncStatus}
              disabled={updating}
              style={{
                padding: '6px',
                color: '#a8a29e',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
              }}
              className={`hover:bg-stone-100 transition-all ${updating ? 'animate-spin opacity-50' : ''}`}
              title="Синхронізація з поштою"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </td>

      {/* Date */}
      <td style={{ padding: '14px 12px' }} className="hidden md:table-cell">
        <span style={{ fontSize: '13px', color: '#a8a29e', fontWeight: 500 }}>{formatDateShort(order.created_at)}</span>
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
        <Link
          href={`/admin/orders/${order.id}`}
          style={{
            padding: '8px',
            color: '#a8a29e',
            borderRadius: '8px',
            display: 'inline-flex',
            transition: 'all 0.15s'
          }}
          className="hover:text-stone-800 hover:bg-stone-100"
          title="Деталі"
        >
          <ExternalLink size={15} />
        </Link>
      </td>
    </tr>
  );
}
