'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { STATUS_MAP, STATUS_OPTIONS, DELIVERY_LABELS, PAYMENT_LABELS, getAuthHeaders, formatDateShort, formatMoney } from '../../../../lib/admin-constants';
import { getOptimizedUrl } from '../../../../lib/image-utils';
import StatusBadge from '../../../../components/admin/ui/StatusBadge';
import { ArrowLeft, User, MapPin, CreditCard, Truck, Package, RefreshCw, Check, ShoppingBag, Mail, Phone, FileText, TrendingUp, ExternalLink, X, ZoomIn, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import AddProductModal from '../../../../components/admin/orders/AddProductModal';
import { AddBundleItemModal } from '../../../../components/admin/products/QuickSaleModal';

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

function ConfirmModal({ title, onConfirm, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const content = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999997, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.4)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 10, background: 'white', borderRadius: '20px', padding: '28px 24px 24px', maxWidth: '340px', width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.15)', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917', marginBottom: '22px', lineHeight: 1.4 }}>{title}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 500, color: '#78716c', background: '#f5f5f4', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e7e5e4'}
            onMouseLeave={e => e.currentTarget.style.background = '#f5f5f4'}
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 700, color: 'white', background: '#1c1917', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#292524'}
            onMouseLeave={e => e.currentTarget.style.background = '#1c1917'}
          >
            Підтвердити
          </button>
        </div>
      </div>
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
  const [editingQtyIndex, setEditingQtyIndex] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [activeBundleModalIndex, setActiveBundleModalIndex] = useState(null);

  async function handleAddBundleItemToOrder(itemIndex, product, size = null) {
    const targetItem = order.items[itemIndex];
    if (!targetItem) return;

    const costPrice = (size && product.sizes?.find(s => s.name === size)?.cost_price)
      || product.cost_price || 0;

    const bundleItem = {
      product_id: product.id,
      name: product.name,
      sku: product.sku || null,
      size: size || null,
      quantity: 1,
      cost_price: costPrice,
      image_url: product.image_url || '',
    };

    const updatedBundleItems = [...(targetItem.bundle_items || []), bundleItem];
    const newItems = [...order.items];
    newItems[itemIndex] = {
      ...targetItem,
      is_bundle: true,
      bundle_items: updatedBundleItems
    };

    const { error } = await supabase
      .from('orders')
      .update({ items: newItems })
      .eq('id', id);

    if (error) {
      toast.error('Помилка оновлення складових');
    } else {
      setOrder(prev => ({ ...prev, items: newItems }));
      toast.success('Складову додано до боксу');
    }
  }

  async function handleRemoveBundleItemFromOrder(itemIndex, biIndex) {
    const targetItem = order.items[itemIndex];
    if (!targetItem || !targetItem.bundle_items) return;

    const updatedBundleItems = targetItem.bundle_items.filter((_, i) => i !== biIndex);

    const newItems = [...order.items];
    newItems[itemIndex] = {
      ...targetItem,
      bundle_items: updatedBundleItems
    };

    const { error } = await supabase
      .from('orders')
      .update({ items: newItems })
      .eq('id', id);

    if (error) {
      toast.error('Помилка оновлення складових');
    } else {
      setOrder(prev => ({ ...prev, items: newItems }));
      toast.success('Складову видалено з боксу');
    }
  }

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

  function promptStatusChange(newStatus) {
    const label = STATUS_MAP[newStatus]?.label || newStatus;
    setConfirmModal({ 
      title: `Змінити статус на «${label}»?`, 
      action: () => handleStatusChange(newStatus) 
    });
  }

  function promptDeleteOrder() {
    setConfirmModal({
      title: 'Ви впевнені, що хочете остаточно видалити це замовлення? Цю дію неможливо скасувати.',
      action: () => handleDeleteOrder()
    });
  }

  async function handleDeleteOrder() {
    setConfirmModal(null);
    setUpdating(true);
    
    try {
      const res = await fetch(`/api/admin/orders/delete?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Помилка при видаленні замовлення');
      }
      
      toast.success('Замовлення видалено');
      router.push('/admin/orders');
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error('Помилка при видаленні: ' + error.message);
      setUpdating(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setConfirmModal(null);
    setUpdating(true);

    let orderUpdatePayload = { status: newStatus };

    if (newStatus === 'new' && order.status !== 'new' && order.status !== 'cancelled') {
      try {
        const res = await fetch('/api/admin/orders/restore-stock', {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify({ items: order.items })
        });
        
        if (!res.ok) {
          throw new Error('Failed to restore stock');
        }
        
        // Скидаємо прапорець, щоб при наступному переведенні в 'paid' 
        // тригер бази даних знову зміг списати залишки
        orderUpdatePayload.is_stock_deducted = false;
        
        toast.success('Товари повернуто на склад');
      } catch (err) {
        console.error('Помилка при поверненні товарів:', err);
        toast.error('Не вдалося повністю повернути товари на склад');
      }
    }

    await supabase.from('orders').update(orderUpdatePayload).eq('id', id);
    setOrder(prev => ({ ...prev, ...orderUpdatePayload }));

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

  async function handleDeleteItem(index) {
    setUpdating(true);
    const newItems = order.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * (item.qty || item.quantity || 1)), 0);
    const { error } = await supabase
      .from('orders')
      .update({ items: newItems, total: newTotal })
      .eq('id', id);
    if (error) {
      toast.error('Помилка при видаленні товару');
    } else {
      setOrder(prev => ({ ...prev, items: newItems, total: newTotal }));
      toast.success('Товар видалено з замовлення');
    }
    setUpdating(false);
  }

  async function handleSaveQty(index) {
    const qty = Math.max(1, parseInt(editQty) || 1);
    setUpdating(true);
    const newItems = [...order.items];
    newItems[index] = { ...newItems[index], qty, quantity: qty };
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * (item.qty || item.quantity || 1)), 0);
    const { error } = await supabase
      .from('orders')
      .update({ items: newItems, total: newTotal })
      .eq('id', id);
    if (error) {
      toast.error('Помилка при збереженні кількості');
    } else {
      setOrder(prev => ({ ...prev, items: newItems, total: newTotal }));
      setEditingQtyIndex(null);
      toast.success('Кількість оновлено');
    }
    setUpdating(false);
  }

  async function handleAddProduct(newItem) {
    setUpdating(true);
    const newItems = [...(order.items || []), newItem];
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * (item.qty || item.quantity || 1)), 0);
    const { error } = await supabase
      .from('orders')
      .update({ items: newItems, total: newTotal })
      .eq('id', id);
    if (error) {
      toast.error('Помилка при додаванні товару');
    } else {
      setOrder(prev => ({ ...prev, items: newItems, total: newTotal }));
      setShowAddProduct(false);
      toast.success('Товар додано до замовлення');
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ height: '36px', width: '240px', background: '#f0efed', borderRadius: '10px' }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2" style={{ height: '400px', background: '#f0efed', borderRadius: '16px' }} />
          <div style={{ height: '300px', background: '#f0efed', borderRadius: '16px' }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/admin/orders"
          style={{
            padding: '10px',
            color: '#78716c',
            background: 'white',
            border: '1.5px solid #e7e5e4',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
          className="hover:bg-stone-50 hover:border-stone-400"
        >
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1c1917', margin: 0, letterSpacing: '-0.03em' }}>
              Замовлення #{order.order_number}
            </h1>
            <StatusBadge status={order.status} size="md" />
          </div>
          <p style={{ fontSize: '13px', color: '#78716c', margin: '4px 0 0', fontWeight: 400 }}>{dateStr}, {timeStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left column — items */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Products SectionCard */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(231,229,228,0.8)',
            boxShadow: '0 2px 12px rgba(28,25,23,0.04), 0 1px 3px rgba(28,25,23,0.03)',
            overflow: 'hidden'
          }}>
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
                <Package size={20} color="#16a34a" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: 0, letterSpacing: '-0.02em' }}>
                  Товари ({items.length})
                </h2>
                <p style={{ fontSize: '13px', color: '#a8a29e', margin: '3px 0 0', fontWeight: 400 }}>
                  Список товарів та розрахунок вартості
                </p>
              </div>
            </div>

            <div style={{ divideWidth: '1px', divideColor: '#f5f5f4' }}>
              {items.map((item, i) => {
                const prodId = item.product_id || item.id;
                return (
                  <div 
                    key={i} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '18px 28px',
                      borderBottom: '1px solid #f5f5f4',
                      transition: 'background 0.15s'
                    }}
                    className="hover:bg-stone-50/60 group"
                  >
                    <div 
                      style={{
                        position: 'relative',
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        background: '#f5f5f4',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid #e7e5e4',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (item.image_url) setZoomedImage(item.image_url);
                      }}
                    >
                      {item.image_url ? (
                        <>
                          <Image src={item.image_url} alt={item.name} fill sizes="48px" className="object-cover transition-transform duration-300 group-hover:scale-110" />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
                            <ZoomIn size={16} color="white" />
                          </div>
                        </>
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="#a8a29e" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/admin/products/${prodId}`} style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hover:text-emerald-600 transition-colors">
                        {item.name}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                        {item.size && <span style={{ fontSize: '12px', color: '#78716c', fontWeight: 500 }}>Розмір: {item.size}</span>}
                        {item.sku && <span style={{ fontSize: '12px', color: '#78716c', fontWeight: 500, fontFamily: 'monospace' }}>Арт: {item.sku}</span>}
                        {item.is_bundle && (
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#7c3aed', background: '#f3e8ff', border: '1px solid #e9d5ff', padding: '1px 8px', borderRadius: '999px' }}>БОКС</span>
                        )}
                      </div>
                      {/* Bundle items breakdown */}
                      {(item.is_bundle || (item.bundle_items && item.bundle_items.length > 0) || /бокс|набір/i.test(item.name)) && (
                        <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid #e9d5ff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>📦 Складові боксу:</p>
                            {order.status === 'new' && (
                              <button
                                type="button"
                                onClick={() => setActiveBundleModalIndex(i)}
                                style={{ fontSize: '10px', fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                                className="hover:bg-violet-100 transition-colors"
                              >
                                + Додати / Редагувати
                              </button>
                            )}
                          </div>
                          {item.bundle_items && item.bundle_items.length > 0 ? (
                            item.bundle_items.map((bi, biIdx) => (
                              <div key={biIdx} style={{ fontSize: '11px', color: '#57534e', fontWeight: 500, padding: '2px 0', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {bi.name}{bi.size ? ` (${bi.size})` : ''} {bi.sku ? <span style={{ color: '#a8a29e', fontFamily: 'monospace', fontSize: '10px' }}>• Арт: {bi.sku}</span> : ''}
                                  </span>
                                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>×{bi.quantity || 1}</span>
                                </div>
                                {order.status === 'new' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBundleItemFromOrder(i, biIdx)}
                                    style={{ background: 'none', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}
                                    className="hover:text-red-500 hover:bg-red-50"
                                    title="Видалити складову з замовлення"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p style={{ fontSize: '11px', color: '#a8a29e', fontStyle: 'italic', margin: '2px 0' }}>Складові ще не вказано</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(item.price * (item.qty || item.quantity || 1))} ₴
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginTop: '4px' }}>
                        {order.status === 'new' ? (
                          editingQtyIndex === i ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#a8a29e' }}>×</span>
                              <input
                                type="number"
                                min="1"
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveQty(i)}
                                style={{
                                  width: '48px',
                                  textAlign: 'center',
                                  padding: '2px 6px',
                                  background: 'white',
                                  border: '1.5px solid #e7e5e4',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  outline: 'none'
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveQty(i)}
                                disabled={updating}
                                style={{ width: '20px', height: '20px', background: '#10b981', color: 'white', borderRadius: '999px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <Check size={10} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{ fontSize: '12px', color: '#78716c', fontWeight: 600, cursor: 'pointer' }}
                              className="hover:text-emerald-600 transition-colors"
                              onClick={() => { setEditingQtyIndex(i); setEditingItemIndex(null); setEditQty(String(item.qty || item.quantity || 1)); }}
                              title="Натисніть, щоб змінити кількість"
                            >
                              × {item.qty || item.quantity || 1}
                            </div>
                          )
                        ) : (
                          <p style={{ fontSize: '12px', color: '#78716c', fontWeight: 600, margin: 0 }}>× {item.qty || item.quantity || 1}</p>
                        )}
                        {editingItemIndex === i ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <input
                              type="number"
                              min="0"
                              value={editItemCost}
                              onChange={(e) => setEditItemCost(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveItemCost(i)}
                              style={{
                                width: '64px',
                                textAlign: 'right',
                                padding: '2px 6px',
                                background: 'white',
                                border: '1.5px solid #e7e5e4',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                outline: 'none'
                              }}
                              autoFocus
                            />
                            <span style={{ fontSize: '12px', color: '#78716c' }}>₴</span>
                            <button
                              onClick={() => handleSaveItemCost(i)}
                              disabled={updating}
                              style={{ width: '20px', height: '20px', background: '#10b981', color: 'white', borderRadius: '999px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Check size={10} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <div 
                            style={{
                              background: '#f5f5f4',
                              color: '#57534e',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '1px solid transparent',
                              transition: 'all 0.15s'
                            }}
                            className="hover:bg-stone-200 hover:text-stone-800"
                            onClick={() => {
                              setEditingItemIndex(i);
                              setEditingQtyIndex(null);
                              setEditItemCost(String(calculateItemCost(item)));
                            }}
                            title="Натисніть, щоб змінити собівартість для цього замовлення"
                          >
                            закупка: {formatMoney(calculateItemCost(item))} ₴
                          </div>
                        )}
                      </div>
                    </div>
                    {order.status === 'new' && (
                      <button
                        onClick={() => handleDeleteItem(i)}
                        disabled={updating}
                        style={{ padding: '6px', color: '#d6d3d1', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}
                        className="hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Видалити товар із замовлення"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {order.status === 'new' && (
              <div style={{ padding: '16px 28px', borderTop: '1px solid #f5f5f4' }}>
                <button
                  onClick={() => setShowAddProduct(true)}
                  disabled={updating}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#44403c',
                    background: '#fafaf9',
                    border: '2px dashed #e7e5e4',
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  className="hover:bg-stone-100 hover:border-stone-400 hover:text-stone-900"
                >
                  <Plus size={16} />
                  Додати товар
                </button>
              </div>
            )}
            
            {/* Фінансова статистика замовлення */}
            <div style={{ padding: '24px 28px', borderTop: '1px solid #f0efed', background: '#fafaf9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Сума товарів */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 700, color: '#44403c' }}>
                <span>Загалом по товарах</span>
                <span style={{ color: '#1c1917', fontWeight: 900, fontSize: '20px', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(order.total)} ₴</span>
              </div>

              {/* Ручні витрати на пакування */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 600, color: '#57534e' }}>
                <span>Вартість пакування</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    style={{
                      width: '88px',
                      textAlign: 'right',
                      padding: '6px 10px',
                      background: 'white',
                      border: '1.5px solid #e7e5e4',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#1c1917',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#a8a29e' }}>₴</span>
                  
                  {isPackagingChanged && (
                    <button
                      onClick={handlePackagingSave}
                      disabled={updating}
                      style={{ width: '24px', height: '24px', background: '#10b981', color: 'white', borderRadius: '999px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title="Зберегти пакування"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', background: '#e7e5e4', margin: '4px 0' }} />

              {/* Розрахункова собівартість */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '14px', fontWeight: 600, color: '#78716c' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Собівартість замовлення</span>
                  <span style={{ fontSize: '12px', fontWeight: 400, color: '#a8a29e', marginTop: '2px' }}>
                    (товари: {formatMoney(itemsTotalCost)} ₴ + пакування: {formatMoney(Number(packagingCost) || 0)} ₴)
                  </span>
                </div>
                <span style={{ color: '#1c1917', fontWeight: 700, fontSize: '16px', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(itemsTotalCost + (Number(packagingCost) || 0))} ₴
                </span>
              </div>

              {/* Чистий прибуток */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 20px', 
                background: '#f0fdf4', 
                borderRadius: '12px', 
                border: '1px solid #bbf7d0', 
                marginTop: '4px' 
              }}>
                <span style={{ fontSize: '16px', color: '#14532d', fontWeight: 700 }}>Чистий прибуток</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#16a34a" />
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', fontVariantNumeric: 'tabular-nums' }}>
                    +{formatMoney(Number(order.total || 0) - (itemsTotalCost + (Number(packagingCost) || 0)))} ₴
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{
              background: '#fffbeb',
              borderRadius: '16px',
              border: '1px solid rgba(251,191,36,0.3)',
              padding: '20px 28px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} color="#d97706" />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#92400e', margin: 0 }}>Коментар клієнта</h2>
              </div>
              <p style={{ fontSize: '14px', color: '#78350f', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>"{order.notes}"</p>
            </div>
          )}
        </div>

        {/* Right column — info */}
        <div className="space-y-[20px] lg:sticky lg:top-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status management SectionCard */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(231,229,228,0.8)',
            boxShadow: '0 2px 12px rgba(28,25,23,0.04), 0 1px 3px rgba(28,25,23,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '18px 24px',
              borderBottom: '1px solid #f5f5f4',
              background: 'linear-gradient(to bottom, #fafaf9, white)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShoppingBag size={18} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Статус та відправка</h2>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <select
                value={order.status}
                onChange={(e) => promptStatusChange(e.target.value)}
                disabled={updating}
                style={{
                  color: status.color,
                  backgroundColor: status.bg,
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: 700,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              {/* TTN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Номер ТТН
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {order.delivery_method === 'nova_poshta' && (
                    <img src="/footerlogos/NP-mini-icon.svg" alt="Нова Пошта" style={{ width: '24px', height: '24px', objectFit: 'contain', opacity: 0.9, flexShrink: 0 }} />
                  )}
                  {order.delivery_method === 'ukrposhta' && (
                    <img src="/footerlogos/Ukrposhta-mini-icon.svg" alt="Укрпошта" style={{ width: '24px', height: '24px', objectFit: 'contain', opacity: 0.9, flexShrink: 0 }} />
                  )}
                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      placeholder="Введіть номер ТТН"
                      value={ttn}
                      onChange={(e) => {
                        setTtn(e.target.value);
                        setIsTtnChanged(e.target.value !== (order.tracking_number || ''));
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && isTtnChanged && handleTtnSave()}
                      style={{
                        width: '100%',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        padding: '10px 36px 10px 14px',
                        background: '#fafaf9',
                        border: '1.5px solid #e7e5e4',
                        borderRadius: '10px',
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
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '24px',
                          height: '24px',
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
                        <Check size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                  {order.tracking_number && (
                    <button
                      onClick={handleSyncStatus}
                      disabled={updating}
                      style={{
                        padding: '10px',
                        color: '#78716c',
                        background: '#fafaf9',
                        border: '1.5px solid #e7e5e4',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      className={`hover:bg-stone-100 transition-all ${updating ? 'animate-spin opacity-50' : ''}`}
                      title="Синхронізація з поштою"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Чек (посилання) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f5f5f4' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Чек (посилання)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      placeholder="Введіть посилання на чек"
                      value={fiscalReceiptUrl}
                      onChange={(e) => {
                        setFiscalReceiptUrl(e.target.value);
                        setIsReceiptUrlChanged(e.target.value !== (order.fiscal_receipt_url || ''));
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && isReceiptUrlChanged && handleReceiptUrlSave()}
                      style={{
                        width: '100%',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        padding: '10px 36px 10px 14px',
                        background: '#fafaf9',
                        border: '1.5px solid #e7e5e4',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#1c1917'
                      }}
                    />
                    {isReceiptUrlChanged && (
                      <button
                        onClick={handleReceiptUrlSave}
                        disabled={updating}
                        style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '24px',
                          height: '24px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '999px',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
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
                      style={{
                        padding: '10px',
                        color: '#78716c',
                        background: '#fafaf9',
                        border: '1.5px solid #e7e5e4',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                      }}
                      className="hover:bg-stone-100 transition-all shrink-0"
                      title="Переглянути чек у новій вкладці"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>

              {/* Видалення замовлення */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid #f5f5f4', display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={promptDeleteOrder}
                  disabled={updating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#dc2626',
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  className="hover:bg-red-100 hover:text-red-700 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  Видалити замовлення
                </button>
              </div>

            </div>
          </div>

          {/* Customer info SectionCard */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(231,229,228,0.8)',
            boxShadow: '0 2px 12px rgba(28,25,23,0.04), 0 1px 3px rgba(28,25,23,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '18px 24px',
              borderBottom: '1px solid #f5f5f4',
              background: 'linear-gradient(to bottom, #fafaf9, white)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} color="#3b82f6" />
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Дані клієнта</h2>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {order.full_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={16} color="#a8a29e" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>{order.full_name}</span>
                </div>
              )}
              {order.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={16} color="#a8a29e" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#44403c' }}>{order.phone}</span>
                </div>
              )}
              {order.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={16} color="#a8a29e" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#44403c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Payment SectionCard */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(231,229,228,0.8)',
            boxShadow: '0 2px 12px rgba(28,25,23,0.04), 0 1px 3px rgba(28,25,23,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '18px 24px',
              borderBottom: '1px solid #f5f5f4',
              background: 'linear-gradient(to bottom, #fafaf9, white)'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Truck size={18} color="#d97706" />
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Доставка та оплата</h2>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Truck size={16} color="#a8a29e" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: 0 }}>
                    {DELIVERY_LABELS[order.delivery_method] || order.delivery_method}
                  </p>
                  {order.address && <p style={{ fontSize: '13px', color: '#78716c', margin: '4px 0 0', lineHeight: 1.4 }}>{order.address}</p>}
                </div>
              </div>
              <div style={{ height: '1px', background: '#f5f5f4' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CreditCard size={16} color="#a8a29e" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>
                  {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                </span>
              </div>
            </div>
          </div>

          {/* Global Notes SectionCard */}
          <div style={{
            background: '#fffbeb',
            borderRadius: '16px',
            border: '1px solid rgba(251,191,36,0.3)',
            padding: '20px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileText size={16} color="#d97706" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#92400e', margin: 0 }}>Глобальний блокнот</h2>
            </div>
            <textarea
              style={{
                width: '100%',
                fontSize: '14px',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.8)',
                border: '1.5px solid rgba(251,191,36,0.4)',
                borderRadius: '10px',
                outline: 'none',
                resize: 'none',
                color: '#78350f',
                fontWeight: 500,
                fontFamily: 'Inter, system-ui, sans-serif',
                boxSizing: 'border-box'
              }}
              rows={5}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              onBlur={handleAdminNotesSave}
              placeholder="Замітки адміністраторів (зберігаються глобально)..."
            />
            {isNotesSaving && (
              <p style={{ fontSize: '12px', color: '#a8a29e', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={12} className="animate-spin" /> Збереження...
              </p>
            )}
          </div>
        </div>
      </div>
      
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          onConfirm={confirmModal.action}
          onClose={() => setConfirmModal(null)}
        />
      )}
      {showAddProduct && (
        <AddProductModal
          onAdd={handleAddProduct}
          onClose={() => setShowAddProduct(false)}
        />
      )}
      {zoomedImage && (
        <ImageZoom 
          src={zoomedImage} 
          alt="Збільшене фото" 
          onClose={() => setZoomedImage(null)} 
        />
      )}
      {activeBundleModalIndex !== null && order?.items?.[activeBundleModalIndex] && (
        <AddBundleItemModal
          item={order.items[activeBundleModalIndex]}
          onClose={() => setActiveBundleModalIndex(null)}
          onAddBundleItem={(cartItemId, product, size) => handleAddBundleItemToOrder(activeBundleModalIndex, product, size)}
          onRemoveBundleItem={(cartItemId, biIdx) => handleRemoveBundleItemFromOrder(activeBundleModalIndex, biIdx)}
        />
      )}
    </div>
  );
}
