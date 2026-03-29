import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart } = useCart();

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Фон затемнення */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000',
              zIndex: 99,
            }}
          />

          {/* Плашка кошика */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '430px',
              backgroundColor: 'white',
              zIndex: 100,
              boxShadow: '-4px 0 20px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {/* Header кошика */}
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--color-stone-100)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0 }}>
                Кошик
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ color: 'var(--color-stone-500)', transition: 'color 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#000')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-stone-500)')}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content  */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-stone-500)', marginTop: '3rem' }}>
                  <ShoppingBagEmptyIcon />
                  <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>Кошик поки що порожній</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn btn-primary"
                    style={{ marginTop: '2rem' }}
                  >
                    Повернутися до покупок
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {cartItems.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${idx}`} style={{ display: 'flex', gap: '1rem' }}>
                      <Link to={`/product/${item.id}`} onClick={() => setIsCartOpen(false)}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '80px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            backgroundColor: 'var(--color-stone-100)',
                          }}
                        />
                      </Link>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{item.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-stone-500)' }}>
                          Розмір: {item.size}
                        </p>
                        <p style={{ margin: '0.5rem 0 0 0', fontWeight: '500' }}>
                          {item.price} грн{' '}
                          <span style={{ color: 'var(--color-stone-400)', fontWeight: 400 }}>
                            x {item.quantity}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        style={{ alignSelf: 'flex-start', color: 'var(--color-stone-400)' }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer кошика */}
            {cartItems.length > 0 && (
              <div
                style={{
                  padding: '1.5rem',
                  borderTop: '1px solid var(--color-stone-100)',
                  backgroundColor: 'var(--color-stone-50)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    fontSize: '1.25rem',
                    fontWeight: 500,
                  }}
                >
                  <span>Разом</span>
                  <span>{total} грн</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                >
                  Оформити замовлення
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Проста SVG іконка для візуалізації порожньої сумки
const ShoppingBagEmptyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--color-stone-300)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ margin: '0 auto' }}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
