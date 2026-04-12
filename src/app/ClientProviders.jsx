'use client';

import { Toaster } from 'react-hot-toast';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

export default function ClientProviders({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#fff',
              color: 'var(--color-stone-800)',
              fontFamily: 'var(--font-sans)',
              borderRadius: '999px',
              padding: '16px 24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }
          }}
        />
        
        {/* If it's the admin route, we only show children. The AdminLayout handles its own structure. */}
        {isAdmin ? (
          children
        ) : (
          <div className="min-h-screen flex flex-col">
            <Header />
            <CartDrawer />
            <main className="flex-grow" style={{ position: 'relative' }}>
              {children}
            </main>
            <Footer />
          </div>
        )}
      </CartProvider>
    </AuthProvider>
  );
}
