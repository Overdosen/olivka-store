import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const lastToastTime = useRef(0);

  // Блокування скролу при відкритому кошику
  useEffect(() => {
    if (isCartOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isCartOpen]);

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
            transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '430px',
              backgroundColor: 'white',
              zIndex: 100,
              boxShadow: '-4px 0 30px rgba(0,0,0,0.1)',
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
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, fontWeight: 400, color: '#524f25' }}>
                Кошик
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ color: 'var(--color-stone-500)', transition: 'color 0.2s', padding: '0.5rem' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#000')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-stone-500)')}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content  */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-stone-500)', marginTop: '4rem' }}>
                  <ShoppingBagEmptyIcon />
                  <p style={{ marginTop: '1.5rem', fontSize: '1.125rem', color: '#524f25' }}>Упс! Кошик наразі порожній</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn btn-primary"
                    style={{ marginTop: '2rem', padding: '1rem 2rem' }}
                  >
                    Повернутися до каталогу
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {cartItems.map((item, idx) => (
                    <div key={`${item.id}-${item.size}-${idx}`} 
                         style={{ 
                           display: 'flex', 
                           gap: '1rem', 
                           padding: '1rem', 
                           backgroundColor: 'var(--color-stone-50)',
                           borderRadius: '1rem'
                         }}>
                      <Link href={`/product/${item.id}`} onClick={() => setIsCartOpen(false)}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '90px',
                            height: '110px',
                            objectFit: 'cover',
                            borderRadius: '0.75rem',
                            backgroundColor: 'white',
                          }}
                        />
                      </Link>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#524f25', fontWeight: 600 }}>{item.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.id, item.size)}
                              style={{ color: 'var(--color-stone-400)', transition: 'color 0.2s' }}
                              onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-stone-400)')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-stone-500)' }}>
                            Розмір: {item.size}
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            backgroundColor: 'white',
                            borderRadius: '99px',
                            padding: '0.25rem 0.5rem',
                            border: '1px solid var(--color-stone-200)'
                          }}>
                            <button 
                              onClick={() => updateQuantity(item.id, item.size, -1)}
                              style={{ display: 'flex', alignItems: 'center', color: '#524f25' }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ fontSize: '0.875rem', minWidth: '1.5rem', textAlign: 'center', fontWeight: 500 }}>
                              {item.quantity}
                            </span>
                             <button 
                               onClick={() => {
                                 if (item.stock != null && item.quantity >= item.stock) {
                                   const now = Date.now();
                                   if (now - lastToastTime.current > 3000) {
                                     toast.error('Більше немає в наявності');
                                     lastToastTime.current = now;
                                   }
                                 } else {
                                   updateQuantity(item.id, item.size, 1);
                                 }
                               }}
                               style={{ 
                                 display: 'flex', 
                                 alignItems: 'center',
                                 color: (item.stock != null && item.quantity >= item.stock) ? 'rgba(82,79,37,0.4)' : '#524f25',
                                 cursor: 'pointer',
                               }}
                             >
                               <Plus size={14} />
                             </button>
                          </div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#524f25' }}>
                            {item.price * item.quantity} грн
                          </p>
                        </div>
                      </div>
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
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', fontSize: '1rem', textAlign: 'center', textDecoration: 'none', display: 'block' }}
                >
                  Оформити замовлення
                </Link>
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
