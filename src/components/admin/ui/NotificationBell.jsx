'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { STATUS_MAP, formatDateShort } from '../../../lib/admin-constants';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export default function NotificationBell() {
  const [newCount, setNewCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  // Fetch new orders count
  useEffect(() => {
    async function fetchNewOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, full_name, total, status, created_at')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setNewCount(data.length);
        setRecentOrders(data);
      }
    }

    fetchNewOrders();

    // Real-time subscription
    const channel = supabase
      .channel('notification-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchNewOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {newCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 border-2 border-white shadow-sm z-10">
              {newCount}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-stone-200/80 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-800">Сповіщення</p>
              {newCount > 0 && (
                <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  {newCount} нових
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {recentOrders.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-stone-400">
                  Немає нових замовлень
                </div>
              ) : (
                recentOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/admin/orders/${order.id}`);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-stone-800">
                        #{order.order_number}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {formatDateShort(order.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 truncate">
                      {order.full_name || 'Гість'} · {order.total} ₴
                    </p>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setOpen(false);
                router.push('/admin/orders');
              }}
              className="w-full px-4 py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-700 hover:bg-stone-50 border-t border-stone-100 transition-colors"
            >
              Всі замовлення →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
