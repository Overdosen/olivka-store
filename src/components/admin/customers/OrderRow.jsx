'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShoppingBag, RefreshCw, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { STATUS_MAP, STATUS_OPTIONS, getAuthHeaders } from '../../../lib/admin-constants';
import Image from 'next/image';

export default function OrderRow({ order, onUpdateStatus, onUpdateTracking, onImageClick }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [ttn, setTtn] = useState(order.tracking_number || '');
  const [isTtnChanged, setIsTtnChanged] = useState(false);
  const status = STATUS_MAP[order.status] || STATUS_MAP.new;
  const items = Array.isArray(order.items) ? order.items : [];
  const dateObj = new Date(order.created_at);
  const dateStr = dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*р\.?$/, '');
  const timeStr = dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

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
            toast.success('Лист про доставку успішно відправлено клієнту');
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
        toast.error(data.error || `Помилка отримання даних з ${serviceName}`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        await onUpdateStatus(order.id, data.newStatus);
        const statusMsg = isUkrposhta ? data.upStatus : data.npStatus;
        toast.success(`Статус оновлено: ${statusMsg}`);
      } else {
        toast.error(data.error || 'Помилка синхронізації');
      }
    } catch (err) {
      toast.error('Помилка запиту');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
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

        {/* ТТН Поле */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="ТТН"
              value={ttn}
              onChange={(e) => {
                setTtn(e.target.value);
                setIsTtnChanged(e.target.value !== (order.tracking_number || ''));
              }}
              onKeyDown={(e) => e.key === 'Enter' && isTtnChanged && handleTtnSave()}
              className="text-[10px] md:text-xs font-mono px-3 py-2 w-28 md:w-32 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 transition"
            />
            {isTtnChanged && (
              <button
                onClick={handleTtnSave}
                disabled={updating}
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95 z-10"
              >
                <Check size={14} strokeWidth={3} />
              </button>
            )}
          </div>
          {order.tracking_number && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSyncStatus}
                disabled={updating}
                className={`p-1.5 text-stone-400 hover:text-stone-800 transition-all ${updating ? 'animate-spin opacity-50' : ''}`}
                title="Оновити статус з Нової Пошти"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Dropdown статусу */}
        <select
          value={order.status}
          onChange={handleStatusChange}
          disabled={updating}
          style={{ color: status.color, background: status.bg }}
          className="text-xs font-semibold px-3 py-2 rounded-full border-0 cursor-pointer outline-none focus:ring-2 focus:ring-stone-300 transition"
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
                <div key={i} className="flex gap-3 py-2 text-stone-600 border-b border-stone-100 last:border-0 items-center">
                  <div 
                    className="relative w-12 h-12 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200/50 cursor-zoom-in hover:opacity-80 transition-opacity"
                    onClick={() => item.image_url && onImageClick(item.image_url)}
                  >
                    {item.image_url ? (
                      <Image 
                        src={item.image_url} 
                        alt={item.name} 
                        fill sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-stone-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex justify-between items-baseline min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-stone-800 leading-snug truncate">
                        {item.name}{item.size ? ` · ${item.size}` : ''} × {item.qty}
                      </span>
                      {item.sku && (
                        <span className="text-[10px] text-stone-400 font-mono mt-0.5 tracking-wider">
                          Артикул: {item.sku}
                        </span>
                      )}
                    </div>
                    <span className="text-stone-500 font-semibold whitespace-nowrap ml-4">
                      {item.price * item.qty} грн
                    </span>
                  </div>
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
                      &quot;{order.notes}&quot;
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
