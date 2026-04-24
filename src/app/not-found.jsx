'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';
import bearImg from '../assets/teddy_bear.png';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(180deg, #fdfbf7 0%, #f5f2e9 100%)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
      }}>
        {/* Маскот з плавною анімацією */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ marginBottom: '1.5rem' }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block' }}
          >
            <Image
              src={bearImg}
              alt="Store Olivka маскот"
              width={120}
              height={120}
              style={{ opacity: 0.85, filter: 'drop-shadow(0 8px 24px rgba(82,79,37,0.12))' }}
              priority
            />
          </motion.div>
        </motion.div>

        {/* Число 404 */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: 'clamp(4rem, 12vw, 7rem)',
            fontWeight: 700,
            color: '#524f25',
            lineHeight: 1,
            margin: '0 0 0.5rem',
            letterSpacing: '-0.04em',
            opacity: 0.15,
          }}
        >
          404
        </motion.h1>

        {/* Заголовок */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
            fontWeight: 600,
            color: '#524f25',
            margin: '0 0 0.75rem',
            letterSpacing: '-0.01em',
          }}
        >
          Сторінку не знайдено
        </motion.h2>

        {/* Підпис */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          style={{
            fontSize: '0.95rem',
            color: 'rgba(82,79,37,0.55)',
            lineHeight: 1.6,
            margin: '0 0 2rem',
            padding: '0 1rem',
          }}
        >
          На жаль, ми не змогли знайти те, що ви шукали.
          <br />
          Можливо, сторінка була переміщена або видалена.
        </motion.p>

        {/* Кнопки */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 2rem',
              backgroundColor: '#524f25',
              color: 'white',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(82,79,37,0.2)',
            }}
          >
            <Home size={16} />
            На головну
          </Link>

          <Link
            href="/catalog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#524f25',
              border: '1.5px solid rgba(82,79,37,0.2)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Search size={14} />
            Переглянути каталог
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
