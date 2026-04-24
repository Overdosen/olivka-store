'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function RelatedCard({ product, index }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete) setIsLoaded(true);
  }, []);

  const hasSizes = product.sizes && product.sizes.length > 0;
  const isAvailable = hasSizes
    ? product.sizes.some(s => s.quantity > 0)
    : product.stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      style={{
        flex: '0 0 auto',
        width: 'clamp(180px, 42vw, 220px)',
        scrollSnapAlign: 'start',
      }}
    >
      <Link
        href={`/product/${product.id}`}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        {/* Зображення */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#f5f2e9',
          marginBottom: '0.75rem',
        }}>
          {!isLoaded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(110deg, #f5f2e9 30%, #eae6d8 50%, #f5f2e9 70%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              zIndex: 2,
            }} />
          )}
          <Image
            src={product.image_url?.startsWith('http') ? product.image_url : `/images/${product.image_url}`}
            alt={product.name}
            fill
            onLoad={() => setIsLoaded(true)}
            sizes="(max-width: 640px) 42vw, 220px"
            style={{
              objectFit: 'cover',
              opacity: isLoaded ? (isAvailable ? 1 : 0.5) : 0,
              transition: 'opacity 0.4s ease, transform 0.3s ease',
              transform: isLoaded ? 'scale(1)' : 'scale(1.03)',
            }}
          />

          {!isAvailable && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              backgroundColor: 'rgba(28,25,23,0.8)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              zIndex: 3,
            }}>
              Немає в наявності
            </div>
          )}
        </div>

        {/* Інфо */}
        <div style={{ padding: '0 4px' }}>
          <p style={{
            margin: '0 0 4px',
            fontSize: '0.82rem',
            fontWeight: 500,
            color: '#524f25',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            opacity: isAvailable ? 1 : 0.55,
          }}>
            {product.name}
          </p>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#524f25',
            opacity: isAvailable ? 0.9 : 0.45,
          }}>
            {product.price} грн
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default function RelatedProducts({ products }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el?.removeEventListener('scroll', updateScrollState);
  }, [products]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const itemWidth = scrollRef.current.children[0]?.offsetWidth || 200;
    scrollRef.current.scrollBy({ left: dir * (itemWidth + 16), behavior: 'smooth' });
  };

  if (!products || products.length === 0) return null;

  return (
    <section style={{
      padding: '3rem 0 4rem',
      overflow: 'hidden',
    }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          padding: '0 0.5rem',
        }}>
          <div>
            <p style={{
              margin: '0 0 2px',
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(82,79,37,0.4)',
              fontWeight: 500,
            }}>
              Може сподобатись
            </p>
            <h2 style={{
              margin: 0,
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
              fontWeight: 600,
              color: '#524f25',
              letterSpacing: '-0.01em',
            }}>
              Схожі товари
            </h2>
          </div>

          {/* Кнопки навігації (desktop) */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
          }}
          className="d-none d-md-flex"
          >
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1.5px solid rgba(82,79,37,0.15)',
                background: canScrollLeft ? 'white' : 'transparent',
                cursor: canScrollLeft ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canScrollLeft ? 1 : 0.3,
                transition: 'all 0.2s ease',
                boxShadow: canScrollLeft ? '0 2px 8px rgba(82,79,37,0.06)' : 'none',
              }}
              aria-label="Прокрутити назад"
            >
              <ChevronLeft size={16} color="#524f25" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1.5px solid rgba(82,79,37,0.15)',
                background: canScrollRight ? 'white' : 'transparent',
                cursor: canScrollRight ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canScrollRight ? 1 : 0.3,
                transition: 'all 0.2s ease',
                boxShadow: canScrollRight ? '0 2px 8px rgba(82,79,37,0.06)' : 'none',
              }}
              aria-label="Прокрутити вперед"
            >
              <ChevronRight size={16} color="#524f25" />
            </button>
          </div>
        </div>

        {/* Карусель товарів */}
        <div
          ref={scrollRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            padding: '0.25rem 0.5rem 1rem',
            scrollPaddingLeft: '0.5rem',
          }}
        >
          {products.map((product, idx) => (
            <RelatedCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      </div>

      {/* Shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </section>
  );
}
