'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Users, ShoppingBag, LayoutDashboard, FolderOpen, BarChart3, Settings, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

const QUICK_LINKS = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, section: 'Навігація' },
  { name: 'Замовлення', path: '/admin/orders', icon: ShoppingBag, section: 'Навігація' },
  { name: 'Клієнти', path: '/admin/customers', icon: Users, section: 'Навігація' },
  { name: 'Товари', path: '/admin/products', icon: Package, section: 'Навігація' },
  { name: 'Категорії', path: '/admin/categories', icon: FolderOpen, section: 'Навігація' },
  { name: 'Додати товар', path: '/admin/products/new', icon: Package, section: 'Дії' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  // Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchTerm = q.toLowerCase().trim();

    try {
      const [productsRes, ordersRes, profilesRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, sku, price, image_url')
          .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
          .limit(5),
        supabase
          .from('orders')
          .select('id, order_number, full_name, total, status, tracking_number')
          .or(`full_name.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%${!isNaN(searchTerm) ? `,order_number.eq.${searchTerm}` : ''}`)
          .limit(5),
        supabase
          .from('profiles')
          .select('id, full_name, email, phone_ua')
          .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_ua.ilike.%${searchTerm}%`)
          .limit(5),
      ]);

      const items = [];

      (productsRes.data || []).forEach(p => {
        items.push({
          id: p.id,
          name: p.name,
          subtitle: p.sku ? `Арт: ${p.sku} · ${p.price} ₴` : `${p.price} ₴`,
          icon: Package,
          path: `/admin/products/${p.id}`,
          section: 'Товари',
        });
      });

      (ordersRes.data || []).forEach(o => {
        items.push({
          id: o.id,
          name: `Замовлення #${o.order_number}`,
          subtitle: `${o.full_name || 'Гість'} · ${o.total} ₴`,
          icon: ShoppingBag,
          path: `/admin/orders/${o.id}`,
          section: 'Замовлення',
        });
      });

      (profilesRes.data || []).forEach(p => {
        items.push({
          id: p.id,
          name: p.full_name || p.email,
          subtitle: p.phone_ua || p.email,
          icon: Users,
          path: `/admin/customers`,
          section: 'Клієнти',
        });
      });

      setResults(items);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Command palette search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (item) => {
    setOpen(false);
    router.push(item.path);
  };

  const handleKeyDown = (e) => {
    const items = query.trim() ? results : QUICK_LINKS;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' && items.length > 0) {
      e.preventDefault();
      handleSelect(items[selectedIndex]);
    }
  };

  const displayItems = query.trim() ? results : QUICK_LINKS;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-stone-400 bg-stone-100/80 hover:bg-stone-200/80 rounded-lg border border-stone-200/60 transition-all"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Пошук по адмінці</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-stone-200/60 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-stone-100">
                <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Шукати товари, замовлення, клієнтів..."
                  className="w-full py-3.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none bg-transparent"
                />
                <button onClick={() => setOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-2">
                {loading && (
                  <div className="px-4 py-8 text-center text-sm text-stone-400 animate-pulse">
                    Пошук...
                  </div>
                )}
                {!loading && query.trim() && results.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-stone-400">
                    Нічого не знайдено
                  </div>
                )}
                {!loading && displayItems.length > 0 && (
                  <>
                    {!query.trim() && (
                      <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                        Швидкий доступ
                      </div>
                    )}
                    {displayItems.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path + (item.id || i)}
                          onClick={() => handleSelect(item)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            i === selectedIndex
                              ? 'bg-stone-900 text-white'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${i === selectedIndex ? 'text-stone-400' : 'text-stone-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {item.subtitle && (
                              <p className={`text-xs truncate ${i === selectedIndex ? 'text-stone-400' : 'text-stone-400'}`}>
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          {item.section && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                              i === selectedIndex
                                ? 'bg-stone-700 text-stone-300'
                                : 'bg-stone-100 text-stone-400'
                            }`}>
                              {item.section}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-stone-100 flex items-center gap-4 text-[10px] text-stone-400">
                <span><kbd className="font-mono px-1 py-0.5 bg-stone-100 rounded text-[10px]">↑↓</kbd> навігація</span>
                <span><kbd className="font-mono px-1 py-0.5 bg-stone-100 rounded text-[10px]">↵</kbd> відкрити</span>
                <span><kbd className="font-mono px-1 py-0.5 bg-stone-100 rounded text-[10px]">esc</kbd> закрити</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
