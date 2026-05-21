'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown, Users, ArrowUpDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/admin/ui/PageHeader';
import StatCard from '../../../components/admin/ui/StatCard';
import ClientModal from '../../../components/admin/customers/ClientModal';

export default function CustomersPage() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
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
    setOrders(prev => {
      const updated = { ...prev };
      for (const uid in updated) {
        updated[uid] = updated[uid].map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        );
      }
      return updated;
    });
    if (selectedClient) {
      setSelectedClient(c => ({
        ...c,
        _orders: (c._orders || []).map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ),
      }));
    }
  }

  async function updateOrderTracking(orderId, trackingNumber) {
    await supabase.from('orders').update({ tracking_number: trackingNumber }).eq('id', orderId);
    setOrders(prev => {
      const updated = { ...prev };
      for (const uid in updated) {
        updated[uid] = updated[uid].map(o =>
          o.id === orderId ? { ...o, tracking_number: trackingNumber } : o
        );
      }
      return updated;
    });
    if (selectedClient) {
      setSelectedClient(c => ({
        ...c,
        _orders: (c._orders || []).map(o =>
          o.id === orderId ? { ...o, tracking_number: trackingNumber } : o
        ),
      }));
    }
  }

  function openClient(client) {
    setSelectedClient({ ...client, _orders: orders[client.id] || [] });
  }

  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Клієнти" subtitle="База клієнтів та замовлень." />

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
      <div className="bg-white rounded-lg shadow-sm border border-stone-200/80 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Пошук за ім'ям, email, телефоном..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition-all text-sm"
              style={{ paddingLeft: '44px', paddingRight: '40px' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-xs font-medium text-stone-400 whitespace-nowrap">
            Знайдено: {filteredClients.length} з {clients.length}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                {[
                  { label: 'Клієнт', key: 'full_name', className: 'w-1/3' },
                  { label: 'Email', key: 'email', className: 'hidden lg:table-cell' },
                  { label: 'Телефон', key: 'phone_ua', className: 'hidden md:table-cell' },
                  { label: 'Дата ост.', key: 'lastOrderDate', className: 'hidden sm:table-cell' },
                  { label: 'Зам.', key: 'ordersCount', className: 'w-20' },
                  { label: 'Сума', key: 'totalAmount', className: 'text-right pr-5' }
                ].map(h => (
                  <th 
                    key={h.key} 
                    className={`px-6 py-5 text-[10px] uppercase tracking-wider font-semibold text-stone-500 cursor-pointer hover:text-stone-700 transition-colors group ${h.className}`}
                    onClick={() => requestSort(h.key)}
                  >
                    <div className={`flex items-center gap-1.5 ${h.className.includes('text-right') ? 'justify-end' : ''}`}>
                      {h.label} <SortIcon column={h.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                // Skeleton loading state
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse bg-white">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-full flex-shrink-0"></div>
                        <div className="flex flex-col gap-1 w-full max-w-[120px]">
                          <div className="h-4 bg-stone-100 rounded w-full"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-32"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-28"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-5 bg-stone-100 rounded-full w-16"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-stone-100 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
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
                      className="hover:bg-stone-50/60 cursor-pointer transition-colors bg-white group"
                    >
                      <td className={`px-6 py-5 ${sortConfig.key === 'full_name' ? 'bg-stone-50/30' : ''}`}>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 ring-2 ring-white ${client.isGuest ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
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
                      <td className={`px-6 py-5 text-stone-600 text-[13px] hidden lg:table-cell ${sortConfig.key === 'email' ? 'bg-stone-50/30' : ''}`}>{client.email}</td>
                      <td className={`px-6 py-5 text-stone-600 text-[13px] hidden md:table-cell ${sortConfig.key === 'phone_ua' ? 'bg-stone-50/30' : ''}`}>{client.phone_ua || orders[client.id]?.[0]?.phone || '—'}</td>
                      <td className={`px-6 py-5 text-stone-400 text-xs whitespace-nowrap hidden sm:table-cell ${sortConfig.key === 'lastOrderDate' ? 'bg-stone-50/30' : ''}`}>
                        {formatDate(client.lastOrderDate)}
                      </td>
                      <td className={`px-6 py-5 ${sortConfig.key === 'ordersCount' ? 'bg-stone-50/30' : ''}`}>
                        <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-semibold">
                          {client.ordersCount}
                        </span>
                      </td>
                      <td className={`px-6 py-5 font-semibold text-stone-800 text-sm text-right pr-5 ${sortConfig.key === 'totalAmount' ? 'bg-stone-50/30' : ''}`}>
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
            onUpdateTracking={updateOrderTracking}
            onImageClick={(url) => setEnlargedImage(url)}
          />
        )}
      </AnimatePresence>

      {/* Просмотр увеличенного изображения */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEnlargedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
            >
              <img 
                src={enlargedImage} 
                alt="Enlarged product" 
                className="rounded-lg shadow-2xl max-h-[90vh] object-contain"
              />
              <button 
                onClick={() => setEnlargedImage(null)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 transition-colors"
              >
                <span className="text-sm font-medium">Закрити</span>
                <X size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
