'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function PaymentFailurePage() {
  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'var(--font-sans)',
      background: 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)'
    }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
        style={{ color: '#d32f2f', marginBottom: '2rem' }}
      >
        <AlertCircle size={80} />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ fontSize: '2.2rem', fontWeight: 700, color: '#524f25', marginBottom: '1rem' }}
      >
        Оплата не вдалася
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ fontSize: '1.1rem', color: 'rgba(82,79,37,0.65)', maxWidth: '500px', lineHeight: 1.6, marginBottom: '3rem' }}
      >
        Сталася помилка при обробці платежу. Не хвилюйтеся, ваше замовлення збережено у статусі "Очікує оплати". Ви можете спробувати ще раз або обрати інший спосіб оплати в особистому кабінеті.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <Link href="/checkout" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 2rem' }}>
          Спробувати ще раз <RefreshCcw size={18} />
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#524f25', fontWeight: 600, padding: '1rem' }}>
          На головну <Home size={18} />
        </Link>
      </motion.div>
    </div>
  );
}
