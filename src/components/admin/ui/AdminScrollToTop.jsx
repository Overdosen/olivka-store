'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function AdminScrollToTop({ targetRef }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = targetRef?.current;
    const checkScroll = () => {
      const scrollPos = target
        ? target.scrollTop
        : (window.scrollY || document.documentElement.scrollTop);
      setVisible(scrollPos > 250);
    };

    if (target) {
      target.addEventListener('scroll', checkScroll, { passive: true });
    }
    window.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      if (target) target.removeEventListener('scroll', checkScroll);
      window.removeEventListener('scroll', checkScroll);
    };
  }, [targetRef]);

  const scrollToTop = () => {
    if (targetRef?.current) {
      targetRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="admin-scroll-to-top"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Прокрутити вгору"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1.5px solid rgba(82,79,37,0.18)',
            background: 'rgba(250,249,246,0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(82,79,37,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#524f25',
            padding: 0,
          }}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.08, boxShadow: '0 6px 24px rgba(82,79,37,0.22)' }}
        >
          <ArrowUp size={18} strokeWidth={2.2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
