import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, User } from 'lucide-react';
import bearImg from '../assets/teddy_bear.png';
import { CATEGORIES as STATIC_CATEGORIES } from '../data';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { cartCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  return (
    <header className="header">
      <div className="header-inner" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) auto minmax(150px, 1fr)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="btn btn-icon d-md-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="logo">
            <img src={bearImg} alt="Olivka Bear Logo" className="logo-bear" />
            store.olivka
          </Link>
        </div>

        {/* Десктопна навігація */}
        <nav className="nav desktop-nav">
          <Link to="/" className="nav-link">Головна</Link>
          
          <div className="dropdown-container">
            <Link to="/catalog" className="nav-link dropdown-trigger">Каталог</Link>
            <div className="dropdown-menu">
              {categories.map(cat => (
                <Link key={cat.id} to={`/category/${cat.id}`} className="dropdown-item">
                  {cat.name}
                </Link>
              ))}
              <Link to="/catalog" className="dropdown-item" style={{ borderTop: '1px solid var(--color-stone-100)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                Всі товари
              </Link>
            </div>
          </div>
          
          <a href="/#about" className="nav-link">Про нас</a>
        </nav>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifySelf: 'end' }}>
          <button className="btn btn-icon" onClick={() => console.log('Account clicked')} title="Особистий кабінет">
            <User size={24} color="var(--color-stone-600)" />
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
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
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

      {/* Мобільне меню */}
      {isMobileMenuOpen && (
        <div className="mobile-menu" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0' }}>
            <Link to="/" className="nav-link">Головна</Link>
            <Link to="/catalog" className="nav-link">Каталог</Link>
            <div style={{ fontWeight: 500, color: 'var(--color-stone-800)', marginTop: '0.5rem', paddingLeft: '1rem' }}>Категорії:</div>
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.id}`} className="nav-link" style={{ paddingLeft: '2rem' }}>
                - {cat.name}
              </Link>
            ))}
            <Link to="/catalog" className="nav-link" style={{ paddingLeft: '2rem' }}>
              - Всі товари
            </Link>
            <a href="/#about" className="nav-link" style={{ marginTop: '0.5rem' }}>Про нас</a>
          </div>
        </div>
      )}
    </header>
  );
}
