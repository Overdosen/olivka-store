'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Menu, X, User, Search, Sparkles } from 'lucide-react';
import Image from 'next/image';
import bearImg from '../assets/teddy_bear.png';
import TextBorderAnimation from './TextBorderAnimation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';
import SmartSearchModal from './SmartSearchModal';

function AuthQueryHandler({ onOpen, onParams }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const login = searchParams.get('login');
    const email = searchParams.get('email');
    const password = searchParams.get('password') || searchParams.get('p');
    
    if (login === 'true') {
      onOpen();
    }
    if (email || password) {
      onParams({ email: email || '', password: password || '' });
    }
  }, [searchParams, onOpen, onParams]);

  return null;
}

export default function Header() {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiSearchEnabled, setAiSearchEnabled] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [authParams, setAuthParams] = useState({ email: '', password: '' });

  const handleOpenAuth = useCallback(() => {
    setIsAuthOpen(true);
  }, []);

  const handleAuthParams = useCallback((params) => {
    setAuthParams(params);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    setIsMounted(true);
    if (isMobileMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isMobileMenuOpen]);

  function handleUserClick() {
    setIsMobileMenuOpen(false);
    if (user) router.push('/account');
    else setIsAuthOpen(true);
  }

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!isMounted) return;

    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('[Header] Error fetching categories:', error);
        } else if (data) {
          const hasFullset = data.some(cat => cat.id === 'fullset' || cat.name === 'Готові рішення');
          if (!hasFullset) {
            setCategories([...data, { id: 'fullset', name: 'Готові рішення' }]);
          } else {
            setCategories(data);
          }
        }
      } catch (err) {
        console.error('[Header] Unexpected error:', err);
      }
    }

    async function fetchAiSearchSetting() {
      try {
        const { data } = await supabase
          .from('global_settings')
          .select('value')
          .eq('id', 'ai_search_settings')
          .single();

        if (data?.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          setAiSearchEnabled(parsed.enabled !== false);
        }
      } catch (e) {
        console.error('[Header] Error fetching ai_search_settings:', e);
      }
    }

    fetchCategories();
    fetchAiSearchSetting();
  }, [isMounted]);

  if (!isMounted) {
    return (
      <header className="header" style={{ height: '80px', visibility: 'hidden' }}>
        {/* Placeholder to prevent layout shift */}
      </header>
    );
  }

  return (
    <>
      <header className={`header ${isMobileMenuOpen ? 'menu-open' : ''}`} style={{ touchAction: isMobileMenuOpen ? 'none' : 'auto' }}>
        <div className="header-inner md-grid-header" style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="btn btn-icon d-md-none" style={{ padding: '0 8px' }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href="/" className="logo">
              <Image src={bearImg} alt="Olivka Bear Logo" className="logo-bear" width={45} height={45} priority />
              store.olivka
            </Link>
          </div>

          {/* Десктопна навігація */}
          <nav className="nav desktop-nav">
            <Link href="/" className="nav-link">
              <TextBorderAnimation text="Головна" />
            </Link>

            <div className="dropdown-container">
              <Link href="/catalog" className="nav-link dropdown-trigger">
                <TextBorderAnimation text="Каталог" />
              </Link>
              <div className="dropdown-menu">
                {categories.map(cat => (
                  <Link key={cat.id} href={`/category/${cat.id}`} className="dropdown-item">
                    {cat.name}
                  </Link>
                ))}
                <Link href="/catalog" className="dropdown-item" style={{ borderTop: '1px solid var(--color-stone-100)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                  Всі товари
                </Link>
              </div>
            </div>

            <Link href="/about" className="nav-link">
              <TextBorderAnimation text="Про нас" />
            </Link>
          </nav>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', paddingRight: '0', justifySelf: 'end' }}>
            {/* ІМІТАЦІЙНЕ ПОЛЕ ПОШУКУ (повністю зникає якщо aiSearchEnabled === false) */}
            {aiSearchEnabled && (
              <div
                className="header-search-bar"
                onClick={() => setIsSearchOpen(true)}
                title="Пошук товарів"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  background: '#f7f9f6',
                  border: '1.5px solid #dae5d4',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#78716c',
                  fontSize: '13px',
                  userSelect: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#bed1b6';
                  e.currentTarget.style.background = '#edf3e9';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(98,123,88,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#dae5d4';
                  e.currentTarget.style.background = '#f7f9f6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Search size={15} color="#627b58" />
                <span className="header-search-text" style={{ color: '#78716c', fontWeight: 400, whiteSpace: 'nowrap' }}>
                  Пошук товарів...
                </span>
                <Sparkles size={14} color="#627b58" style={{ opacity: 0.8 }} />
              </div>
            )}

            <button
              className="btn btn-icon"
              onClick={handleUserClick}
              title={user ? 'Особистий кабінет' : 'Увійти / Зареєструватись'}
              style={{ position: 'relative', padding: '0 4px' }}
            >
              {user ? (
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#524f25', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-serif)', fontSize: '0.95rem',
                  fontWeight: 500, lineHeight: 1,
                }}>
                  {((profile?.full_name || user?.email || '?')[0] || '?').toUpperCase()}
                </span>
              ) : (
                <User size={24} color="var(--color-stone-600)" />
              )}
            </button>

            <button className="btn btn-icon relative" style={{ position: 'relative', padding: '0 4px' }} onClick={() => { setIsMobileMenuOpen(false); setIsCartOpen(true); }}>
              <ShoppingBag size={28} color="var(--color-stone-600)" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                    exit={{ scale: 0 }}
                    transition={{
                      scale: { type: 'spring', stiffness: 500, damping: 15 },
                      rotate: { duration: 0.5, ease: "easeInOut" }
                    }}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-2px',
                      backgroundColor: 'var(--color-olive-600)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Мобільне меню */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-menu"
          >
            <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '2rem 1.5rem 100px' }}>
              {aiSearchEnabled && (
                <div
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 18px',
                    background: '#f7f9f6',
                    border: '1.5px solid #dae5d4',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    color: '#78716c',
                    fontSize: '15px',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Search size={18} color="#627b58" />
                  <span style={{ flex: 1, color: '#78716c' }}>Пошук товарів...</span>
                  <Sparkles size={16} color="#627b58" />
                </div>
              )}

              <Link href="/" className="nav-link" style={{ fontSize: '1.2rem' }} onClick={() => setIsMobileMenuOpen(false)}>Головна</Link>
              <Link href="/catalog" className="nav-link" style={{ fontSize: '1.2rem' }} onClick={() => setIsMobileMenuOpen(false)}>Каталог</Link>
              <Link href="/about" className="nav-link" style={{ fontSize: '1.2rem' }} onClick={() => setIsMobileMenuOpen(false)}>Про нас</Link>

              <div style={{ fontWeight: 600, color: 'var(--color-stone-400)', marginTop: '1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Категорії:</div>
              {categories.map(cat => (
                <Link key={cat.id} href={`/category/${cat.id}`} className="nav-link" style={{ paddingLeft: '1rem' }} onClick={() => setIsMobileMenuOpen(false)}>
                  - {cat.name}
                </Link>
              ))}
              <Link href="/catalog" className="nav-link" style={{ paddingLeft: '1rem' }} onClick={() => setIsMobileMenuOpen(false)}>
                - Всі товари
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AuthQueryHandler onOpen={handleOpenAuth} onParams={handleAuthParams} />
      </Suspense>
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        defaultParams={authParams}
      />
      <SmartSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
