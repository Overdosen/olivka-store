'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, Users, ShoppingBag, ChevronUp, ArrowUpDown, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const STATUS_MAP = {
  new:       { label: 'Нове',         color: '#b5880b', bg: '#fef9e7' },
  shipped:   { label: 'Відправлено',  color: '#e65100', bg: '#fff3e0' },
  delivered: { label: 'Доставлено',   color: '#2e7d32', bg: '#e8f5e9' },
  cancelled: { label: 'Скасовано',    color: '#c62828', bg: '#ffebee' },
  paid:      { label: 'Сплачено',     color: '#10b981', bg: '#ecfdf5' },
  payment_error: { label: 'Помилка оплати', color: '#dc2626', bg: '#fef2f2' },
  pending_payment: { label: 'Очікує оплати', color: '#7c3aed', bg: '#f5f3ff' },
};

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([id, v]) => ({ id, ...v }));

export default function CustomersPage() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'lastOrderDate', direction: 'desc' });


  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Групуємо замовлення та створюємо гостьові профілі
    const allProfiles = profiles || [];
    const profilesMap = Object.fromEntries(allProfiles.map(p => [p.id, p]));
    const ordersMap = {};
    const guestProfiles = {};

    (allOrders || []).forEach(o => {
      if (o.user_id) {
        if (!ordersMap[o.user_id]) ordersMap[o.user_id] = [];
        ordersMap[o.user_id].push(o);

        // Якщо профілю немає в таблиці profiles, створюємо віртуальний
        if (!profilesMap[o.user_id] && !guestProfiles[o.user_id]) {
          guestProfiles[o.user_id] = {
            id: o.user_id,
            full_name: o.full_name,
            email: o.email,
            phone_ua: o.phone,
            created_at: o.created_at,
            isMissingProfile: true
          };
        }
      } else if (o.email) {
        const guestKey = `guest_${o.email}`;
        if (!ordersMap[guestKey]) ordersMap[guestKey] = [];
        ordersMap[guestKey].push(o);

        if (!guestProfiles[guestKey] || new Date(o.created_at) > new Date(guestProfiles[guestKey].created_at)) {
          guestProfiles[guestKey] = {
            id: guestKey,
            full_name: o.full_name,
            email: o.email,
            phone_ua: o.phone,
            created_at: guestProfiles[guestKey]?.created_at || o.created_at,
            isGuest: true
          };
        }
      }
    });

    const combinedClients = [...allProfiles, ...Object.values(guestProfiles)].map(client => {
      const clientOrders = ordersMap[client.id] || [];
      const lastOrder = clientOrders[0]; // Orders are already sorted by created_at desc
      const totalAmount = clientOrders.reduce((s, o) => s + (o.total || 0), 0);
      
      return {
        ...client,
        lastOrderDate: lastOrder ? lastOrder.created_at : null,
        ordersCount: clientOrders.length,
        totalAmount
      };
    });

    setClients(combinedClients);
    setOrders(ordersMap);
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchData(); 

    // Підписка на зміни в замовленнях
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const sortedClients = [...clients].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === 'full_name') {
      aValue = aValue || a.email || '';
      bValue = bValue || b.email || '';
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredClients = sortedClients.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone_ua || '').toLowerCase().includes(q)
    );
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 text-stone-900" /> 
      : <ChevronDown className="w-3.5 h-3.5 text-stone-900" />;
  };

  const formatDate = (dateString, showNever = true) => {
    if (!dateString) return showNever ? <span className="text-stone-300 italic">немає</span> : '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  };

  async function updateOrderStatus(orderId, newStatus) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    // Оновлюємо локально
    setOrders(prev => {
      const updated = { ...prev };
      for (const uid in updated) {
        updated[uid] = updated[uid].map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        );
      }
      return updated;
    });
    // Оновлюємо вибраного клієнта
    if (selectedClient) {
      setSelectedClient(c => ({
        ...c,
        _orders: (c._orders || []).map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ),
      }));
    }
  }

  function openClient(client) {
    setSelectedClient({ ...client, _orders: orders[client.id] || [] });
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-cormorant font-bold text-stone-800 tracking-tight">Клієнти</h1>
          <p className="text-stone-500 mt-1 md:mt-2 font-medium text-sm md:text-base">База клієнтів та замовлень.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard label="Всього клієнтів" value={clients.length} />
        <StatCard
          label="Нових за тиждень"
          value={clients.filter(c => {
            const d = new Date(c.created_at);
            const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
            return d >= weekAgo;
          }).length}
        />
        <StatCard
          label="Всього замовлень"
          value={Object.values(orders).reduce((s, arr) => s + arr.length, 0)}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Пошук (ім'я, email, телефон)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-stone-50 rounded-md border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-sm font-medium placeholder-stone-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-xs font-medium text-stone-400 whitespace-nowrap">
            Знайдено: {filteredClients.length}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse text-sm min-w-[600px] md:min-w-full">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200">
                {[
                  { label: 'Клієнт', key: 'full_name', className: '' },
                  { label: 'Email', key: 'email', className: 'hidden lg:table-cell' },
                  { label: 'Телефон', key: 'phone_ua', className: 'hidden md:table-cell' },
                  { label: 'Дата', key: 'lastOrderDate', className: 'hidden sm:table-cell' },
                  { label: 'З-нь', key: 'ordersCount', className: 'w-20' },
                  { label: 'Сума', key: 'totalAmount', className: 'text-right pr-8' }
                ].map(h => (
                  <th 
                    key={h.key} 
                    className={`py-4 px-5 font-semibold text-stone-500 text-xs cursor-pointer hover:text-stone-900 transition-colors group whitespace-nowrap ${h.className}`}
                    onClick={() => requestSort(h.key)}
                  >
                    <div className={`flex items-center gap-1.5 list-none ${h.className.includes('text-right') ? 'justify-end' : ''}`}>
                      {h.label} <SortIcon column={h.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                // Skeleton loading state
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse bg-white border-b border-stone-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-full flex-shrink-0"></div>
                        <div className="flex flex-col gap-1 w-full max-w-[120px]">
                          <div className="h-4 bg-stone-100 rounded w-full"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 bg-stone-100 rounded w-32"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-stone-100 rounded w-28"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-stone-100 rounded w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-5 bg-stone-100 rounded-full w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-stone-100 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="6" className="py-20 px-4 text-center bg-white">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-stone-50 flex items-center justify-center rounded-lg border border-stone-100 mb-4 shadow-sm">
                        <Users className="w-8 h-8 text-stone-400" />
                      </div>
                      <h3 className="text-base font-semibold text-stone-900">Немає клієнтів</h3>
                      <p className="text-sm text-stone-500 mt-1 max-w-sm">
                        Спробуйте змінити критерії пошуку.
                      </p>
                      {search && (
                        <button 
                          onClick={() => setSearch('')} 
                          className="mt-4 px-4 py-2 bg-stone-100/50 hover:bg-stone-100 rounded-md text-sm font-medium text-stone-700 transition-colors"
                        >
                          Скинути пошук
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, i) => {
                  const co = orders[client.id] || [];
                  const total = co.reduce((s, o) => s + (o.total || 0), 0);
                  return (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => openClient(client)}
                      className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer transition-colors bg-white group"
                    >
                      <td className={`px-5 py-3 ${sortConfig.key === 'full_name' ? 'bg-stone-50/40 group-hover:bg-transparent' : ''}`}>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-[10px] md:text-sm flex-shrink-0 ${client.isGuest ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-600'}`}>
                            {(client.full_name || client.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-stone-900 truncate max-w-[120px] md:max-w-none">{client.full_name || '—'}</span>
                            {client.isGuest && <span className="text-[9px] uppercase tracking-tighter text-amber-600 font-bold mt-0.5">Гість</span>}
                            {client.isMissingProfile && <span className="text-[9px] uppercase tracking-tighter text-rose-500 font-bold mt-0.5">Без профілю</span>}
                            <div className="md:hidden mt-0.5 opacity-60 text-[10px] truncate max-w-[120px]">
                              {client.phone_ua || orders[client.id]?.[0]?.phone || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-5 py-3 text-stone-600 hidden lg:table-cell ${sortConfig.key === 'email' ? 'bg-stone-50/40 group-hover:bg-transparent' : ''}`}>{client.email}</td>
                      <td className={`px-5 py-3 text-stone-600 hidden md:table-cell ${sortConfig.key === 'phone_ua' ? 'bg-stone-50/40 group-hover:bg-transparent' : ''}`}>{client.phone_ua || orders[client.id]?.[0]?.phone || '—'}</td>
                      <td className={`px-5 py-3 text-stone-500 text-[11px] whitespace-nowrap hidden sm:table-cell ${sortConfig.key === 'lastOrderDate' ? 'bg-stone-50/40 group-hover:bg-transparent' : ''}`}>
                        {formatDate(client.lastOrderDate)}
                      </td>
                      <td className={`px-5 py-3 ${sortConfig.key === 'ordersCount' ? 'bg-stone-50/40 group-hover:bg-transparent' : ''}`}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200/60 text-stone-700 text-[9px] md:text-[10px] font-bold uppercase tracking-tight shadow-xs">
                          {client.ordersCount}
                        </span>
                      </td>
                      <td className={`px-5 py-3 font-semibold text-stone-900 text-sm md:text-base text-right pr-8 ${sortConfig.key === 'totalAmount' ? 'bg-stone-50/40 group-hover:bg-transparent' : ''}`}>
                        {client.totalAmount > 0 ? `${client.totalAmount}₴` : '—'}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальне вікно клієнта */}
      <AnimatePresence>
        {selectedClient && (
          <ClientModal
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onUpdateStatus={updateOrderStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, className = "" }) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-4 md:p-6 rounded-md shadow-sm border border-stone-200/60 hover:shadow-md transition-shadow ${className}`}>
      <p className="text-[10px] md:text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">{label}</p>
      <p className="text-2xl md:text-4xl font-cormorant font-bold text-stone-800">{value}</p>
    </div>
  );
}

// ─── ClientModal ──────────────────────────────────────────────────────────────

function ClientModal({ client, onClose, onUpdateStatus }) {
  const clientOrders = client._orders || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        className="bg-[#faf9f6] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        {/* Шапка */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${client.isGuest ? 'bg-amber-500 text-white' : 'bg-stone-800 text-white'}`}>
              {(client.full_name || client.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-stone-800">{client.full_name || 'Без імені'}</h3>
                {client.isGuest && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                    Гість
                  </span>
                )}
                {client.isMissingProfile && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    Без профілю
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-400">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition p-1">
            <X size={20} />
          </button>
        </div>

        {/* Контакти */}
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-stone-100">
          <InfoItem label="Телефон" value={client.phone_ua || clientOrders[0]?.phone || '—'} />
          <InfoItem label="Реєстрація" value={new Date(client.created_at).toLocaleDateString('uk-UA')} />
        </div>

        {/* Замовлення */}
        <div className="p-4 md:p-6">
          <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
            Замовлення ({clientOrders.length})
          </h4>
          {clientOrders.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-4">Замовлень немає</p>
          ) : (
            <div className="flex flex-col gap-3">
              {clientOrders.map(order => (
                <OrderRow key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── OrderRow ─────────────────────────────────────────────────────────────────

function OrderRow({ order, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const status = STATUS_MAP[order.status] || STATUS_MAP.new;
  const items = Array.isArray(order.items) ? order.items : [];
  const dateObj = new Date(order.created_at);
  const dateStr = dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*р\.?$/, '');
  const timeStr = dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  async function handleStatusChange(e) {
    setUpdating(true);
    await onUpdateStatus(order.id, e.target.value);
    setUpdating(false);
  }

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3.5 bg-white">
        <button onClick={() => setExpanded(v => !v)} className="flex-1 flex items-center gap-3 text-left">
          <ChevronDown size={15} className={`text-stone-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-stone-600">#{order.order_number || order.id.slice(0,8).toUpperCase()}</span>
              {Array.isArray(order.items) && order.items.some(i => i.sku) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-bold border border-stone-200/50">
                  {Array.from(new Set(order.items.map(i => i.sku).filter(Boolean))).join(', ')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-400">{dateStr}, {timeStr}</span>
          </div>
          <span className="ml-auto font-semibold text-stone-700 text-sm">{order.total} грн</span>
        </button>

        {/* Dropdown статусу */}
        <select
          value={order.status}
          onChange={handleStatusChange}
          disabled={updating}
          style={{ color: status.color, background: status.bg }}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-full border-0 cursor-pointer outline-none focus:ring-2 focus:ring-stone-300 transition"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-2 border-t border-stone-100 bg-stone-50 text-sm">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 text-stone-600 border-b border-stone-100 last:border-0 items-baseline">
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}{item.size ? ` · ${item.size}` : ''} × {item.qty}</span>
                    {item.sku && <span className="text-[10px] text-stone-400 font-mono mt-0.5 tracking-wider">Артикул: {item.sku}</span>}
                  </div>
                  <span className="text-stone-500 font-medium">{item.price * item.qty} грн</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-stone-200/60 flex flex-col gap-2">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {order.full_name && (
                    <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                      👤 {order.full_name}
                    </p>
                  )}
                  {order.phone && (
                    <p className="text-xs text-stone-500 font-medium flex items-center gap-1">
                      📞 {order.phone}
                    </p>
                  )}
                  {order.address && (
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                      📍 {order.address}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    💳 {order.payment_method === 'cash_on_delivery' ? 'Післяплата' : order.payment_method} 
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                      {order.status === 'paid' ? 'Оплачено' : 'Очікує оплати'}
                    </span>
                  </p>
                  {order.notes && (
                    <p className="text-xs text-stone-600 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100/50 flex items-start gap-1.5 w-full mt-1 italic">
                      <span className="text-amber-500 shrink-0">💬</span>
                      "{order.notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">{label}</p>
      <p className="text-sm text-stone-700">{value}</p>
    </div>
  );
}
