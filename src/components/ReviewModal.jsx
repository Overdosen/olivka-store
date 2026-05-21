'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── Inline SVG іконки ── */
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const IconSend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
    <path d="m21.854 2.147-10.94 10.939" />
  </svg>
);

const IconHeart = () => (
  <span style={{ fontSize: '36px' }}>🤎</span>
);

const IconLoader = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-spinner">
    <path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" />
    <path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" />
  </svg>
);

export default function ReviewModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', text: '' });
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  /* Автофокус на першому полі при відкритті */
  useEffect(() => {
    if (isOpen && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      toast.error('Будь ласка, оберіть оцінку від 1 до 5 зірок');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            text: formData.text,
            rating: rating,
            is_approved: false, // за замовчуванням на модерації
            is_pinned: false
          }
        ]);

      if (error) throw error;

      setIsSuccess(true);
      setFormData({ name: '', email: '', text: '' });
      setRating(5);
    } catch (err) {
      console.error('[ReviewModal] Submit error:', err);
      toast.error(err.message || 'Помилка відправки відгуку. Спробуйте пізніше.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setIsSuccess(false), 350);
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="review-modal"
          className="contact-overlay"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="contact-backdrop"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="contact-modal"
          >
            {/* Header */}
            <div className="contact-modal-header">
              <div className="contact-modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(82, 79, 37, 0.1)', color: '#524f25' }}>
                <Star size={20} fill="#524f25" />
              </div>
              <h2 className="contact-modal-title">Залишити відгук</h2>
              <button onClick={handleClose} className="contact-modal-close" aria-label="Закрити">
                <IconX />
              </button>
            </div>

            {/* Body */}
            <div className="contact-modal-body">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSubmit}
                    className="contact-form"
                  >
                    <div className="contact-field">
                      <label className="contact-label" htmlFor="review-name">Ваше ім'я</label>
                      <input
                        ref={nameRef}
                        id="review-name"
                        type="text"
                        required
                        className="contact-input"
                        placeholder="Як до вас звертатися?"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="contact-field">
                      <label className="contact-label" htmlFor="review-email">Ваша пошта</label>
                      <input
                        id="review-email"
                        type="email"
                        required
                        className="contact-input"
                        placeholder="example@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    {/* Оцінка зірочками */}
                    <div className="contact-field">
                      <label className="contact-label">Ваша оцінка</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', cursor: 'pointer' }}>
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isHighlighted = starValue <= (hoveredRating !== null ? hoveredRating : rating);
                          return (
                            <motion.div
                              key={starValue}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onMouseEnter={() => setHoveredRating(starValue)}
                              onMouseLeave={() => setHoveredRating(null)}
                              onClick={() => setRating(starValue)}
                              style={{ transition: 'color 0.15s ease' }}
                            >
                              <Star
                                size={28}
                                fill={isHighlighted ? '#f59e0b' : 'transparent'}
                                color={isHighlighted ? '#f59e0b' : '#d6d3d1'}
                                strokeWidth={isHighlighted ? 1.5 : 2}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="contact-field">
                      <label className="contact-label" htmlFor="review-text">Відгук</label>
                      <textarea
                        id="review-text"
                        required
                        rows={4}
                        className="contact-input contact-textarea"
                        placeholder="Ваш відгук про наш магазин…"
                        value={formData.text}
                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="contact-submit-btn" style={{ backgroundColor: '#524f25', color: 'white', border: 'none' }}>
                      {isSubmitting ? (
                        <>
                          <IconLoader />
                          <span>НАДСИЛАЄМО…</span>
                        </>
                      ) : (
                        <>
                          <span>ВІДПРАВИТИ ВІДГУК</span>
                          <IconSend />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="contact-success"
                  >
                    <div className="contact-success-icon" style={{ backgroundColor: 'rgba(82, 79, 37, 0.05)', color: '#524f25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 200 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <IconHeart />
                      </motion.div>
                    </div>
                    <h3 className="contact-success-title" style={{ color: '#524f25' }}>Дякуємо!</h3>
                    <p className="contact-success-text" style={{ color: '#4a4632' }}>
                      Дякуємо за Ваш відгук 🤎<br />
                      Він з'явиться на сайті після проходження швидкої модерації.
                    </p>
                    <button onClick={handleClose} className="contact-close-btn" style={{ backgroundColor: '#524f25', color: 'white', border: 'none' }}>
                      ЗАКРИТИ
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
