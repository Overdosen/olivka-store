'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { STATUS_OPTIONS } from '../../../lib/admin-constants';
import { 
  X, ShoppingCart, Search, Trash2, Plus, Minus, 
  ChevronRight, AlertCircle, ShoppingBag, Store, 
  User, Truck, CreditCard, Check, ArrowRight, FileText, ChevronDown, ZoomIn
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { getOptimizedUrl } from '../../../lib/image-utils';

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

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const KastaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 h-8" fill="currentColor">
    <text x="2" y="18" fontSize="14" fontWeight="800" fontFamily="Arial">K</text>
  </svg>
);

const PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: InstagramIcon,
    cardStyle: { background: 'linear-gradient(135deg, #fdf4ff, #fff1f2)', border: '2px solid #e879f9' },
    badgeStyle: { background: 'linear-gradient(135deg, #fdf4ff, #fff1f2)', borderColor: '#e879f9' },
    textStyle: { color: '#a21caf' },
  },
  {
    id: 'kasta',
    label: 'Kasta',
    icon: KastaIcon,
    cardStyle: { background: 'linear-gradient(135deg, #fff1f2, #fff7ed)', border: '2px solid #f87171' },
    badgeStyle: { background: 'linear-gradient(135deg, #fff1f2, #fff7ed)', borderColor: '#f87171' },
    textStyle: { color: '#b91c1c' },
  },
];

export default function QuickSaleModal({ product: initialProduct, onClose, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState(null);

  // Cart and Product selection state
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Selected product to add
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(initialProduct?.price || '');

  // Final Order details state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('nova_poshta');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [zoomedImage, setZoomedImage] = useState(null);

  // Bundle composition state (for bundle/box products)
  const [bundleSearchQuery, setBundleSearchQuery] = useState({}); // { [cartItemId]: string }
  const [bundleSearchResults, setBundleSearchResults] = useState({}); // { [cartItemId]: Product[] }
  const [bundleSearching, setBundleSearching] = useState({}); // { [cartItemId]: bool }
  const bundleSearchTimeoutRef = useRef({});

  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // If we have an initial product, pre-select it
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setSalePrice(initialProduct.price);
    }
  }, [initialProduct]);

  // Product Search handler
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, price, cost_price, sizes, stock, image_url, is_bundle')
          .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
          .limit(30);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Помилка пошуку товарів:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  const hasSizes = selectedProduct && Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0;

  const maxQty = selectedProduct
    ? (hasSizes && selectedSize
      ? (selectedProduct.sizes.find(s => s.name === selectedSize)?.quantity || 0)
      : (selectedProduct.stock || 0))
    : 0;

  // Change selected product from search
  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSalePrice(prod.price || '');
    setSelectedSize('');
    setQuantity(1);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Fetch default bundle components from product_components table
  const fetchDefaultBundleItems = async (cartItemId, productId) => {
    try {
      const { data } = await supabase
        .from('product_components')
        .select('component_id, size, products!component_id(id, name, sku, stock, sizes, price, cost_price, image_url)')
        .eq('bundle_id', productId);

      if (data && data.length > 0) {
        const bundleItems = data
          .map(row => row.products ? {
            product_id: row.products.id,
            name: row.products.name,
            sku: row.products.sku || null,
            size: row.size || null,
            quantity: 1,
            cost_price: row.products.cost_price || 0,
            image_url: row.products.image_url || '',
          } : null)
          .filter(Boolean);

        setCart(prev => prev.map(item =>
          item.id === cartItemId ? { ...item, bundle_items: bundleItems } : item
        ));
      }
    } catch (e) {
      console.error('[QuickSaleModal] fetchDefaultBundleItems:', e);
    }
  };

  // Bundle component search
  const handleBundleSearch = (cartItemId, query) => {
    setBundleSearchQuery(prev => ({ ...prev, [cartItemId]: query }));
    if (bundleSearchTimeoutRef.current[cartItemId]) clearTimeout(bundleSearchTimeoutRef.current[cartItemId]);
    if (!query || query.trim().length < 2) {
      setBundleSearchResults(prev => ({ ...prev, [cartItemId]: [] }));
      return;
    }
    setBundleSearching(prev => ({ ...prev, [cartItemId]: true }));
    bundleSearchTimeoutRef.current[cartItemId] = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, sku, stock, sizes, cost_price, image_url')
          .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
          .limit(20);
        setBundleSearchResults(prev => ({ ...prev, [cartItemId]: data || [] }));
      } catch (e) {
        console.error('[bundle search]', e);
      } finally {
        setBundleSearching(prev => ({ ...prev, [cartItemId]: false }));
      }
    }, 300);
  };

  const handleAddBundleItem = (cartItemId, product, size = null) => {
    const costPrice = (size && product.sizes?.find(s => s.name === size)?.cost_price) || product.cost_price || 0;
    const bundleItem = {
      product_id: product.id,
      name: product.name,
      sku: product.sku || null,
      size: size || null,
      quantity: 1,
      cost_price: costPrice,
      image_url: product.image_url || '',
    };
    setCart(prev => prev.map(item =>
      item.id === cartItemId
        ? { ...item, bundle_items: [...(item.bundle_items || []), bundleItem] }
        : item
    ));
    setBundleSearchResults(prev => ({ ...prev, [cartItemId]: [] }));
    setBundleSearchQuery(prev => ({ ...prev, [cartItemId]: '' }));
  };

  const handleRemoveBundleItem = (cartItemId, idx) => {
    setCart(prev => prev.map(item =>
      item.id === cartItemId
        ? { ...item, bundle_items: (item.bundle_items || []).filter((_, i) => i !== idx) }
        : item
    ));
  };

  const handleBundleItemQty = (cartItemId, idx, delta) => {
    setCart(prev => prev.map(item =>
      item.id === cartItemId
        ? {
            ...item,
            bundle_items: (item.bundle_items || []).map((bi, i) =>
              i === idx ? { ...bi, quantity: Math.max(1, (bi.quantity || 1) + delta) } : bi
            )
          }
        : item
    ));
  };

  // Add to sandbox cart
  const handleAddToCart = () => {
    if (!selectedProduct) return toast.error('Оберіть товар');
    if (hasSizes && !selectedSize) return toast.error('Оберіть розмір');
    if (quantity < 1) return toast.error('Вкажіть кількість більше 0');
    if (quantity > maxQty) return toast.error(`Недостатньо на складі (є лише ${maxQty} шт)`);

    const currentCostPrice = (hasSizes && selectedSize
      ? selectedProduct.sizes.find(s => s.name === selectedSize)?.cost_price
      : null) || selectedProduct.cost_price || 0;

    const cartItem = {
      id: `${selectedProduct.id}-${selectedSize || 'nosize'}`,
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      sku: selectedProduct.sku || null,
      price: parseFloat(salePrice) || selectedProduct.price || 0,
      cost_price: parseFloat(currentCostPrice) || 0,
      quantity: quantity,
      qty: quantity,
      size: selectedSize || null,
      image_url: selectedProduct.image_url || '',
      is_bundle: Boolean(selectedProduct.is_bundle || /бокс|набір/i.test(selectedProduct.name)),
      show_bundle_ui: Boolean(selectedProduct.is_bundle || /бокс|набір/i.test(selectedProduct.name)),
      bundle_items: [],
    };

    setCart(prev => {
      // Check if item already exists in cart, then update quantity
      const existingIdx = prev.findIndex(item => item.id === cartItem.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        if (newQty > maxQty) {
          toast.error(`Не можна додати більше ніж є на складі (макс ${maxQty} шт)`);
          return prev;
        }
        updated[existingIdx].quantity = newQty;
        updated[existingIdx].qty = newQty;
        return updated;
      }
      return [...prev, cartItem];
    });

    toast.success('Додано в кошик!');

    // If bundle product — fetch pre-defined default components
    if (selectedProduct.is_bundle) {
      fetchDefaultBundleItems(cartItem.id, selectedProduct.id);
    }

    // Reset selected product state so admin can search again
    setSelectedProduct(null);
    setSelectedSize('');
    setQuantity(1);
    setSalePrice('');
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success('Видалено з кошика');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (!platform) return toast.error('Оберіть платформу');
    if (cart.length === 0) return toast.error('Кошик порожній');
    if (!buyerName.trim()) return toast.error("Вкажіть ім'я покупця");

    setSaving(true);
    try {
      // 1. Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          status: orderStatus,
          total: cartTotal,
          items: cart,
          full_name: buyerName.trim(),
          phone: buyerPhone.trim() || null,
          email: null,
          address: null,
          tracking_number: trackingNumber.trim() || null,
          delivery_method: deliveryMethod,
          payment_method: 'cash_on_delivery',
          notes: notes.trim() || null,
          marketplace_platform: platform,
          shipping_email_sent: true, // Avoid triggering automatic transactional emails
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert records into marketplace_sales for each item
      const salesPayload = cart.map(item => ({
        product_id: item.product_id,
        order_id: orderData.id,
        platform,
        quantity: item.quantity,
        size_name: item.size,
        sale_price: item.price,
        buyer_name: buyerName.trim(),
        notes: notes.trim() || null,
      }));

      const { data: salesData, error: salesError } = await supabase
        .from('marketplace_sales')
        .insert(salesPayload)
        .select();

      if (salesError) throw salesError;

      // 3. Connect the order to the first marketplace sale record for schema consistency
      if (salesData && salesData.length > 0) {
        await supabase
          .from('orders')
          .update({ marketplace_sale_id: salesData[0].id })
          .eq('id', orderData.id);
      }

      // 4. Deduct stock for bundle component items (box/набір)
      const allBundleItems = cart.flatMap(item =>
        item.is_bundle && item.bundle_items && item.bundle_items.length > 0
          ? item.bundle_items.map(bi => ({
              ...bi,
              quantity: (bi.quantity || 1) * (item.quantity || 1),
            }))
          : []
      );
      if (allBundleItems.length > 0) {
        await fetch('/api/admin/orders/deduct-bundle-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: allBundleItems }),
        });
      }

      toast.success(`Замовлення #${orderData.order_number} успішно сформовано!`, { duration: 4500 });
      onSuccess();
    } catch (err) {
      toast.error('Помилка формування замовлення: ' + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 900, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px', 
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif" 
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div
        className="w-full flex flex-col bg-white border border-stone-200/50 shadow-2xl relative z-10 transition-all duration-300"
        style={{ 
          borderRadius: '24px', 
          maxWidth: step === 2 ? '840px' : '480px', 
          maxHeight: '90vh',
          height: step === 2 ? '85vh' : 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{ 
            padding: '20px 24px', 
            borderBottom: '1px solid rgba(120, 113, 108, 0.12)' 
          }}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-stone-100 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-stone-850" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-850 tracking-tight leading-none">
                Ручне оформлення замовлення
              </h2>
              <p className="text-xs text-stone-400 font-medium mt-1.5">
                {step === 1 ? 'Оберіть джерело замовлення' : step === 2 ? 'Наповнення кошика замовлення' : 'Завершення оформлення'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-full transition duration-150 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content Body */}
        <div className="flex-1 h-0 overflow-y-auto custom-scrollbar">
          
          {/* STEP 1: SELECT PLATFORM */}
          {step === 1 && (
            <div className="space-y-6" style={{ padding: '32px 28px' }}>
              <p className="text-xs font-bold text-stone-500 text-center uppercase tracking-wider">
                Платформа продажу
              </p>
              <div className="grid grid-cols-2 gap-5">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPlatform(p.id); setStep(2); }}
                    style={{ 
                      ...p.cardStyle,
                      padding: '32px 24px',
                      borderRadius: '20px'
                    }}
                    className="flex flex-col items-center justify-center gap-3.5 transition duration-200 border shadow-sm active:scale-[0.96] hover:shadow-md cursor-pointer"
                  >
                    <div className="transform scale-110"><p.icon /></div>
                    <span className="text-sm sm:text-base font-extrabold" style={{ color: p.textStyle.color }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SANDBOX CART FILLING */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0" style={{ padding: '24px' }}>
              
              {/* Product Selector Column */}
              <div className="md:col-span-7 flex flex-col gap-4.5 min-h-0">
                {/* Platform Badge Row */}
                {(() => {
                  const pl = PLATFORMS.find(p => p.id === platform);
                  return (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50">
                      <div className="flex items-center gap-2.5">
                        <div style={pl?.textStyle}>{pl && <pl.icon />}</div>
                        <span className="text-xs sm:text-sm font-extrabold" style={pl?.textStyle}>{pl?.label}</span>
                      </div>
                      <button 
                        onClick={() => { setStep(1); setSelectedProduct(null); }} 
                        className="text-xs font-bold text-stone-400 hover:text-stone-850 hover:underline transition"
                      >
                        змінити
                      </button>
                    </div>
                  );
                })()}

                {/* Global Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Пошук товару по назві або артикулу..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-13 pr-10 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800/10 focus:border-stone-800 transition font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar">
                      {searchResults.map(prod => (
                        <div
                          key={prod.id}
                          className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0 flex items-center gap-3.5 transition"
                        >
                          {prod.image_url ? (
                            <div 
                              className="relative w-9 h-9 rounded-lg bg-stone-100 border border-stone-200/50 flex-shrink-0 overflow-hidden cursor-pointer group"
                              onClick={(e) => { e.stopPropagation(); setZoomedImage({ src: prod.image_url.startsWith('http') ? prod.image_url : `/images/${prod.image_url}`, alt: prod.name }); }}
                              title="Збільшити фото"
                            >
                              <Image 
                                src={prod.image_url.startsWith('http') ? prod.image_url : `/images/${prod.image_url}`} 
                                alt={prod.name} 
                                fill sizes="36px"
                                className="object-cover transition-transform duration-200 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-150 opacity-0 group-hover:opacity-100">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 border border-stone-200/50">
                              <ShoppingBag className="w-4 h-4 text-stone-400" />
                            </div>
                          )}
                          <div 
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleSelectProduct(prod)}
                          >
                            <p className="text-xs font-bold text-stone-850 truncate leading-tight hover:underline">{prod.name}</p>
                            <p className="text-[10px] text-stone-400 font-bold mt-1">Арт: {prod.sku || '—'} • Ціна: {prod.price} ₴</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold animate-pulse">
                      шукаємо...
                    </div>
                  )}
                </div>

                {/* Selected Product Form */}
                {selectedProduct ? (
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {selectedProduct.image_url ? (
                          <div className="relative w-14 h-14 rounded-xl bg-stone-100 border border-stone-200/50 shadow-sm overflow-hidden flex-shrink-0">
                            <Image 
                              src={selectedProduct.image_url.startsWith('http') ? selectedProduct.image_url : `/images/${selectedProduct.image_url}`} 
                              alt={selectedProduct.name} 
                              fill sizes="56px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-stone-200 flex items-center justify-center border border-stone-200">
                            <ShoppingBag className="w-7 h-7 text-stone-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs sm:text-sm font-extrabold text-stone-850 leading-snug line-clamp-2">{selectedProduct.name}</p>
                          <p className="text-[10px] sm:text-xs text-stone-400 font-bold mt-1.5">
                            Артикул: {selectedProduct.sku || '—'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedProduct(null)} 
                        className="text-stone-400 hover:text-stone-700 p-1.5 bg-white rounded-full border border-stone-200 shadow-sm flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Sizes Selection */}
                    {hasSizes && (
                      <div>
                        <label className="block text-[11px] font-extrabold text-stone-400 uppercase tracking-wider mb-2.5">
                          Оберіть Розмір *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sizes.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(size => {
                            const isSelected = selectedSize === size.name;
                            const isDisabled = size.quantity <= 0;
                            return (
                              <button
                                key={size.name}
                                type="button"
                                onClick={() => { setSelectedSize(size.name); setQuantity(1); }}
                                disabled={isDisabled}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${
                                  isDisabled 
                                    ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                                    : isSelected 
                                      ? 'bg-stone-850 text-white border-stone-850 shadow-sm' 
                                      : 'bg-white text-stone-750 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                                }`}
                              >
                                {size.name} <span className={`text-[10px] ml-1.5 ${isSelected ? 'text-white/70' : 'text-stone-400'}`}>({size.quantity})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Qty and Custom Price Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Quantity Selector */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-stone-400 uppercase tracking-wider mb-2.5">
                          Кількість {maxQty > 0 && <span className="text-stone-400/80 normal-case font-bold">(макс: {maxQty})</span>}
                        </label>
                        <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl p-1.5 w-full justify-between">
                          <button
                            type="button"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded-lg bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={quantity}
                            onChange={e => setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-10 text-center border-0 focus:ring-0 p-0 text-sm font-extrabold text-stone-850"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                            className="w-8 h-8 rounded-lg bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Custom Sale Price */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-stone-400 uppercase tracking-wider mb-2.5">
                          Ціна продажу (₴)
                        </label>
                        <input
                          type="number"
                          value={salePrice}
                          onChange={e => setSalePrice(e.target.value)}
                          placeholder={selectedProduct.price}
                          className="w-full px-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800/10 focus:border-stone-800 transition font-extrabold text-stone-850"
                        />
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={hasSizes && !selectedSize}
                      className="w-full py-3.5 bg-stone-850 hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 shadow transition disabled:opacity-50 active:scale-[0.98]"
                    >
                      <ShoppingCart className="w-4.5 h-4.5" />
                      Додати до кошика
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-stone-400 min-h-[180px] bg-stone-50/20">
                    <Search className="w-10 h-10 text-stone-300 mb-3" />
                    <p className="text-xs sm:text-sm font-bold text-stone-700">Знайдіть та оберіть товар у пошуку вище</p>
                    <p className="text-[11px] text-stone-400 font-medium mt-1">щоб додати його до кошика ручного замовлення</p>
                  </div>
                )}
              </div>

              {/* Cart Sandbox Column */}
              <div className="md:col-span-5 flex flex-col bg-stone-50 border border-stone-200/60 rounded-2xl min-h-0 h-full" style={{ padding: '20px' }}>
                <div className="flex items-center justify-between border-b border-stone-200/60 pb-3.5 mb-3.5 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-5 h-5 text-stone-800" />
                    <span className="text-xs sm:text-sm font-extrabold text-stone-850">Кошик замовлення</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-stone-200 text-stone-750">
                    {cart.length} поз.
                  </span>
                </div>

                {/* Cart Items list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center p-6 bg-white/40 border border-dashed border-stone-200 rounded-xl">
                      <ShoppingBag className="w-12 h-12 text-stone-300 mb-3" />
                      <p className="text-xs font-bold text-stone-600">Кошик порожній</p>
                      <p className="text-[10px] text-stone-400 font-medium mt-1">Додайте товари зліва</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div
                        key={item.id}
                        className="bg-white border border-stone-200/60 rounded-xl shadow-sm hover:shadow transition flex flex-col"
                      >
                        {/* Main item row */}
                        <div className="flex items-center justify-between gap-3" style={{ padding: '14px 16px' }}>
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image_url ? (
                              <div className="relative w-12 h-12 rounded-lg bg-stone-50 border border-stone-100 flex-shrink-0 shadow-sm overflow-hidden">
                                <Image
                                  src={item.image_url.startsWith('http') ? item.image_url : `/images/${item.image_url}`}
                                  alt={item.name}
                                  fill sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-6 h-6 text-stone-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-extrabold text-stone-850 truncate leading-snug">{item.name}</p>
                                {(item.is_bundle || item.show_bundle_ui) && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full border border-violet-200 flex-shrink-0">БОКС</span>
                                )}
                              </div>
                              <p className="text-[10px] text-stone-450 font-bold mt-0.5">
                                {item.size ? `Розмір: ${item.size} • ` : ''}{item.quantity} шт
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[11px] text-stone-850 font-extrabold tabular-nums">
                                  {item.price} ₴
                                </p>
                                {!item.show_bundle_ui && (
                                  <button
                                    type="button"
                                    onClick={() => setCart(prev => prev.map(c => c.id === item.id ? { ...c, show_bundle_ui: true, is_bundle: true } : c))}
                                    className="text-[10px] font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-0.5 rounded transition"
                                  >
                                    + Вказати складові (пелюшки/пледи)
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-2 text-stone-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {/* Bundle composition section */}
                        {(item.is_bundle || item.show_bundle_ui) && (
                          <div className="border-t border-violet-100 mx-3 mb-3 pt-3 space-y-2">
                            <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
                              <span>📦</span> Складові боксу
                              <span className="ml-auto text-violet-400 font-bold normal-case tracking-normal">
                                {(item.bundle_items || []).length} шт.
                              </span>
                            </p>

                            {/* Added bundle items */}
                            {(item.bundle_items || []).length > 0 && (
                              <div className="space-y-1.5">
                                {(item.bundle_items || []).map((bi, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1.5">
                                    <span className="text-[11px] font-bold text-violet-800 truncate flex-1 min-w-0">
                                      {bi.name}
                                      {bi.size && <span className="ml-1 text-violet-500">({bi.size})</span>}
                                    </span>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleBundleItemQty(item.id, idx, -1)}
                                        className="w-5 h-5 rounded bg-white border border-violet-200 text-violet-600 text-xs font-black flex items-center justify-center hover:bg-violet-100 transition"
                                      >−</button>
                                      <span className="text-[11px] font-black text-violet-700 w-5 text-center">{bi.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleBundleItemQty(item.id, idx, 1)}
                                        className="w-5 h-5 rounded bg-white border border-violet-200 text-violet-600 text-xs font-black flex items-center justify-center hover:bg-violet-100 transition"
                                      >+</button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBundleItem(item.id, idx)}
                                      className="p-0.5 text-violet-300 hover:text-red-500 transition flex-shrink-0"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Bundle component search */}
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="+ Додати складову..."
                                value={bundleSearchQuery[item.id] || ''}
                                onChange={e => handleBundleSearch(item.id, e.target.value)}
                                className="w-full px-3 py-2 text-[11px] bg-violet-50 border border-violet-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 transition font-medium placeholder:text-violet-300"
                              />
                              {bundleSearching[item.id] && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-violet-400 animate-pulse font-bold">шукаємо...</span>
                              )}

                              {/* Bundle search results dropdown */}
                              {(bundleSearchResults[item.id] || []).length > 0 && (
                                <div 
                                  className="absolute left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar"
                                  style={{ background: '#ffffff', color: '#1c1917' }}
                                >
                                  {(bundleSearchResults[item.id] || []).map(prod => {
                                    const hasProdSizes = Array.isArray(prod.sizes) && prod.sizes.length > 0;
                                    const imgUrl = prod.image_url ? (prod.image_url.startsWith('http') ? prod.image_url : `/images/${prod.image_url}`) : null;
                                    return (
                                      <div key={prod.id} className="border-b border-stone-100 last:border-0 p-2 space-y-1 bg-white">
                                        {/* Product header */}
                                        <div className="flex items-center gap-2 px-2 py-1 bg-stone-50/70 rounded-lg">
                                          {imgUrl ? (
                                            <div className="relative w-6 h-6 rounded bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                                              <Image src={imgUrl} alt={prod.name} fill sizes="24px" className="object-cover" />
                                            </div>
                                          ) : (
                                            <div className="w-6 h-6 rounded bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400 text-[10px]">
                                              📦
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-stone-900 truncate leading-tight">{prod.name}</p>
                                            {prod.sku && <p className="text-[9px] text-stone-400 font-mono">Арт: {prod.sku}</p>}
                                          </div>
                                        </div>

                                        {/* Variants list (if sizes exist) */}
                                        {hasProdSizes ? (
                                          <div className="space-y-1 pl-1 pr-1 pt-0.5">
                                            {prod.sizes.map(s => {
                                              const qty = parseInt(s.quantity) || 0;
                                              const isDisabled = qty <= 0;
                                              return (
                                                <button
                                                  key={s.name}
                                                  type="button"
                                                  disabled={isDisabled}
                                                  onClick={() => handleAddBundleItem(item.id, prod, s.name)}
                                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between transition border ${
                                                    isDisabled
                                                      ? 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
                                                      : 'bg-white hover:bg-violet-50 text-stone-800 border-stone-200/80 hover:border-violet-300 cursor-pointer'
                                                  }`}
                                                >
                                                  <span className="font-semibold text-stone-850 truncate">{s.name}</span>
                                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                    qty > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-400 border border-red-100'
                                                  }`}>
                                                    {qty > 0 ? `${qty} шт` : '0 шт'}
                                                  </span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          /* Single product (no sizes) */
                                          <button
                                            type="button"
                                            disabled={prod.stock <= 0}
                                            onClick={() => handleAddBundleItem(item.id, prod)}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between transition border ${
                                              prod.stock <= 0
                                                ? 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
                                                : 'bg-white hover:bg-violet-50 text-stone-800 border-stone-200/80 hover:border-violet-300 cursor-pointer'
                                            }`}
                                          >
                                            <span className="font-semibold text-stone-850">Додати товар</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                              prod.stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-400 border border-red-100'
                                            }`}>
                                              {prod.stock > 0 ? `${prod.stock} шт` : '0 шт'}
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal row */}
                <div className="border-t border-stone-200/60 pt-4 mt-4 flex-shrink-0">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-xs sm:text-sm font-bold text-stone-500">Загальна сума:</span>
                    <span className="text-base sm:text-lg font-black text-stone-850 tabular-nums">{cartTotal} ₴</span>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow transition disabled:opacity-50 active:scale-[0.98]"
                  >
                    <span>Перейти до оформлення</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: ORDER COMPLETION AND METADATA */}
          {step === 3 && (
            <div className="p-6 flex flex-col gap-6 w-full">
              
              {/* Back to Cart link */}
              <button 
                onClick={() => setStep(2)} 
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-500 hover:text-stone-800 transition active:scale-[0.97] pb-1 w-fit cursor-pointer"
              >
                ← Повернутися до кошика
              </button>

              <div className="flex flex-col gap-6 w-full">
                
                {/* Client info card */}
                <div className="p-5 bg-white border border-stone-200/60 rounded-2xl shadow-sm flex flex-col gap-5 flex-shrink-0 w-full">
                  <div className="flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider text-stone-850 border-b border-stone-100 pb-3 mb-1">
                    <User className="w-4.5 h-4.5 text-stone-500" />
                    <span>Дані Клієнта</span>
                  </div>

                  {/* Buyer Name */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-2">
                      Ім'я покупця *
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      placeholder="ПІБ покупця"
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium transition focus:bg-white focus:border-stone-500 focus:ring-4 focus:ring-stone-500/10 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-2">
                      Телефон (опціонально)
                    </label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={e => setBuyerPhone(e.target.value)}
                      placeholder="+380..."
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium transition focus:bg-white focus:border-stone-500 focus:ring-4 focus:ring-stone-500/10 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Logistics and status card */}
                <div className="p-5 bg-white border border-stone-200/60 rounded-2xl shadow-sm flex flex-col gap-5 flex-shrink-0 w-full">
                  <div className="flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider text-stone-850 border-b border-stone-100 pb-3 mb-1">
                    <Truck className="w-4.5 h-4.5 text-stone-500" />
                    <span>Доставка та Оплата</span>
                  </div>

                  {/* Delivery Selection */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('nova_poshta')}
                      className={`flex items-center justify-center gap-2.5 py-3 px-4 border rounded-xl text-xs sm:text-sm font-black transition active:scale-[0.97] cursor-pointer ${
                        deliveryMethod === 'nova_poshta' 
                          ? 'bg-[#EE2722] border-[#EE2722] text-white shadow-lg shadow-[#EE2722]/15' 
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      {deliveryMethod === 'nova_poshta' ? <Check className="w-4.5 h-4.5 text-white" /> : <Truck className="w-4.5 h-4.5" />}
                      Нова Пошта
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('ukrposhta')}
                      className={`flex items-center justify-center gap-2.5 py-3 px-4 border rounded-xl text-xs sm:text-sm font-black transition active:scale-[0.97] cursor-pointer ${
                        deliveryMethod === 'ukrposhta' 
                          ? 'bg-[#FFC000] border-[#FFC000] text-stone-900 shadow-lg shadow-[#FFC000]/15' 
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      {deliveryMethod === 'ukrposhta' ? <Check className="w-4.5 h-4.5 text-stone-900" /> : <Truck className="w-4.5 h-4.5" />}
                      Укрпошта
                    </button>
                  </div>

                  {/* Tracking Number Input */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-2">
                      Номер ТТН (опціонально)
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="Внесіть номер ТТН..."
                      className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium transition focus:bg-white focus:border-stone-500 focus:ring-4 focus:ring-stone-500/10 focus:outline-none"
                    />
                  </div>

                  {/* Order / Payment Status select */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-2">
                      Статус замовлення
                    </label>
                    <div className="relative">
                      <select
                        value={orderStatus}
                        onChange={e => setOrderStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold cursor-pointer transition focus:bg-white focus:border-stone-500 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4.5 h-4.5 text-stone-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Order Notes / Comment Card */}
              <div className="p-5 bg-white border border-stone-200/60 rounded-2xl shadow-sm flex flex-col gap-5 flex-shrink-0 w-full">
                <div className="flex items-center gap-2.5 font-bold text-xs uppercase tracking-wider text-stone-850 border-b border-stone-100 pb-3 mb-1">
                  <FileText className="w-4.5 h-4.5 text-stone-500" />
                  <span>Коментар до замовлення</span>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-2">
                    Коментар для себе (опціонально)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Додаткова інформація про замовлення..."
                    className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium transition focus:bg-white focus:border-stone-500 focus:ring-4 focus:ring-stone-500/10 focus:outline-none"
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>

              {/* Order cart summary table preview */}
              <div className="p-5 bg-stone-50 border border-stone-200/80 rounded-2xl flex flex-col gap-4 flex-shrink-0 w-full">
                <p className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-wider mb-2">
                  Склад замовлення
                </p>
                <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm text-stone-600 pb-2.5 border-b border-stone-200/50 last:border-b-0">
                      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', maxWidth: '75%' }}>
                        <span style={{ fontWeight: 800, color: '#1c1917' }}>{item.name}</span>
                        {item.size && (
                          <span style={{ padding: '2px 6px', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', color: '#57534e', borderRadius: '4px', fontSize: '10px', fontWeight: 850 }}>
                            {item.variant_type === 'color' ? 'Колір' : 'Розмір'}: {item.size}
                          </span>
                        )}
                        {item.sku && (
                          <span style={{ padding: '2px 6px', backgroundColor: '#f5f5f4', border: '1px solid #e7e5e4', color: '#57534e', borderRadius: '4px', fontSize: '10px', fontWeight: 850 }}>
                            Артикул: {item.sku}
                          </span>
                        )}
                        <span style={{ color: '#a8a29e', fontWeight: 700 }}>x{item.quantity}</span>
                      </span>
                      <span style={{ fontWeight: 800, color: '#1c1917' }}>{item.price * item.quantity} ₴</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-stone-900 pt-3.5 border-t border-stone-200">
                  <span>Разом:</span>
                  <span style={{ fontSize: '18px', fontWeight: 900 }}>{cartTotal} ₴</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer buttons */}
        {step > 1 && (
          <div 
            className="flex gap-3 flex-shrink-0"
            style={{ 
              padding: '20px 24px', 
              borderTop: '1px solid rgba(120, 113, 108, 0.12)' 
            }}
          >
            {step === 2 ? (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 px-5 bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition hover:bg-stone-100 active:scale-[0.97]"
                >
                  Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={cart.length === 0}
                  className="flex-[2] py-3.5 px-5 bg-stone-850 hover:bg-stone-800 text-white border-none rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.97]"
                  style={cart.length === 0 ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                >
                  Оформити
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 px-5 bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition hover:bg-stone-100 active:scale-[0.97]"
                >
                  Назад
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-[2] py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-emerald-600/15 active:scale-[0.97]"
                >
                  {saving ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Створюємо...
                    </>
                  ) : (
                    <>
                      <Check className="w-4.5 h-4.5" />
                      Сформувати замовлення
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {zoomedImage && (
        <ImageZoom
          src={zoomedImage.src}
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
