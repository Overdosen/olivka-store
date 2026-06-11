'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { STATUS_MAP, STATUS_OPTIONS, DELIVERY_LABELS, PAYMENT_LABELS, getAuthHeaders, formatDateShort, formatMoney } from '../../../../lib/admin-constants';
import { getOptimizedUrl } from '../../../../lib/image-utils';
import StatusBadge from '../../../../components/admin/ui/StatusBadge';
import PageHeader from '../../../../components/admin/ui/PageHeader';
import { ArrowLeft, User, MapPin, CreditCard, Truck, Package, RefreshCw, Check, ShoppingBag, Mail, Phone, FileText, TrendingUp, ExternalLink, X, ZoomIn } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

function ImageZoom({ src, alt, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
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

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [ttn, setTtn] = useState('');
  const [isTtnChanged, setIsTtnChanged] = useState(false);
  const [fiscalReceiptUrl, setFiscalReceiptUrl] = useState('');
  const [isReceiptUrlChanged, setIsReceiptUrlChanged] = useState(false);

  const [products, setProducts] = useState([]);
  const [packagingCost, setPackagingCost] = useState('0');
  const [isPackagingChanged, setIsPackagingChanged] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editItemCost, setEditItemCost] = useState('');
  
  const [adminNotes, setAdminNotes] = useState('');
  const [isNotesSaving, setIsNotesSaving] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        toast.error('Замовлення не знайдено');
        router.push('/admin/orders');
        return;
      }

      setOrder(data);
      setTtn(data.tracking_number || '');
      setFiscalReceiptUrl(data.fiscal_receipt_url || '');
      setPackagingCost(String(data.packaging_cost || 0));

      // Fetch global scratchpad
      const { data: settingsData } = await supabase
        .from('global_settings')
        .select('value')
        .eq('id', 'admin_scratchpad')
        .single();
      if (settingsData) {
        setAdminNotes(settingsData.value || '');
      }

      const items = Array.isArray(data.items) ? data.items : [];
      const productIds = items.map(item => item.product_id || item.id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: productsData, error: prodError } = await supabase
          .from('products')
          .select('id, name, cost_price, sizes')
          .in('id', productIds);
        
        if (!prodError && productsData) {
          setProducts(productsData);
        }
      }

      setLoading(false);
    }

    fetchOrder();
  }, [id, router]);

  async function handleStatusChange(newStatus) {
    setUpdating(true);
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    setOrder(prev => ({ ...prev, status: newStatus }));

    const isShippingStatus = ['shipped', 'arrived', 'delivered'].includes(newStatus);
    if (isShippingStatus) {
      if (!order.tracking_number) {
        toast.custom(() => (
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
    await supabase.from('orders').update({ tracking_number: ttn }).eq('id', id);
    setOrder(prev => ({ ...prev, tracking_number: ttn }));
    setIsTtnChanged(false);
    toast.success('ТТН збережено');
    setUpdating(false);
  }

  async function handleReceiptUrlSave() {
    setUpdating(true);
    const { error } = await supabase
      .from('orders')
      .update({ fiscal_receipt_url: fiscalReceiptUrl })
      .eq('id', id);

    if (error) {
      toast.error('Помилка при збереженні чеку');
    } else {
      setOrder(prev => ({ ...prev, fiscal_receipt_url: fiscalReceiptUrl }));
      setIsReceiptUrlChanged(false);
      toast.success('Чек збережено');
    }
    setUpdating(false);
  }

  const calculateItemCost = (item) => {
    if (item.cost_price !== undefined && item.cost_price !== null) {
      return Number(item.cost_price);
    }
    
    const prodId = item.product_id || item.id;
    const product = products.find(p => p.id === prodId);
    if (product) {
      if (item.size && Array.isArray(product.sizes) && product.sizes.length > 0) {
        const sizeObj = product.sizes.find(s => s.name === item.size);
        if (sizeObj && sizeObj.cost_price !== undefined && sizeObj.cost_price !== null) {
          return Number(sizeObj.cost_price);
        }
      }
      return Number(product.cost_price || 0);
    }
    return 0;
  };

  async function handlePackagingSave() {
    const cost = Number(packagingCost) || 0;
    setUpdating(true);
    const { error } = await supabase
      .from('orders')
      .update({ packaging_cost: cost })
      .eq('id', id);

    if (error) {
      toast.error('Помилка збереження витрат на пакування');
    } else {
      setOrder(prev => ({ ...prev, packaging_cost: cost }));
      setIsPackagingChanged(false);
      toast.success('Витрати на пакування збережено');
    }
    setUpdating(false);
  }

  async function handleSaveItemCost(index) {
    const cost = Number(editItemCost) || 0;
    setUpdating(true);
    
    // clone items
    const newItems = [...order.items];
    newItems[index] = { ...newItems[index], cost_price: cost };

    const { error } = await supabase
      .from('orders')
      .update({ items: newItems })
      .eq('id', id);

    if (error) {
      toast.error('Помилка при збереженні собівартості');
    } else {
      setOrder(prev => ({ ...prev, items: newItems }));
      setEditingItemIndex(null);
      toast.success('Собівартість товару оновлено');
    }
    setUpdating(false);
  }

  async function handleAdminNotesSave() {
    setIsNotesSaving(true);
    const { error } = await supabase
      .from('global_settings')
      .upsert({ id: 'admin_scratchpad', value: adminNotes });

    if (!error) {
      toast.success('Глобальну нотатку збережено', { id: 'note-saved' });
    } else {
      toast.error('Помилка при збереженні нотатки');
    }
    setIsNotesSaving(false);
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
        setOrder(prev => ({ ...prev, status: data.newStatus }));
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-stone-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-96 bg-stone-100 rounded-lg" />
          <div className="h-64 bg-stone-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const status = STATUS_MAP[order.status] || STATUS_MAP.new;
  const dateObj = new Date(order.created_at);
  const dateStr = dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  const itemsTotalCost = items.reduce((sum, item) => {
    const qty = Number(item.qty || item.quantity || 1);
    return sum + (qty * calculateItemCost(item));
  }, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-semibold text-stone-900">
              Замовлення #{order.order_number}
            </h1>
            <StatusBadge status={order.status} size="md" />
          </div>
          <p className="text-xs text-stone-400 mt-1">{dateStr}, {timeStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left column — items */}
        <div className="lg:col-span-2 space-y-5">
          {/* Products */}
          <div className="bg-white rounded-lg border border-stone-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-800">Товари ({items.length})</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {items.map((item, i) => {
                const prodId = item.product_id || item.id;
                return (
                <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50/50 transition-colors">
                  <div 
                    className="relative w-11 h-11 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200/50 block group cursor-pointer"
                    onClick={() => {
                      if (item.image_url) setZoomedImage(item.image_url);
                    }}
                  >
                    {item.image_url ? (
                      <>
                        <Image src={item.image_url} alt={item.name} fill sizes="44px" className="object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-stone-400" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/products/${prodId}`} className="text-[12px] md:text-[13px] font-semibold text-stone-900 hover:text-emerald-600 transition-colors truncate block">
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {item.size && <span className="text-[11px] text-stone-500 font-medium">Розмір: {item.size}</span>}
                      {item.sku && <span className="text-[11px] text-stone-500 font-medium font-mono">Арт: {item.sku}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] md:text-[13px] font-bold text-stone-900 tabular-nums">{formatMoney(item.price * (item.qty || item.quantity || 1))} ₴</p>
                    <div className="flex flex-col items-end gap-1 mt-1">
                      <p className="text-[11px] text-stone-500 font-medium">× {item.qty || item.quantity || 1}</p>
                      {editingItemIndex === i ? (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            min="0"
                            value={editItemCost}
                            onChange={(e) => setEditItemCost(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveItemCost(i)}
                            className="w-16 text-right px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                            autoFocus
                          />
                          <span className="text-[11px] text-stone-500">₴</span>
                          <button
                            onClick={() => handleSaveItemCost(i)}
                            disabled={updating}
                            className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm shrink-0"
                          >
                            <Check size={10} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="bg-stone-100 text-stone-600 font-normal px-1.5 py-0.5 rounded text-[10px] md:text-[11px] inline-block cursor-pointer hover:bg-stone-200 hover:text-stone-800 transition-colors border border-transparent hover:border-stone-300"
                          onClick={() => {
                            setEditingItemIndex(i);
                            setEditItemCost(String(calculateItemCost(item)));
                          }}
                          title="Натисніть, щоб змінити собівартість для цього замовлення"
                        >
                          закупка: {formatMoney(calculateItemCost(item))} ₴
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
            
            {/* Фінансова статистика замовлення */}
            <div className="px-5 py-5 border-t border-stone-100 bg-stone-50/40 space-y-4">
              {/* Сума товарів */}
              <div className="flex justify-between items-center text-[17px] md:text-[18px] font-bold text-stone-700">
                <span>Загалом по товарах</span>
                <span className="tabular-nums text-stone-900 font-black text-[20px] md:text-[22px]">{formatMoney(order.total)} ₴</span>
              </div>

              {/* Ручні витрати на пакування */}
              <div className="flex justify-between items-center text-[16px] md:text-[17px] font-semibold text-stone-600">
                <span>Вартість пакування</span>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      disabled={updating}
                      value={packagingCost}
                      onChange={(e) => {
                        setPackagingCost(e.target.value);
                        setIsPackagingChanged(e.target.value !== String(order.packaging_cost || 0));
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && isPackagingChanged && handlePackagingSave()}
                      className="w-20 text-right px-2 py-1 bg-white border border-stone-200/80 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 text-[15px] font-bold text-stone-800"
                    />
                    <span className="text-sm font-semibold text-stone-400 ml-1.5">₴</span>
                    
                    {isPackagingChanged && (
                      <button
                        onClick={handlePackagingSave}
                        disabled={updating}
                        className="ml-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm"
                        title="Зберегти пакування"
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-200/60 my-2" />

              {/* Розрахункова собівартість (COGS + пакування) */}
              <div className="flex justify-between items-start text-[15px] font-semibold text-stone-500">
                <div className="flex flex-col">
                  <span>Собівартість замовлення</span>
                  <span className="text-xs font-normal text-stone-400/90 mt-0.5">
                    (товари: {formatMoney(itemsTotalCost)} ₴ + пакування: {formatMoney(Number(packagingCost) || 0)} ₴)
                  </span>
                </div>
                <span className="tabular-nums text-stone-800 font-bold text-[16px] md:text-[17px]">{formatMoney(itemsTotalCost + (Number(packagingCost) || 0))} ₴</span>
              </div>

              {/* Чистий прибуток */}
              <div className="flex justify-between items-center p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80 shadow-[0_1px_3px_rgba(16,185,129,0.03)] mt-2">
                <span className="text-[15px] md:text-[16px] text-emerald-850 font-bold">Чистий прибуток</span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-[16px] md:text-[17px] font-extrabold text-emerald-700 tabular-nums">
                    +{formatMoney(Number(order.total || 0) - (itemsTotalCost + (Number(packagingCost) || 0)))} ₴
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50/60 rounded-lg border border-amber-200/60 p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-stone-800">Коментар клієнта</h2>
              </div>
              <p className="text-sm text-stone-600 italic">"{order.notes}"</p>
            </div>
          )}
        </div>

        {/* Right column — info */}
        <div className="space-y-[5px] lg:sticky lg:top-5">
          {/* Status management */}
          <div className="bg-white rounded-lg border border-stone-200/80 p-5">
            <h2 className="text-sm font-semibold text-stone-800 mb-4">Статус</h2>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              style={{ color: status.color, backgroundColor: status.bg }}
              className="w-full text-sm font-semibold px-4 py-2.5 rounded-lg border-0 cursor-pointer outline-none focus:ring-2 focus:ring-stone-300 transition-all mb-4"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* TTN */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">ТТН</label>
              <div className="flex items-center gap-2">
                {order.delivery_method === 'nova_poshta' && (
                  <img src="/footerlogos/NP-mini-icon.svg" alt="Нова Пошта" className="w-6 h-6 object-contain opacity-80 shrink-0" />
                )}
                {order.delivery_method === 'ukrposhta' && (
                  <img src="/footerlogos/Ukrposhta-mini-icon.svg" alt="Укрпошта" className="w-6 h-6 object-contain opacity-80 shrink-0" />
                )}
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Введіть номер ТТН"
                    value={ttn}
                    onChange={(e) => {
                      setTtn(e.target.value);
                      setIsTtnChanged(e.target.value !== (order.tracking_number || ''));
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && isTtnChanged && handleTtnSave()}
                    className="w-full text-sm font-mono px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition"
                  />
                  {isTtnChanged && (
                    <button
                      onClick={handleTtnSave}
                      disabled={updating}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
                {order.tracking_number && (
                  <button
                    onClick={handleSyncStatus}
                    disabled={updating}
                    className={`p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-all ${updating ? 'animate-spin opacity-50' : ''}`}
                    title="Синхронізація з поштою"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Чек (посилання) */}
            <div className="space-y-2 mt-5 pt-5 border-t border-stone-100">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Чек (посилання)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Введіть посилання на чек"
                    value={fiscalReceiptUrl}
                    onChange={(e) => {
                      setFiscalReceiptUrl(e.target.value);
                      setIsReceiptUrlChanged(e.target.value !== (order.fiscal_receipt_url || ''));
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && isReceiptUrlChanged && handleReceiptUrlSave()}
                    className="w-full text-sm font-mono px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400 transition"
                  />
                  {isReceiptUrlChanged && (
                    <button
                      onClick={handleReceiptUrlSave}
                      disabled={updating}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-all"
                      title="Зберегти чек"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
                {order.fiscal_receipt_url && (
                  <a
                    href={order.fiscal_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-all shrink-0"
                    title="Переглянути чек у новій вкладці"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-lg border border-stone-200/80 p-5">
            <h2 className="text-sm font-semibold text-stone-800 mb-4">Клієнт</h2>
            <div className="space-y-3">
              {order.full_name && (
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-700">{order.full_name}</span>
                </div>
              )}
              {order.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-700">{order.phone}</span>
                </div>
              )}
              {order.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-sm text-stone-700 truncate">{order.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Payment */}
          <div className="bg-white rounded-lg border border-stone-200/80 p-5">
            <h2 className="text-sm font-semibold text-stone-800 mb-4">Доставка та оплата</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-stone-700">{DELIVERY_LABELS[order.delivery_method] || order.delivery_method}</p>
                  {order.address && <p className="text-xs text-stone-400 mt-0.5">{order.address}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <span className="text-sm text-stone-700">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Global Notes */}
          <div className="bg-amber-50/80 rounded-lg border border-amber-200/60 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-900">Блокнот</h2>
            </div>
            <textarea
              className="w-full text-sm px-3 py-2 bg-white/80 border border-amber-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition resize-none custom-scrollbar text-amber-950 font-medium"
              rows={5}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              onBlur={handleAdminNotesSave}
            />
            {isNotesSaving && (
              <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Збереження...
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Модальне вікно для збільшеного фото */}
      {zoomedImage && (
        <ImageZoom 
          src={zoomedImage} 
          alt="Збільшене фото" 
          onClose={() => setZoomedImage(null)} 
        />
      )}
    </div>
  );
}
