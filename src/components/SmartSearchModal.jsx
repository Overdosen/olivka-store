'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { searchProductsSemantic } from '../app/actions/products';

export default function SmartSearchModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setResults([]);
      setShowAll(false);
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    setShowAll(false);
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchProductsSemantic({ searchTerm, limit: 100 });
        setResults(res || []);
      } catch (err) {
        console.error('[SmartSearch] Error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const sampleQueries = [
    'шкарпетки',
    'мусліновий плед',
    'набір інтерлок 56',
    'капсула',
    'готові рішення',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px 16px 20px',
            background: 'rgba(28, 25, 23, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '650px',
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* SEARCH INPUT BAR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 24px',
              borderBottom: '1px solid #f0efed',
            }}>
              <div style={{
                width: '38px', height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f7f9f6, #edf3e9)',
                border: '1px solid #dae5d4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Sparkles size={20} color="#627b58" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Спробуйте: легке боді на літо, комплект на виписку 56..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#1c1917',
                  fontFamily: 'inherit',
                  background: 'transparent',
                }}
              />

              {loading && <Loader2 size={18} className="animate-spin" color="#627b58" />}

              <button
                type="button"
                onClick={onClose}
                style={{
                  border: 'none',
                  background: '#f5f5f4',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#78716c',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* RESULTS OR SUGGESTIONS */}
            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px 24px 24px' }}>
              {!searchTerm.trim() ? (
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Популярні запити:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {sampleQueries.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSearchTerm(q)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e7e5e4',
                          background: '#fafaf9',
                          fontSize: '13px',
                          color: '#44403c',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#bed1b6';
                          e.currentTarget.style.background = '#f7f9f6';
                          e.currentTarget.style.color = '#627b58';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e7e5e4';
                          e.currentTarget.style.background = '#fafaf9';
                          e.currentTarget.style.color = '#44403c';
                        }}
                      >
                        <Search size={13} color="#a8a29e" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#627b58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Знайдено розпізнаних товарів ({results.length}):
                    </span>
                  </div>

                  {(showAll ? results : results.slice(0, 6)).map(prod => {
                    const imgUrl = prod.image_url || (Array.isArray(prod.gallery) && prod.gallery[0]) || (Array.isArray(prod.images) ? prod.images[0] : null);
                    return (
                      <Link
                        key={prod.id}
                        href={`/product/${prod.id}`}
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px 14px',
                          borderRadius: '14px',
                          border: '1.5px solid #f0efed',
                          background: 'white',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#bed1b6';
                          e.currentTarget.style.background = '#f7f9f6';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#f0efed';
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div style={{
                          width: '52px', height: '52px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#f5f5f4',
                          position: 'relative',
                          flexShrink: 0,
                        }}>
                          {imgUrl ? (
                            <Image src={imgUrl} alt={prod.name} fill style={{ objectFit: 'cover' }} sizes="52px" />
                          ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingBag size={20} color="#a8a29e" />
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.name}
                          </h4>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#627b58', marginTop: '4px', display: 'inline-block' }}>
                            {prod.price} грн
                          </span>
                        </div>

                        <ArrowRight size={16} color="#a8a29e" />
                      </Link>
                    );
                  })}

                  {results.length > 6 && !showAll && (
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        marginTop: '6px',
                        borderRadius: '16px',
                        background: '#edf3e9',
                        border: '1.5px solid #bed1b6',
                        color: '#627b58',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(98, 123, 88, 0.08)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#627b58';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#edf3e9';
                        e.currentTarget.style.color = '#627b58';
                      }}
                    >
                      <Sparkles size={16} />
                      Показати всі результати ({results.length})
                    </button>
                  )}
                </div>
              ) : !loading ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#78716c' }}>
                  <p style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>За вашим запитом товарів не знайдено</p>
                  <p style={{ fontSize: '13px', color: '#a8a29e', marginTop: '6px' }}>Спробуйте описати категорію або вік іншими словами</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
