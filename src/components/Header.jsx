import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import bearImg from '../assets/teddy_bear.png';
import TextBorderAnimation from './TextBorderAnimation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';

export default function Header() {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isMobileMenuOpen]);

  function handleUserClick() {
    if (user) router.push('/account');
    else setIsAuthOpen(true);
  }

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Помилка при завантаженні категорій:', error);
      } else if (data) {
        const hasFullset = data.some(cat => cat.id === 'fullset' || cat.name === 'Готові рішення');
        if (!hasFullset) {
          setCategories([...data, { id: 'fullset', name: 'Готові рішення' }]);
        } else {
          setCategories(data);
        }
      }
    }
    fetchCategories();
  }, []);

  return (
    <>
      <header className={`header ${isMobileMenuOpen ? 'menu-open' : ''}`} style={{ touchAction: isMobileMenuOpen ? 'none' : 'auto' }}>
        <div className="header-inner md-grid-header" style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-icon d-md-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <Link href="/" className="logo">
              <img src={bearImg.src || bearImg} alt="Olivka Bear Logo" className="logo-bear" />
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

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', paddingRight: '0.5rem', justifySelf: 'end' }}>
            <button
              className="btn btn-icon"
              onClick={handleUserClick}
              title={user ? 'Особистий кабінет' : 'Увійти / Зареєструватись'}
              style={{ position: 'relative' }}
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
            
            <button className="btn btn-icon relative" style={{ position: 'relative' }} onClick={() => setIsCartOpen(true)}>
              <ShoppingBag size={24} color="var(--color-stone-600)" />
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
                      top: '-2px',
                      right: '6px',
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

      {/* Мобільне меню - тепер поза тегом header */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-menu"
          >
            <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '2rem 1.5rem 100px' }}>
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

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
