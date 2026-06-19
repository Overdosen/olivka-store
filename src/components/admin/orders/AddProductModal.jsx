'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import Image from 'next/image';
import { X, Search, Package, Plus, ChevronDown } from 'lucide-react';
import { formatMoney } from '../../../lib/admin-constants';

export default function AddProductModal({ onAdd, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, price, cost_price, stock, sizes, image_url, sku')
        .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(12);
      setResults(data || []);
      setSearching(false);
    }, 300);
  }, [query]);

  function selectProduct(product) {
    setSelectedProduct(product);
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    setSelectedSize(hasSizes ? (product.sizes[0]?.name || '') : '');
    setQty(1);
    setResults([]);
  }

  function getAvailableStock() {
    if (!selectedProduct) return 0;
    if (selectedSize && Array.isArray(selectedProduct.sizes)) {
      const sizeObj = selectedProduct.sizes.find(s => s.name === selectedSize);
      return sizeObj?.quantity ?? 0;
    }
    return selectedProduct.stock ?? 0;
  }

  function getCostPrice() {
    if (!selectedProduct) return 0;
    if (selectedSize && Array.isArray(selectedProduct.sizes)) {
      const sizeObj = selectedProduct.sizes.find(s => s.name === selectedSize);
      if (sizeObj?.cost_price != null) return sizeObj.cost_price;
    }
    return selectedProduct.cost_price || 0;
  }

  function handleAdd() {
    if (!selectedProduct) return;
    const newItem = {
      product_id: selectedProduct.id,
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      qty: qty,
      quantity: qty,
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(selectedProduct.image_url ? { image_url: selectedProduct.image_url } : {}),
      ...(selectedProduct.sku ? { sku: selectedProduct.sku } : {}),
      cost_price: getCostPrice(),
    };
    onAdd(newItem);
  }

  if (!mounted) return null;

  const hasSizes = selectedProduct && Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0;
  const availableStock = getAvailableStock();

  const content = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div style={{
        position: 'relative', zIndex: 10, background: 'white', borderRadius: '20px',
        width: '100%', maxWidth: '460px', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.2)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px', borderBottom: '1px solid #f5f5f4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917', margin: 0 }}>Додати товар</h2>
            <p style={{ fontSize: '11px', color: '#a8a29e', margin: '2px 0 0' }}>Знайдіть та оберіть товар для замовлення</p>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '7px', borderRadius: '8px', color: '#a8a29e', background: '#f5f5f4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e7e5e4'; e.currentTarget.style.color = '#57534e'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f4'; e.currentTarget.style.color = '#a8a29e'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Search */}
          {!selectedProduct && (
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a8a29e', pointerEvents: 'none' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Введіть назву товару..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '10px', paddingBottom: '10px',
                  fontSize: '13px', fontWeight: 500, border: '1px solid #e7e5e4', borderRadius: '10px',
                  outline: 'none', background: '#fafaf9', boxSizing: 'border-box', color: '#1c1917', transition: 'border-color 0.15s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#a8a29e'; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e7e5e4'; e.currentTarget.style.background = '#fafaf9'; }}
              />
            </div>
          )}

          {/* Search results */}
          {!selectedProduct && results.length > 0 && (
            <div style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden' }}>
              {results.map((product, i) => (
                <div
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                    cursor: 'pointer', borderTop: i > 0 ? '1px solid #f5f5f4' : 'none',
                    background: 'white', transition: 'background 0.12s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f5f5f4', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid #e7e5e4' }}>
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill sizes="38px" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={14} color="#a8a29e" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1c1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                      {product.name}
                      {product.sku && <span style={{ color: '#a8a29e', fontWeight: 400, marginLeft: '6px' }}>Арт: {product.sku}</span>}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>{formatMoney(product.price)} ₴</span>
                      <span style={{ fontSize: '11px', color: product.stock > 0 ? '#78716c' : '#ef4444' }}>
                        {Array.isArray(product.sizes) && product.sizes.length > 0
                          ? `${product.sizes.reduce((s, sz) => s + (sz.quantity || 0), 0)} шт. (розміри)`
                          : `${product.stock ?? 0} шт.`}
                      </span>
                    </div>
                  </div>
                  <Plus size={14} color="#d6d3d1" />
                </div>
              ))}
            </div>
          )}

          {/* States */}
          {!selectedProduct && searching && (
            <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', padding: '16px 0' }}>Пошук...</p>
          )}
          {!selectedProduct && !searching && query.trim().length > 0 && results.length === 0 && (
            <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', padding: '16px 0' }}>Нічого не знайдено по запиту «{query}»</p>
          )}
          {!selectedProduct && !query && (
            <p style={{ fontSize: '12px', color: '#d6d3d1', textAlign: 'center', padding: '8px 0' }}>Почніть вводити назву товару</p>
          )}

          {/* Selected product config */}
          {selectedProduct && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Product card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '1px solid #d1fae5', borderRadius: '12px', background: '#f0fdf4' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'white', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid #e7e5e4' }}>
                  {selectedProduct.image_url ? (
                    <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill sizes="46px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={16} color="#a8a29e" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedProduct.name}</p>
                  <p style={{ fontSize: '12px', color: '#059669', fontWeight: 600, margin: '3px 0 0' }}>{formatMoney(selectedProduct.price)} ₴</p>
                </div>
                <button
                  onClick={() => { setSelectedProduct(null); setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{ padding: '5px', color: '#a8a29e', background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', borderRadius: '6px', flexShrink: 0, display: 'flex' }}
                  title="Обрати інший товар"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Size selector */}
              {hasSizes && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '7px' }}>Розмір</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedSize}
                      onChange={e => setSelectedSize(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 36px 10px 12px', fontSize: '13px', fontWeight: 500,
                        border: '1px solid #e7e5e4', borderRadius: '10px', background: 'white', outline: 'none',
                        color: '#1c1917', appearance: 'none', cursor: 'pointer'
                      }}
                    >
                      {selectedProduct.sizes.map(s => (
                        <option key={s.name} value={s.name}>
                          {s.name}{selectedProduct.sku ? ` — Арт: ${selectedProduct.sku}` : ''} — залишок: {s.quantity ?? 0} шт.
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a8a29e', pointerEvents: 'none' }} />
                  </div>
                </div>
              )}

              {/* Stock info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fafaf9', borderRadius: '8px', border: '1px solid #e7e5e4' }}>
                <span style={{ fontSize: '12px', color: '#78716c', fontWeight: 500 }}>Доступно на складі</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: availableStock > 0 ? '#059669' : '#dc2626' }}>
                  {availableStock} шт.
                </span>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '7px' }}>Кількість</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e7e5e4', background: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534e', flexShrink: 0 }}
                  >−</button>
                  <input
                    type="number"
                    min="1"
                    max={availableStock}
                    value={qty}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setQty(Math.min(availableStock, Math.max(1, val)));
                    }}
                    style={{ width: '64px', padding: '8px', fontSize: '14px', fontWeight: 700, border: '1px solid #e7e5e4', borderRadius: '8px', background: 'white', outline: 'none', textAlign: 'center', color: '#1c1917' }}
                  />
                  <button
                    disabled={qty >= availableStock}
                    onClick={() => setQty(q => Math.min(availableStock, q + 1))}
                    style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e7e5e4', background: qty >= availableStock ? '#f5f5f4' : 'white', fontSize: '16px', cursor: qty >= availableStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: qty >= availableStock ? '#d6d3d1' : '#57534e', flexShrink: 0 }}
                  >+</button>
                  <span style={{ fontSize: '12px', color: '#a8a29e', marginLeft: '4px' }}>
                    = {formatMoney(selectedProduct.price * qty)} ₴
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedProduct && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f5f5f4', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 500, color: '#78716c', background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f4'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              Скасувати
            </button>
            <button
              onClick={handleAdd}
              style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 700, color: 'white', background: '#10b981', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#059669'}
              onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
            >
              <Plus size={14} />
              Додати товар
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
