'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, RefreshCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function FailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-[#fdfcf7] flex flex-col items-center px-6 text-center" style={{ fontFamily: 'var(--font-sans)', paddingTop: '10vh' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
          <AlertCircle size={48} className="text-rose-500" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[32px] md:text-[40px] font-medium text-[#524f25] mb-6 tracking-tight leading-tight"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Оплата не вдалася
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="max-w-xl text-[#524f25] text-[17px] md:text-[18px] leading-relaxed mb-12 opacity-80 space-y-4"
      >
        <p>
          На жаль, платіжна система відхилила транзакцію. Це міг бути недостатній ліміт для інтернет-оплат або технічна відмова банку.
        </p>
        <p className="text-[15px] italic">
          Ваше замовлення <span className="font-semibold text-[#524f25]">{orderId ? `№${orderId.slice(0, 8).toUpperCase()}` : ''}</span> збережене. Ви можете спробувати оплатити його знову через кошик.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center gap-6"
      >
        <Link 
          href="/checkout" 
          className="flex items-center gap-3 bg-[#524f25] px-10 py-5 rounded-full text-[15px] font-bold tracking-[0.15em] uppercase hover:bg-[#43411e] transition-all shadow-md active:scale-95"
          style={{ textDecoration: 'none', color: '#ffffff' }}
        >
          <RefreshCcw size={18} color="#ffffff" /> <span style={{ color: '#ffffff' }}>Спробувати ще раз</span>
        </Link>

        <Link 
          href="/catalog" 
          className="flex items-center gap-2 text-[#524f25] text-[15px] font-semibold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity"
          style={{ textDecoration: 'none' }}
        >
          До каталогу <ArrowLeft size={16} className="rotate-180" />
        </Link>
      </motion.div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdfcf7] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#524f25]/20" size={32} />
      </div>
    }>
      <FailureContent />
    </Suspense>
  );
}
