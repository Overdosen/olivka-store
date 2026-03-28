import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { CATEGORIES } from '../data';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { cartCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header-inner">
        <button className="btn btn-icon d-md-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <Link to="/" className="logo">
          store.olivka
        </Link>

        {/* Десктопне меню */}
        <nav className="nav desktop-nav">
          <Link to="/" className="nav-link nav-link-highlight">Новинки</Link>
          
          <div className="dropdown-container">
            <Link to="/catalog" className="nav-link dropdown-trigger">Каталог</Link>
            <div className="dropdown-menu">
              {CATEGORIES.map(cat => (
                <Link key={cat.id} to={`/category/${cat.id}`} className="dropdown-item">
                  {cat.name}
                </Link>
              ))}
              <Link to="/catalog" className="dropdown-item" style={{borderTop: '1px solid var(--color-stone-100)', marginTop: '0.5rem', paddingTop: '0.5rem'}}>
                Всі товари
              </Link>
            </div>
          </div>
          
          <Link to="/#about" className="nav-link">Про нас</Link>
        </nav>

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

      {/* Мобильное меню (пока простое) */}
      {isMobileMenuOpen && (
        <div className="mobile-menu" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="container" style={{display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0'}}>
            <Link to="/" className="nav-link nav-link-highlight">Новинки</Link>
            <div style={{fontWeight: 500, color: 'var(--color-stone-800)', marginTop: '0.5rem'}}>Категорії:</div>
            {CATEGORIES.map(cat => (
              <Link key={cat.id} to={`/category/${cat.id}`} className="nav-link" style={{paddingLeft: '1rem'}}>
                - {cat.name}
              </Link>
            ))}
            <Link to="/catalog" className="nav-link" style={{paddingLeft: '1rem'}}>
              - Всі товари
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
