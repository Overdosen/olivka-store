'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Copy, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';


// ─── Shared Components ───────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center pt-80 bg-[#fdfcf7]">
      <Loader2 className="animate-spin text-[#524f25] mb-4" size={40} />
      <p className="text-[#524f25]" style={{ fontFamily: 'var(--font-sans)' }}>Завантаження...</p>
    </div>
  );
}

const AnimatedCheckmark = () => (
  <div className="mb-10 flex items-center justify-center w-24 h-24">
    <svg 
      viewBox="0 0 52 52" 
      className="w-full h-full"
      style={{ overflow: 'visible' }}
    >
      <motion.circle
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="#3c7b27"
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.path
        fill="none"
        stroke="#3c7b27"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
      />
    </svg>
  </div>
);

// ─── COD View (Strictly based on screenshot 1) ──────────────────────────────

function CodView({ shortId, copyToClipboard }) {
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedRecipient, setCopiedRecipient] = useState(false);
  const [copiedEdrpou, setCopiedEdrpou] = useState(false);

  const handleCopy = (text, type) => {
    copyToClipboard(text);
    if (type === 'iban') {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } else if (type === 'recipient') {
      setCopiedRecipient(true);
      setTimeout(() => setCopiedRecipient(false), 2000);
    } else if (type === 'edrpou') {
      setCopiedEdrpou(true);
      setTimeout(() => setCopiedEdrpou(false), 2000);
    }
  };

  const CopyIcon = ({ copied }) => (
    <div className="text-[#524f25]/40 group-hover:text-[#524f25] transition-colors flex-shrink-0">
      {copied ? (
        <span className="text-[10px] text-green-700 font-semibold tracking-wider uppercase">Готово</span>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdfcf7] flex flex-col items-center px-6 text-center" style={{ fontFamily: 'var(--font-sans)', paddingTop: '5vh' }}>
      <AnimatedCheckmark />

      <h1 className="text-[28px] md:text-[32px] font-medium text-[#524f25] mt-8 mb-5 tracking-tight leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
        Замовлення №{shortId} прийнято та чекає на оплату авансу!
      </h1>

      <div className="max-w-2xl text-[#524f25] text-[16px] md:text-[17px] leading-relaxed mb-10 space-y-1">
        <p>Ми вже отримали ваші дані та готуємо пакунок до відправки.</p>
        <p>
          Щоб ми могли якнайшвидше надіслати ваше замовлення, будь ласка,<br className="hidden md:block" /> 
          внесіть аванс у розмірі 150 грн за реквізитами нижче:
        </p>
      </div>

      <div className="w-full max-w-[480px] bg-[#fcfbf7] border border-[#524f25]/20 rounded-md overflow-hidden mb-10 text-left">
        <div className="py-4 px-6 border-b border-[#524f25]/10 text-center">
          <span className="text-[#524f25]/50 text-[12px] uppercase tracking-[0.2em] font-semibold">Реквізити для оплати</span>
        </div>
        
        <div className="p-6 md:p-8 space-y-7">
          <div className="space-y-1">
            <span className="text-[#524f25]/50 text-[11px] uppercase tracking-[0.15em] font-semibold">Отримувач</span>
            <div 
              onClick={() => handleCopy('ФОП Сопіна Вікторія Іванівна', 'recipient')}
              className="mt-1 flex items-center justify-between bg-white border border-[#524f25]/20 rounded px-4 py-3 cursor-pointer group hover:border-[#524f25]/40 transition-colors"
            >
              <p className="text-[#524f25] text-[15px] font-normal">ФОП Сопіна Вікторія Іванівна</p>
              <CopyIcon copied={copiedRecipient} />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[#524f25]/50 text-[11px] uppercase tracking-[0.15em] font-semibold">ЄДРПОУ</span>
            <div 
              onClick={() => handleCopy('3522303066', 'edrpou')}
              className="mt-1 flex items-center justify-between bg-white border border-[#524f25]/20 rounded px-4 py-3 cursor-pointer group hover:border-[#524f25]/40 transition-colors"
            >
              <p className="text-[#524f25] text-[17px] font-normal tracking-wide">3522303066</p>
              <CopyIcon copied={copiedEdrpou} />
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[#524f25]/50 text-[11px] uppercase tracking-[0.15em] font-semibold">Банк</span>
            <p className="text-[#524f25] text-[17px] font-normal pl-4 py-2">АТ КБ "ПРИВАТБАНК"</p>
          </div>
          
          <div className="space-y-2 pt-1">
            <span className="text-[#524f25]/50 text-[11px] uppercase tracking-[0.15em] font-semibold">Рахунок IBAN</span>
            <div 
              onClick={() => handleCopy('UA203052990000026002043900812', 'iban')}
              className="mt-1 flex items-center justify-between bg-white border border-[#524f25]/20 rounded px-4 py-3 cursor-pointer group hover:border-[#524f25]/40 transition-colors"
            >
              <p className="text-[#524f25] text-[14px] md:text-[15px] font-normal break-all pr-4">UA203052990000026002043900812</p>
              <CopyIcon copied={copiedIban} />
            </div>
            <div className="mt-4 p-4 bg-[#524f25]/5 rounded border border-[#524f25]/10 flex gap-3 items-start text-left">
              <svg className="w-5 h-5 text-[#524f25] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[12.5px] text-[#524f25] leading-relaxed font-normal italic">
                В призначенні обов'язково вкажіть <span className="font-semibold">«Сплата за товар»</span> та ваше прізвище або номер замовлення. Враховуйте комісію банку.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[#524f25] text-[16px] md:text-[17px] space-y-1 mb-12">
        <p>Щойно оплата надійде — ваше замовлення вирушить у дорогу.</p>
        <p>Дякуємо, що довіряєте нам піклування про комфорт вашого малюка!</p>
      </div>

      <Link 
        href="/catalog" 
        className="mt-32 text-[#524f25] text-[15px] font-bold tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
        style={{ textDecoration: 'none' }}
      >
        До каталогу
      </Link>
    </div>
  );
}

// ─── LiqPay View (Strictly based on screenshot 2) ─────────────────────────────

function LiqPayView({ order, shortId }) {
  const isPaid = order?.status === 'paid';

  return (
    <div className="min-h-screen bg-[#fdfcf7] flex flex-col items-center px-6 text-center" style={{ fontFamily: 'var(--font-sans)', paddingTop: '5vh' }}>
      {isPaid ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full max-w-2xl"
        >
          <AnimatedCheckmark />
          
          <h1 className="text-[28px] md:text-[32px] font-medium text-[#524f25] mb-5 tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Оплата пройшла успішно!
          </h1>
          
          <div className="max-w-2xl text-[#524f25] text-[17px] leading-[1.6] mb-5 opacity-90 space-y-1">
            <p>
              Ваше замовлення <span className="font-semibold">№{shortId}</span> прийнято в роботу. Дякуємо, що довіряєте
            </p>
            <p>нам піклування про комфорт вашого малюка!</p>
            <br />
            <p> Ми вже бережно пакуємо ваш вибір. Очікуйте на оновлення статусу</p>
            <p> доставки найближчим часом.</p>
          </div>

          <div className="flex flex-col items-center gap-6 w-full max-w-[320px]" style={{ marginTop: '3vh' }}>
            <Link 
              href="/catalog" 
              className="text-[#524f25] text-[15px] font-semibold tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
            >
              До каталогу
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center" style={{ marginTop: '2.5vh' }}>
          <div className="mb-12">
            <Loader2 className="animate-spin text-[#524f25] opacity-20" size={64} strokeWidth={1.5} />
          </div>
          <h1 className="text-[24px] md:text-[28px] font-normal text-[#524f25] mb-4 tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Обробка оплати...
          </h1>
          <div className="max-w-md text-[#524f25] text-[16px] leading-relaxed mb-12 opacity-60">
            <p>Будь ласка, зачекайте. Ми перевіряємо статус вашої оплати.</p>
          </div>
          <Link 
            href="/catalog" 
            className="mt-32 text-[#524f25] text-[15px] font-semibold tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
          >
            Перейти до каталогу
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main Logic Container ────────────────────────────────────────────────────

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const orderId = searchParams.get('order_id') || searchParams.get('orderId');
  const method = searchParams.get('method');

  // Fetch order status via API endpoint (uses service role — bypasses RLS)
  const fetchOrder = useCallback(async (silent = false) => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // If we already have paid status and this is a silent background poll, skip
    if (order?.status === 'paid' && silent) return;

    if (!silent) setLoading(true);

    try {
      const res = await fetch(`/api/order-status?id=${orderId}`);

      if (!res.ok) {
        // 404 — order not found yet, will retry via interval
        if (!silent) setLoading(false);
        return;
      }

      const data = await res.json();

      if (data?.status === 'payment_error') {
        router.push(`/payment/failure?order_id=${orderId}`);
        return;
      }

      setOrder(prev => {
        if (prev?.status === data?.status && prev?.order_number === data?.order_number) return prev;
        return data;
      });
    } catch (err) {
      console.error('SUCCESS_PAGE: Unexpected error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId, order?.status, router]);


  useEffect(() => {
    setIsMounted(true);
    if (orderId) {
      fetchOrder();
      clearCart();
    } else {
      setLoading(false);
    }
  }, [orderId, fetchOrder, clearCart]);

  // 2. Realtime subscription for status updates
  useEffect(() => {
    if (!orderId || !isMounted) return;

    // Вже маємо фінальний статус, підписка не потрібна
    if (order?.status === 'paid' || order?.status === 'payment_error') return;

    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new && payload.new.status === 'payment_error') {
            router.push(`/payment/failure?order_id=${orderId}`);
            return;
          }
          fetchOrder(true);
        }
      )
      .subscribe();

    const fallbackInterval = setInterval(() => {
      fetchOrder(true);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [orderId, isMounted, order?.status, fetchOrder, router]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопійовано!');
  };

  if (!isMounted || (loading && !order)) {
    return <LoadingState />;
  }

  const shortId = order?.order_number || '';
  
  // Robust detection of LiqPay:
  // 1. From URL param
  // 2. From DB payment_method field
  // 3. From DB status (if pending_payment, it's definitely an online order)
  const isLiqPay = 
    method?.toLowerCase() === 'liqpay' || 
    order?.payment_method?.toLowerCase().includes('liqpay') ||
    order?.status === 'pending_payment';

  console.log("SUCCESS_PAGE: Rendering.", { 
    orderId, 
    method, 
    dbMethod: order?.payment_method, 
    dbStatus: order?.status,
    isLiqPay 
  });

  return (
    <div>
      {isLiqPay ? (
        <LiqPayView order={order} shortId={shortId} />
      ) : (
        <CodView shortId={shortId} copyToClipboard={copyToClipboard} />
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  );
}
