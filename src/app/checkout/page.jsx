'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Truck, MapPin, Phone, User, FileText, ChevronRight, Package, ShieldCheck, Lock, CreditCard, Banknote, Wallet, Eraser } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/useAuth';
import AuthModal from '../../components/AuthModal';
import NovaPoshtaSelector from '../../components/NovaPoshtaSelector';
import UkrPoshtaSelector from '../../components/UkrPoshtaSelector';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import InfoModal from '../../components/InfoModal';
import { formatUaMasked, isPhoneFull } from '../../lib/utils';

const DELIVERY_OPTIONS = [
  { 
    id: 'nova_poshta', 
    label: 'Нова Пошта', 
    icon: <Image src="/footerlogos/NP-mini-icon.svg" alt="Нова Пошта" width={26} height={26} style={{ display: 'block' }} />, 
    desc: '1–2 дні' 
  },
  { 
    id: 'ukrposhta',   
    label: 'Укрпошта',   
    icon: <Image src="/footerlogos/Ukrposhta-mini-icon.svg" alt="Укрпошта" width={22} height={22} style={{ display: 'block' }} />, 
    desc: '3–4 дні' 
  },
];

const PAYMENT_OPTIONS = [
  { 
    id: 'liqpay',           
    label: 'Банківською карткою, Apple Pay, Google Pay', 
    icon: (
      <Image src="/logo-liqpay-symbol.svg" width={28} height={28} alt="LiqPay" style={{ display: 'block' }} />
    ), 
    desc: '' 
  },
  { 
    id: 'cash_on_delivery', 
    label: 'Післяплата з авансом 150 грн', 
    icon: <Wallet size={24} style={{ color: '#c4a882' }} />, 
    desc: '' 
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, profile, loading: authLoading } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const phoneRef = useRef(null);

  // Форма
  const [fullName, setFullName]     = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');
  const [address, setAddress]       = useState('');
  const [delivery, setDelivery]     = useState('nova_poshta');
  const [payment, setPayment]       = useState('liqpay');
  const [notes, setNotes]           = useState('');
  const [infoModal, setInfoModal]   = useState({ isOpen: false, title: '', type: '', src: '' });

  // --- Phone Formatting (Mask is handled by component internally) ---
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    const isDeletion = val.length < phone.length;
    
    let digits = val.replace(/\D/g, '');
    
    // Якщо це видалення і кількість цифр не змінилася (видалили тільки символ маски),
    // ми повинні примусово видалити останню цифру.
    if (isDeletion) {
      const prevDigits = phone.replace(/\D/g, '');
      if (digits === prevDigits && digits.length > 2) {
        digits = digits.slice(0, -1);
      }
    }

    const formatted = formatUaMasked(digits);
    setPhone(formatted);
    
    if (phoneRef.current) {
      phoneRef.current.setCustomValidity('');
    }
  };

  const handlePhoneFocus = () => {
    if (!phone || phone === '') {
      setPhone(formatUaMasked(''));
    }
  };

  // Підставляємо дані з профілю
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(formatUaMasked(profile.phone_ua || ''));
      setEmail(profile.email || '');
    } else if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  // Очищення адреси при зміні способу доставки
  useEffect(() => {
    setAddress('');
  }, [delivery]);

  // --- Форма: Збереження та відновлення з localStorage ---
  useEffect(() => {
    // Відновлення даних при завантаженні
    const savedName = localStorage.getItem('checkout_fullName');
    const savedPhone = localStorage.getItem('checkout_phone');
    const savedEmail = localStorage.getItem('checkout_email');
    const savedAddress = localStorage.getItem('checkout_address');
    const savedNotes = localStorage.getItem('checkout_notes');

    if (savedName && !fullName) setFullName(savedName);
    if (savedPhone && !phone) setPhone(savedPhone);
    if (savedEmail && !email) setEmail(savedEmail);
    if (savedAddress && !address) setAddress(savedAddress);
    if (savedNotes && !notes) setNotes(savedNotes);
  }, []);

  useEffect(() => {
    // Збереження даних при зміні
    localStorage.setItem('checkout_fullName', fullName);
    localStorage.setItem('checkout_phone', phone);
    localStorage.setItem('checkout_email', email);
    localStorage.setItem('checkout_address', address);
    localStorage.setItem('checkout_notes', notes || '');
  }, [fullName, phone, email, address, notes]);

  const clearFormStorage = () => {
    localStorage.removeItem('checkout_fullName');
    localStorage.removeItem('checkout_phone');
    localStorage.removeItem('checkout_email');
    localStorage.removeItem('checkout_address');
    localStorage.removeItem('checkout_notes');
  };

  // Показуємо AuthModal якщо не авторизований після завантаження
  // Авторизація тепер необов'язкова
  /* 
  useEffect(() => {
    if (!authLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [authLoading, user]);
  */

  const total = cartTotal ?? cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) { toast.error("Введіть ПІБ"); return; }
    if (!email.trim()) { toast.error("Введіть Email"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error("Введіть коректний Email"); return; }
    
    if (!isPhoneFull(phone)) {
      if (phoneRef.current) {
        phoneRef.current.setCustomValidity("Будь ласка, введіть повний номер телефону: +38 (0__) ___-__-__");
        phoneRef.current.reportValidity();
        phoneRef.current.focus();
      }
      return;
    }
    
    if (!address.trim() && delivery !== 'pickup') { toast.error("Введіть адресу доставки"); return; }
    if (cartItems.length === 0) { toast.error("Кошик порожній"); return; }

    setSubmitting(true);
    const loadingToast = toast.loading("Оформлюємо замовлення...");
    
    try {
      // Fallback для crypto.randomUUID()
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const newOrderId = generateUUID();
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        name:       item.name,
        sku:        item.sku || null,
        price:      item.price,
        qty:        item.quantity,
        size:       item.size,
        image_url:  item.image_url || item.image || null,
      }));

      console.log('Відправка замовлення в Supabase...', { 
        id: newOrderId, 
        user_id: user?.id || null,
        user_email: user?.email || 'guest'
      });

      console.log('[Checkout] Starting order submission...');
      const startTime = performance.now();

      const { data: newOrder, error } = await supabase.from('orders').insert({
        id:              newOrderId,
        user_id:         user?.id || null,
        status:          payment === 'liqpay' ? 'pending_payment' : 'new',
        total,
        items:           orderItems,
        full_name:       fullName.trim(),
        phone:           phone.trim(),
        email:           email.trim(),
        address:         address.trim(),
        delivery_method: delivery,
        payment_method:  payment,
        notes:           notes.trim() || null,
      }).select('order_number').single();

      const dbTime = performance.now();
      console.log(`[Checkout] DB Insert took ${(dbTime - startTime).toFixed(2)}ms`);

      if (error) {
        console.error('Детальна помилка Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      const shortId = newOrder?.order_number || '';

      // --- n8n Webhook (Immediate for non-liqpay, deferred for liqpay) ---
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn('n8n Webhook URL is not defined in environment variables. Webhook will not be sent.');
      }

      if (webhookUrl && payment !== 'liqpay') {
        // Відправляємо вебхук без очікування (неблокуюче), щоб пришвидшити редірект для Післяплати
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new_order',
            source: 'olivka-store-web',
            data: {
              id: newOrderId,
              order_number: newOrder?.order_number,
              user_id: user?.id || null,
              total,
              items: orderItems,
              full_name: fullName.trim(),
              phone: phone.trim(),
              email: email.trim(),
              address: address.trim(),
              delivery_method: delivery,
              payment_method: payment,
              notes: notes.trim() || null,
              created_at: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error('n8n Webhook Error:', err));
      }



      // --- Stock Management is now handled by DB Triggers ---

      // --- LiqPay Redirect ---
      if (payment === 'liqpay') {
        console.log('[Checkout] Preparing LiqPay payment...');
        const lpStartTime = performance.now();
        
        const prepRes = await fetch('/api/payment/prepare-liqpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: newOrderId,
            amount: total,
            description: `Оплата замовлення №${shortId} в Store Olivka`
          })
        });
        
        const lpEndTime = performance.now();
        console.log(`[Checkout] LiqPay preparation took ${(lpEndTime - lpStartTime).toFixed(2)}ms`);
        
        const resData = await prepRes.json();

        if (!prepRes.ok) {
          throw new Error(resData.error || 'Помилка при підготовці платежу');
        }
        
        const { data: lpData, signature: lpSignature } = resData;
        
        if (lpData && lpSignature) {
          // REMOVED clearCart() here - we clear only after success callback or on success page
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = 'https://www.liqpay.ua/api/3/checkout';
          
          const inputData = document.createElement('input');
          inputData.type = 'hidden';
          inputData.name = 'data';
          inputData.value = lpData;
          form.appendChild(inputData);
          
          const inputSig = document.createElement('input');
          inputSig.type = 'hidden';
          inputSig.name = 'signature';
          inputSig.value = lpSignature;
          form.appendChild(inputSig);
          
          document.body.appendChild(form);
          
          // Очищаємо localStorage безпосередньо перед переходом на LiqPay
          clearFormStorage();
          
          form.submit();
          return;
        }
      }

      toast.dismiss(loadingToast);
      toast.success(`✅ Замовлення №${shortId} прийнято!`, { duration: 5000 });
      
      // Очищення даних форми з localStorage після успішного оформлення
      clearFormStorage();
      
      // Перенаправлення на сторінку успіху для всіх користувачів (щоб бачили реквізити для COD)
      router.push(`/payment/success?order_id=${newOrderId}&orderNo=${newOrder?.order_number || ''}&method=cod`);
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Помилка замовлення:', err);
      toast.error('Помилка при оформленні. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  }

  // Порожній кошик (тепер для всіх, включаючи гостей)
  if (!authLoading && cartItems.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'var(--font-sans)' }}>
        <ShoppingBag size={48} color="rgba(82,79,37,0.25)" />
        <p style={{ color: 'rgba(82,79,37,0.45)', fontSize: '1rem' }}>Кошик порожній</p>
        <Link href="/catalog" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* AuthModal для неавторизованих */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          // Не перенаправляємо на головну, щоб дозволити гостьове оформлення
        }}
        onSuccess={() => setAuthModalOpen(false)}
        initialMode="register"
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ paddingBottom: '6rem', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}
      >
        {/* Шапка */}
        <div style={{
          background: 'linear-gradient(135deg, #f5f2e9 0%, #eae6d8 100%)',
          padding: '3rem 2rem 2rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(82,79,37,0.08)',
        }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(82,79,37,0.4)', marginBottom: '0.5rem' }}>
            Store Olivka
          </p>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: '#524f25', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
            Оформлення замовлення
          </h1>
        </div>

        <div className="container checkout-container">
          <form onSubmit={handleSubmit}>
            <div className="checkout-grid">

              {/* 1. Ваше замовлення (Summary) */}
              <div className="checkout-summary-section">
                <div style={{
                  background: 'white', borderRadius: '20px',
                  border: '1px solid rgba(82,79,37,0.07)',
                  boxShadow: '0 4px 20px rgba(82,79,37,0.05)',
                  overflow: 'hidden',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(82,79,37,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#524f25' }}>
                      <Package size={18} />
                      <span style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
                        ПІДСУМОК ЗАМОВЛЕННЯ
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {cartItems.map((item, idx) => (
                      <div key={`${item.id}-${item.size}-${idx}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {(item.image_url || item.image) && (
                          <div style={{ position: 'relative', width: '56px', height: '68px', flexShrink: 0 }}>
                            <Image
                              src={item.image_url || item.image}
                              alt={item.name}
                              fill
                              style={{ objectFit: 'cover', borderRadius: '8px', background: '#f5f2e9' }}
                              sizes="56px"
                            />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#524f25', lineHeight: 1.3 }}>
                            {item.name}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'rgba(82,79,37,0.5)' }}>
                            {item.size && `Розмір: ${item.size} · `}{item.quantity} шт.
                          </p>
                          {item.sku && (
                            <p style={{ margin: '0.1rem 0 0', fontSize: '0.65rem', color: 'rgba(82,79,37,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Артикул: {item.sku}
                            </p>
                          )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#524f25', flexShrink: 0, fontSize: '0.9rem' }}>
                          {item.price * item.quantity} грн
                        </p>
                      </div>
                    ))}
                  </div>

                    <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(82,79,37,0.08)', background: '#faf9f6' }}>
                      {/* Dynamic Delivery Message */}
                      <div style={{ 
                        marginBottom: '0.5rem', 
                        fontSize: '0.85rem', 
                        fontWeight: 500, 
                        color: total >= 2500 ? '#2e7d32' : '#c4a882'
                      }}>
                        {total >= 2500 ? 'Доставка безкоштовна' : 'Безкоштовна доставка на суму від 2500 грн'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 600, color: '#524f25' }}>
                        <span>Разом</span>
                        <span>{total} грн</span>
                      </div>
                    </div>
                </div>
              </div>

              {/* ── Основні дані (Ліва частина в десктопі) ── */}
              <div className="checkout-form-sections">

                {/* 2. Контактні дані */}
                <CheckoutCard icon={<User size={18} />} title="Контактні дані">
                  <div style={{ display: 'grid', gap: '0.875rem' }}>
                    <CheckoutInput
                      label="ПІБ"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Іваненко Іван Іванович"
                      required
                    />
                    <CheckoutInput
                      label="Телефон"
                      value={phone}
                      onChange={handlePhoneChange}
                      onFocus={handlePhoneFocus}
                      onClear={() => setPhone(formatUaMasked(''))}
                      placeholder="+38 (0__) ___-__-__"
                      type="tel"
                      required
                      ref={phoneRef}
                    />
                    <CheckoutInput
                      label="Email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      type="email"
                      required
                    />
                  </div>
                </CheckoutCard>

                {/* 3. Спосіб доставки */}
                <CheckoutCard icon={<Truck size={18} />} title="Спосіб доставки">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {DELIVERY_OPTIONS.map(opt => (
                      <label key={opt.id} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.875rem 1rem',
                        border: `1.5px solid ${delivery === opt.id ? '#524f25' : 'rgba(82,79,37,0.12)'}`,
                        borderRadius: '12px', cursor: 'pointer',
                        background: delivery === opt.id ? 'rgba(82,79,37,0.04)' : 'transparent',
                        transition: 'all 0.2s',
                      }}>
                        <input type="radio" name="delivery" value={opt.id} checked={delivery === opt.id}
                          onChange={() => setDelivery(opt.id)} style={{ accentColor: '#524f25' }} />
                        <div style={{ width: '36px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                          {opt.icon}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500, color: '#524f25', fontSize: '0.9rem' }}>{opt.label}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(82,79,37,0.45)' }}>{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CheckoutCard>

                {/* 4. Відділення — залежно від способу доставки */}
                {delivery === 'nova_poshta' && (
                  <CheckoutCard icon={<MapPin size={18} />} title="Відділення / Поштомат">
                    <NovaPoshtaSelector
                      value={address}
                      onChange={setAddress}
                    />
                  </CheckoutCard>
                )}

                {delivery === 'ukrposhta' && (
                  <CheckoutCard icon={<MapPin size={18} />} title="Відділення Укрпошти">
                    <UkrPoshtaSelector
                      value={address}
                      onChange={setAddress}
                    />
                  </CheckoutCard>
                )}

                {/* 5. Спосіб оплати */}
                <CheckoutCard icon={<CreditCard size={18} />} title="Спосіб оплати">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {PAYMENT_OPTIONS.map(opt => (
                      <div key={opt.id}>
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '0.875rem 1rem',
                          border: `1.5px solid ${payment === opt.id ? '#524f25' : 'rgba(82,79,37,0.12)'}`,
                          borderRadius: '12px',
                          cursor: opt.disabled ? 'not-allowed' : 'pointer',
                          opacity: opt.disabled ? 0.5 : 1,
                          background: payment === opt.id ? 'white' : 'transparent',
                          boxShadow: payment === opt.id ? '0 4px 12px rgba(82,79,37,0.08)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${payment === opt.id ? '#524f25' : 'rgba(82,79,37,0.2)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}>
                            {payment === opt.id && (
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#524f25' }} />
                            )}
                          </div>
                          
                          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{opt.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ 
                              margin: 0, 
                              fontWeight: 600, 
                              color: '#524f25', 
                              fontSize: '0.875rem', 
                              letterSpacing: '-0.01em',
                              wordBreak: 'break-word'
                            }}>{opt.label}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(82,79,37,0.5)' }}>{opt.desc}</p>
                          </div>
                          
                          {payment === opt.id && (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                              <ShieldCheck size={18} color="#524f25" style={{ opacity: 0.6 }} />
                            </motion.div>
                          )}
                          
                          <input type="radio" name="payment" value={opt.id} checked={payment === opt.id}
                            disabled={opt.disabled}
                            onChange={() => !opt.disabled && setPayment(opt.id)}
                            style={{ display: 'none' }} />
                        </label>

                        {/* Inline Payment Options for LiqPay */}
                        {payment === 'liqpay' && opt.id === 'liqpay' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ 
                              padding: '1.25rem', 
                              marginTop: '0.5rem', 
                              background: '#fcfbf7', 
                              borderRadius: '12px', 
                              border: '1px solid rgba(82,79,37,0.08)', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '1.2rem' 
                            }}>
                                <p style={{ fontSize: '0.85rem', color: '#524f25', lineHeight: '1.4', margin: 0 }}>
                                  Вас буде перенаправлено на захищену сторінку <strong>LiqPay</strong> для завершення оплати. Це найшвидший та найбезпечніший спосіб отримати ваше замовлення.
                                </p>

                                {/* Payment Methods Group */}
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column',
                                  gap: '1rem'
                                }}>


                                  {/* Trust Logos Grid */}
                                  <div style={{ 
                                    display: 'flex', 
                                    width: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'clamp(2px, 1.2vw, 8px)',
                                    padding: '0'
                                  }}>

                                    {/* Visa */}
                                    <div style={{ 
                                      flex: '1 1 40px', 
                                      maxWidth: '54px', 
                                      aspectRatio: '54/34',
                                      background: 'white', 
                                      borderRadius: '6px', 
                                      border: '1px solid rgba(82,79,37,0.12)', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      overflow: 'hidden', 
                                      boxShadow: '0 1px 3px rgba(82,79,37,0.03)' 
                                    }}>

                                      <svg width="100%" height="100%" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="120" height="80" rx="4" fill="white"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M86.6666 44.9375L90.3239 35.0625L92.3809 44.9375H86.6666ZM100.952 52.8375L95.8086 27.1625H88.7383C86.3525 27.1625 85.7723 29.0759 85.7723 29.0759L76.1904 52.8375H82.8868L84.2269 49.0244H92.3947L93.1479 52.8375H100.952Z" fill="#1434CB"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M77.1866 33.5711L78.0952 28.244C78.0952 28.244 75.2896 27.1625 72.3648 27.1625C69.2031 27.1625 61.6955 28.5638 61.6955 35.3738C61.6955 41.7825 70.5071 41.8621 70.5071 45.2266C70.5071 48.5912 62.6034 47.9901 59.9955 45.8676L59.0476 51.4362C59.0476 51.4362 61.8919 52.8375 66.2397 52.8375C70.5869 52.8375 77.1467 50.5544 77.1467 44.3455C77.1467 37.8964 68.2552 37.296 68.2552 34.4921C68.2552 31.6882 74.4602 32.0484 77.1866 33.5711Z" fill="#1434CB"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M54.6517 52.8375H47.6191L52.0144 27.1625H59.0477L54.6517 52.8375Z" fill="#1434CB"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M42.3113 27.1625L35.9217 44.8213L35.1663 41.0185L35.167 41.0199L32.9114 29.4749C32.9114 29.4749 32.6394 27.1625 29.7324 27.1625H19.1709L19.0476 27.5966C19.0476 27.5966 22.2782 28.2669 26.057 30.5326L31.8793 52.8375H38.8617L49.5238 27.1625H42.3113Z" fill="#1434CB"/>
                                      </svg>
                                    </div>

                                    {/* Mastercard */}
                                    <div style={{ 
                                      flex: '1 1 40px', 
                                      maxWidth: '54px', 
                                      aspectRatio: '54/34',
                                      background: 'white', 
                                      borderRadius: '6px', 
                                      border: '1px solid rgba(82,79,37,0.12)', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      overflow: 'hidden', 
                                      boxShadow: '0 1px 3px rgba(82,79,37,0.03)' 
                                    }}>

                                      <svg width="100%" height="100%" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="120" height="80" rx="4" fill="white"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M97.5288 54.6562V53.7384H97.289L97.0137 54.3698L96.7378 53.7384H96.498V54.6562H96.6675V53.9637L96.9257 54.5609H97.1011L97.36 53.9624V54.6562H97.5288ZM96.0111 54.6562V53.8947H96.318V53.7397H95.5361V53.8947H95.843V54.6562H96.0111Z" fill="#F79E1B"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M49.6521 58.595H70.3479V21.4044H49.6521V58.595Z" fill="#FF5F00"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M98.2675 40.0003C98.2675 53.063 87.6791 63.652 74.6171 63.652C69.0996 63.652 64.0229 61.7624 60 58.5956C65.5011 54.2646 69.0339 47.5448 69.0339 40.0003C69.0339 32.4552 65.5011 25.7354 60 21.4044C64.0229 18.2376 69.0996 16.348 74.6171 16.348C87.6791 16.348 98.2675 26.937 98.2675 40.0003Z" fill="#F79E1B"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M50.966 40.0003C50.966 32.4552 54.4988 25.7354 59.9999 21.4044C55.977 18.2376 50.9003 16.348 45.3828 16.348C32.3208 16.348 21.7324 26.937 21.7324 40.0003C21.7324 53.063 32.3208 63.652 45.3828 63.652C50.9003 63.652 55.977 61.7624 59.9999 58.5956C54.4988 54.2646 50.966 47.5448 50.966 40.0003Z" fill="#EB001B"/>
                                      </svg>
                                    </div>

                                    {/* PrivatPay Symbol */}
                                    <div style={{ 
                                      flex: '1 1 40px', 
                                      maxWidth: '54px', 
                                      aspectRatio: '54/34',
                                      background: 'white', 
                                      borderRadius: '6px', 
                                      border: '1px solid rgba(82,79,37,0.12)', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      overflow: 'hidden', 
                                      boxShadow: '0 1px 3px rgba(82,79,37,0.03)' 
                                    }}>
                                      <svg width="100%" height="100%" viewBox="0 0 102 65" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ padding: '2px' }}>
                                        <path d="M92.8155 2.16479L93.8453 2.16663C94.1237 2.16847 94.4027 2.17154 94.683 2.1795C95.1708 2.19237 95.7417 2.21873 96.2738 2.31373C96.7358 2.39647 97.1238 2.52272 97.4958 2.71088C97.8635 2.89658 98.1998 3.14051 98.4936 3.43224C98.7886 3.72643 99.0337 4.06168 99.2228 4.43125C99.4113 4.79898 99.5369 5.18265 99.6201 5.64599C99.7149 6.17001 99.7414 6.73938 99.7543 7.22785C99.7623 7.50303 99.766 7.77883 99.7672 8.06137C99.7697 8.40275 99.7697 8.74352 99.7697 9.08551V55.8598C99.7697 56.2018 99.7697 56.5425 99.7672 56.8906C99.766 57.1664 99.7623 57.4422 99.7543 57.7186C99.7414 58.2059 99.7149 58.7753 99.6188 59.3048C99.5369 59.762 99.4113 60.1457 99.2216 60.5153C99.0331 60.8842 98.7886 61.2188 98.4948 61.5112C98.1992 61.8054 97.8641 62.0481 97.4921 62.2356C97.1226 62.4232 96.7358 62.5494 96.2782 62.6309C95.7349 62.7272 95.1406 62.7541 94.6928 62.7658C94.4114 62.7725 94.1311 62.7762 93.8435 62.7774C93.5017 62.7799 93.158 62.7799 92.8155 62.7799H9.12964C9.12533 62.7799 9.12102 62.7799 9.11609 62.7799C8.77796 62.7799 8.4386 62.7799 8.09431 62.7774C7.81346 62.7762 7.53322 62.7725 7.26222 62.7664C6.80399 62.7541 6.20903 62.7272 5.67073 62.6315C5.2088 62.5494 4.82201 62.4232 4.44754 62.2332C4.07923 62.0475 3.74418 61.8048 3.44855 61.51C3.15538 61.2188 2.91148 60.8848 2.72301 60.5153C2.53393 60.1463 2.40767 59.7614 2.32452 59.2987C2.22906 58.7698 2.20258 58.2034 2.18903 57.7186C2.18164 57.4416 2.17856 57.164 2.17671 56.8888L2.17548 56.0749V8.871L2.17671 8.05892C2.17856 7.78129 2.18164 7.50426 2.18903 7.22724C2.20258 6.74183 2.22906 6.17491 2.32576 5.6417C2.40767 5.18387 2.53393 4.79837 2.72363 4.42757C2.91086 4.06107 3.15538 3.72643 3.44978 3.43347C3.74357 3.14051 4.08047 2.89781 4.45062 2.71026C4.82078 2.52211 5.2088 2.39647 5.67073 2.31373C6.20287 2.21873 6.77381 2.19237 7.26284 2.1795C7.54123 2.17154 7.82023 2.16847 8.09677 2.16663L9.12964 2.16479H92.8155" fill="#FFFFFE"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M56.2674 34.6589V41.0219H53.28V23.897H59.8571C61.7779 23.897 63.3031 24.3949 64.4327 25.3907C65.5624 26.3865 66.1272 27.7038 66.1272 29.3426C66.1272 31.0206 65.5742 32.3261 64.4681 33.2592C63.3621 34.1923 61.8133 34.6589 59.8217 34.6589H56.2674ZM56.181 32.15H59.7589C60.8181 32.15 61.6263 31.9007 62.1834 31.402C62.7405 30.9034 63.019 30.183 63.019 29.2407C63.019 28.3141 62.7365 27.5741 62.1716 27.0205C61.6067 26.4669 60.8299 26.1823 59.8412 26.1666H56.181V32.15ZM75.5044 39.8042C75.599 40.3534 75.7093 40.7496 75.8354 40.9928H78.7672V40.7928C78.4441 40.1102 78.2825 39.1961 78.2825 38.0506V32.3074C78.2589 30.95 77.8018 29.8967 76.9112 29.1474C76.0206 28.3981 74.8266 28.0235 73.3292 28.0235C72.3441 28.0235 71.4516 28.1961 70.6516 28.5413C69.8517 28.8865 69.2192 29.3632 68.7543 29.9712C68.2893 30.5793 68.0568 31.2325 68.0568 31.9308H70.9294C70.9294 31.4286 71.1383 31.0147 71.556 30.6891C71.9737 30.3635 72.5096 30.2007 73.1637 30.2007C73.9203 30.2007 74.4838 30.3988 74.8542 30.795C75.2246 31.1913 75.4098 31.7189 75.4098 32.378V33.2136H73.6484C71.7648 33.2136 70.3167 33.5764 69.304 34.3022C68.2912 35.028 67.7849 36.0695 67.7849 37.4269C67.7849 38.5018 68.1908 39.404 69.0025 40.1337C69.8143 40.8634 70.8624 41.2282 72.1471 41.2282C73.4711 41.2282 74.5902 40.7535 75.5044 39.8042ZM72.7132 38.9586C73.2822 38.9586 73.8177 38.8213 74.3196 38.5466C74.8215 38.2719 75.1989 37.9031 75.4518 37.44V35.0385H73.8987C72.8317 35.0385 72.0295 35.2229 71.492 35.5918C70.9546 35.9606 70.6859 36.4825 70.6859 37.1575C70.6859 37.7069 70.8696 38.1444 71.2371 38.4701C71.6047 38.7958 72.0967 38.9586 72.7132 38.9586ZM88.1569 28.2298L85.5721 36.9036L82.8815 28.2298H79.8032L84.2679 40.9568L83.8567 42.0558C83.6452 42.6782 83.3574 43.1214 82.9932 43.3853C82.6289 43.6492 82.0865 43.7811 81.3659 43.7811L80.8254 43.7457V45.9673C81.3267 46.1091 81.7849 46.18 82.2001 46.18C84.0565 46.18 85.3724 45.1047 86.1478 42.9539L91.2 28.2298H88.1569Z" fill="#212121"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M36.96 33.689V35.4704H35.387V38.2354H33.5816V35.4704H28.5315V33.8174L28.578 33.6697L33.6545 26.3984L33.8691 26.2869H35.387V33.689H36.96ZM27.4769 36.4465V38.2354H19.44L19.4553 37.9618C19.5889 35.5698 20.418 34.5584 23.0011 32.9518C22.9982 32.9536 23.4527 32.6707 23.583 32.588C25.0084 31.6823 25.6226 30.9763 25.6226 29.8978C25.6226 28.7676 24.8297 27.9973 23.6597 27.9973C22.3066 27.9973 21.6106 29.0189 21.5725 30.6139L21.5665 30.8669H19.7872L19.7751 30.6203L19.7597 30.3013C19.7597 27.903 21.3538 26.2869 23.7237 26.2869C26.0409 26.2869 27.5748 27.7045 27.5748 29.8679C27.5748 31.8415 26.6349 32.8126 24.0048 34.3947L23.9524 34.4258L23.7821 34.5263C23.6882 34.5816 23.5848 34.6425 23.5434 34.6671C22.472 35.3035 21.9172 35.7797 21.6571 36.4465H27.4769ZM33.5817 33.6852H30.6532L33.5817 29.3711V33.6852Z" fill="black" fillOpacity="0.87"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M10.8 32.5C10.8 22.8705 18.6489 15.0552 28.32 15.0552C37.991 15.0552 45.84 22.8705 45.84 32.5C45.84 42.1296 37.991 49.9449 28.32 49.9449C18.6489 49.9449 10.8 42.1296 10.8 32.5ZM13.0248 32.5C13.0248 40.8954 19.8885 47.7297 28.32 47.7297C36.7515 47.7297 43.6152 40.8954 43.6152 32.5C43.6152 24.1047 36.7515 17.2704 28.32 17.2704C19.8885 17.2704 13.0248 24.1047 13.0248 32.5Z" fill="#8DC641"/>
                                      </svg>
                                    </div>

                                    {/* Apple Pay */}
                                    <div style={{ 
                                      flex: '1 1 40px', 
                                      maxWidth: '54px', 
                                      aspectRatio: '54/34',
                                      background: 'white', 
                                      borderRadius: '6px', 
                                      border: '1px solid rgba(82,79,37,0.12)', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      overflow: 'hidden', 
                                      boxShadow: '0 1px 3px rgba(82,79,37,0.03)' 
                                    }}>

                                      <svg width="100%" height="100%" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="1.375" y="1.375" width="117.25" height="77.25" rx="6.625" fill="white"/>
                                        <path d="M55.5533 22.9046C61.103 22.9046 64.9675 26.7301 64.9675 32.2997C64.9675 37.8892 61.0235 41.7345 55.4142 41.7345H49.2696V51.5062H44.8301V22.9046L55.5533 22.9046ZM49.2695 38.0081H54.3635C58.2288 38.0081 60.4286 35.9271 60.4286 32.3196C60.4286 28.7124 58.2288 26.6509 54.3834 26.6509H49.2695V38.0081Z" fill="black"/>
                                        <path d="M66.1274 45.5799C66.1274 41.9326 68.9222 39.6929 73.8778 39.4154L79.5858 39.0786V37.4732C79.5858 35.1541 78.0198 33.7666 75.404 33.7666C72.9258 33.7666 71.3797 34.9556 71.0035 36.8191H66.9601C67.1979 33.0528 70.4086 30.278 75.5623 30.278C80.6165 30.278 83.8471 32.9538 83.8471 37.136V51.5062H79.7441V48.0772H79.6454C78.4365 50.3963 75.8001 51.8629 73.065 51.8629C68.9818 51.8629 66.1274 49.3258 66.1274 45.5799ZM79.5858 43.697V42.0518L74.452 42.3688C71.8951 42.5473 70.4484 43.6771 70.4484 45.461C70.4484 47.2842 71.9547 48.4736 74.254 48.4736C77.2468 48.4736 79.5858 46.4122 79.5858 43.697Z" fill="black"/>
                                        <path d="M87.7206 59.177V55.7082C88.0372 55.7874 88.7506 55.7874 89.1077 55.7874C91.0896 55.7874 92.1601 54.9551 92.8139 52.8145C92.8139 52.7747 93.1908 51.5459 93.1908 51.5261L85.6592 30.6546H90.2967L95.5696 47.6214H95.6484L100.921 30.6546H105.44L97.6303 52.5962C95.8472 57.6508 93.7857 59.276 89.4648 59.276C89.1077 59.276 88.0372 59.2363 87.7206 59.177Z" fill="black"/>
                                        <path d="M31.7358 25.6955C32.8058 24.3572 33.5319 22.5603 33.3404 20.724C31.7741 20.8019 29.8627 21.7573 28.7562 23.0967C27.7626 24.2436 26.8832 26.1158 27.1124 27.8751C28.8707 28.0276 30.6273 26.9962 31.7358 25.6955Z" fill="black"/>
                                        <path d="M33.3204 28.2186C30.7671 28.0665 28.5961 29.6678 27.3767 29.6678C26.1567 29.6678 24.2894 28.2952 22.2698 28.3322C19.6412 28.3708 17.2022 29.8571 15.8682 32.2209C13.1246 36.9497 15.1442 43.9642 17.8122 47.8155C19.1079 49.7209 20.6694 51.8189 22.7269 51.7435C24.6709 51.6672 25.4328 50.4847 27.7958 50.4847C30.1571 50.4847 30.8435 51.7435 32.9013 51.7054C35.0353 51.6672 36.3695 49.799 37.6651 47.8918C39.1515 45.7198 39.7599 43.6225 39.7982 43.5073C39.7599 43.4692 35.6832 41.9053 35.6454 37.2158C35.6069 33.2892 38.8461 31.4215 38.9985 31.3057C37.1694 28.6003 34.3113 28.2952 33.3204 28.2186Z" fill="black"/>
                                      </svg>
                                    </div>

                                    {/* Google Pay */}
                                    <div style={{ 
                                      flex: '1 1 40px', 
                                      maxWidth: '54px', 
                                      aspectRatio: '54/34',
                                      background: 'white', 
                                      borderRadius: '6px', 
                                      border: '1px solid rgba(82,79,37,0.12)', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      overflow: 'hidden', 
                                      boxShadow: '0 1px 3px rgba(82,79,37,0.03)' 
                                    }}>
                                      <svg width="100%" height="100%" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="120" height="80" rx="4" fill="white"/>
                                        <path d="M57.5437 26.997V35.9796H63.0833C64.4033 35.9796 65.4945 35.5352 66.3569 34.6486C67.2435 33.7642 67.6879 32.7082 67.6879 31.4872C67.6879 30.2904 67.2435 29.2476 66.3569 28.3588C65.4945 27.4502 64.4033 26.9948 63.0833 26.9948H57.5437V26.997ZM57.5437 39.141V49.5602H54.2349V23.8356H63.0129C65.2415 23.8356 67.1335 24.577 68.6933 26.062C70.2773 27.547 71.0693 29.3554 71.0693 31.4872C71.0693 33.6674 70.2773 35.489 68.6933 36.9476C67.1599 38.4106 65.2635 39.1388 63.0107 39.1388H57.5437V39.141ZM74.4133 44.1724C74.4133 45.0348 74.7785 45.752 75.5111 46.3284C76.2415 46.9004 77.0995 47.1886 78.0807 47.1886C79.4733 47.1886 80.7119 46.6738 81.8031 45.6464C82.8965 44.6146 83.4399 43.4046 83.4399 42.0164C82.4081 41.2024 80.9693 40.7954 79.1235 40.7954C77.7815 40.7954 76.6595 41.121 75.7619 41.7678C74.8621 42.4146 74.4133 43.2132 74.4133 44.1724ZM78.6945 31.3794C81.1409 31.3794 83.0703 32.0328 84.4871 33.3374C85.8995 34.6442 86.6079 36.435 86.6079 38.7098V49.5602H83.4421V47.1182H83.2991C81.9307 49.129 80.1091 50.1366 77.8299 50.1366C75.8895 50.1366 74.2637 49.5602 72.9569 48.4118C71.6501 47.2612 70.9967 45.8246 70.9967 44.0998C70.9967 42.2782 71.6853 40.8306 73.0647 39.7526C74.4441 38.6746 76.2833 38.1356 78.5867 38.1356C80.5491 38.1356 82.1705 38.4942 83.4399 39.2136V38.4568C83.4399 37.3084 82.9845 36.3316 82.0737 35.5308C81.1961 34.7411 80.0531 34.3114 78.8727 34.3274C77.0247 34.3274 75.5639 35.104 74.4837 36.6638L71.5709 34.829C73.1769 32.53 75.5529 31.3794 78.6945 31.3794ZM104.771 31.9558L93.7271 57.3218H90.3105L94.4113 48.447L87.1469 31.9558H90.7439L95.9953 44.6036H96.0657L101.174 31.9536L104.771 31.9558Z" fill="#3C4043"/>
                                        <path d="M44.1722 36.8948C44.1722 35.8542 44.0842 34.8488 43.917 33.8896H29.9602V39.5832H37.955C37.6239 41.4215 36.5557 43.0445 34.9982 44.0756V47.7716H39.77C42.564 45.1976 44.1722 41.3916 44.1722 36.8948Z" fill="#4285F4"/>
                                        <path d="M29.9603 51.34C33.9555 51.34 37.3171 50.031 39.7701 47.7738L34.9983 44.0756C33.6717 44.9688 31.9623 45.4902 29.9603 45.4902C26.1015 45.4902 22.8235 42.8898 21.6531 39.3874H16.7383V43.1956C19.2527 48.1909 24.3678 51.3425 29.9603 51.3422" fill="#34A853"/>
                                        <path d="M21.6529 39.3874C21.0355 37.5518 21.0355 35.5646 21.6529 33.729V29.9208H16.7381C15.6991 31.9782 15.1587 34.2512 15.1606 36.556C15.1606 38.943 15.7327 41.198 16.7381 43.1934L21.6529 39.3852V39.3874Z" fill="#FABB05"/>
                                        <path d="M29.96 27.6262C32.1424 27.6262 34.096 28.3742 35.636 29.8438V29.846L39.86 25.6264C37.2992 23.2416 33.9552 21.7764 29.9622 21.7764C24.3703 21.7757 19.2553 24.9264 16.7402 29.9208L21.655 33.729C22.8254 30.2266 26.1034 27.6262 29.9622 27.6262" fill="#E94235"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem', 
                                  paddingTop: '0.8rem', 
                                  borderTop: '1px dashed rgba(82,79,37,0.15)',
                                  color: 'rgba(82,79,37,0.6)',
                                  fontSize: '0.75rem'
                                }}>
                                  <Lock size={12} />
                                  <span>Безпечний платіж за стандартом PCI DSS</span>
                                </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Inline Payment Info for Cash on Delivery */}
                        {payment === 'cash_on_delivery' && opt.id === 'cash_on_delivery' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ 
                              padding: '1.25rem', 
                              marginTop: '0.5rem', 
                              background: '#fcfbf7', 
                              borderRadius: '12px', 
                              border: '1px solid rgba(82,79,37,0.08)',
                            }}>
                                <p style={{ fontSize: '0.85rem', color: '#524f25', lineHeight: '1.5', margin: 0 }}>
                                  Реквізити для оплати авансу зʼявляться одразу після натискання «Підтвердити замовлення». Ми також продублюємо їх вам на e-mail.
                                </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </CheckoutCard>

                {/* 6. Кнопка "Підтвердити замовлення" (мобілка) */}
                <div className="mobile-submit-container" style={{ margin: '1rem 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                      style={{
                        width: '100%', padding: '1.25rem',
                        fontSize: '1rem', letterSpacing: '0.08em',
                        opacity: submitting ? 0.6 : 1,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(82,79,37,0.2)'
                      }}
                    >
                      {submitting ? 'Оформлюємо...' : (<>Підтвердити замовлення <ChevronRight size={18} /></>)}
                    </button>

                    {/* Legal Notice Mobile */}
                    <div style={{ padding: '0 0.5rem', fontSize: '0.78rem', color: 'rgba(82,79,37,0.6)', lineHeight: 1.4 }}>
                      <p style={{ margin: '0 0 0.4rem 0' }}>Підтверджуючи замовлення, я приймаю умови:</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'rgba(82,79,37,0.4)' }}>•</span>
                          <button 
                            type="button"
                            onClick={() => setInfoModal({ isOpen: true, title: 'Про обробку та захист персональних даних', type: 'pdf', src: '/docs/personaldata.pdf' })}
                            style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                          >положення про обробку і захист персональних даних</button>
                        </li>
                        <li style={{ display: 'flex', gap: '0.5rem' }}>
                          <span style={{ color: 'rgba(82,79,37,0.4)' }}>•</span>
                          <button 
                            type="button"
                            onClick={() => setInfoModal({ isOpen: true, title: 'Публічна оферта', type: 'pdf', src: '/docs/oferta.pdf' })}
                            style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                          >угоди користувача</button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 7. Коментар */}
                <CheckoutCard icon={<FileText size={18} />} title="Коментар до замовлення">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Необов'язково. Будь-які побажання до замовлення..."
                    rows={3}
                    style={{
                      width: '100%', resize: 'vertical',
                      border: '1px solid rgba(82,79,37,0.15)', borderRadius: '10px',
                      padding: '0.75rem 1rem', fontFamily: 'var(--font-sans)',
                      fontSize: '0.9rem', color: '#524f25',
                      background: 'rgba(255,255,255,0.7)', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#524f25'}
                    onBlur={e => e.target.style.borderColor = 'rgba(82,79,37,0.15)'}
                  />
                </CheckoutCard>

              </div>

              {/* Права колонка (ДЕКСТОП ТІЛЬКИ) */}
              <div className="desktop-summary-column">
                <div style={{ position: 'sticky', top: '2rem' }}>
                  {/* Перенесена кнопка підтвердження для десктопа всередині підсумку */}
                  <div style={{
                    background: 'white', borderRadius: '20px',
                    border: '1px solid rgba(82,79,37,0.07)',
                    boxShadow: '0 4px 20px rgba(82,79,37,0.05)',
                    overflow: 'hidden',
                  }}>
                     {/* Копія підсумку для десктопа */}
                      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(82,79,37,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#524f25' }}>
                          <Package size={18} />
                          <span style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
                            ПІДСУМОК ЗАМОВЛЕННЯ
                          </span>
                        </div>
                      </div>

                      {/* Список товарів (Десктоп) */}
                      <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '40vh', overflowY: 'auto' }} className="custom-scrollbar-minimal">
                        {cartItems.map((item, idx) => (
                          <div key={`${item.id}-${item.size}-${idx}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {(item.image_url || item.image) && (
                              <img
                                src={item.image_url || item.image}
                                alt={item.name}
                                style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '6px', background: '#f5f2e9', flexShrink: 0 }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: '#524f25', lineHeight: 1.2 }}>
                                {item.name}
                              </p>
                              <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'rgba(82,79,37,0.5)' }}>
                                {item.quantity} шт. {item.size && `· ${item.size}`}
                              </p>
                              {item.sku && (
                                <p style={{ margin: '0.05rem 0 0', fontSize: '0.6rem', color: 'rgba(82,79,37,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Артикул: {item.sku}
                                </p>
                              )}
                            </div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#524f25', flexShrink: 0, fontSize: '0.85rem' }}>
                              {item.price * item.quantity}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '1rem 1.5rem 1.5rem', background: '#faf9f6' }}>
                        {/* Dynamic Delivery Message for Desktop */}
                        <div style={{ 
                          marginBottom: '0.5rem', 
                          fontSize: '0.85rem', 
                          fontWeight: 500, 
                          color: total >= 2500 ? '#2e7d32' : '#c4a882'
                        }}>
                          {total >= 2500 ? 'Доставка безкоштовна' : 'Безкоштовна доставка на суму від 2500 грн'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 600, color: '#524f25', marginBottom: '1.5rem' }}>
                          <span>До сплати</span>
                          <span>{total} грн</span>
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn btn-primary"
                          style={{
                            width: '100%', padding: '1rem',
                            fontSize: '0.9rem', letterSpacing: '0.08em',
                            opacity: submitting ? 0.6 : 1,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            marginBottom: '1rem'
                          }}
                        >
                          {submitting ? 'Оформлюємо...' : (<>Підтвердити замовлення <ChevronRight size={16} /></>)}
                        </button>

                        {/* Legal Notice Desktop */}
                        <div style={{ fontSize: '0.72rem', color: 'rgba(82,79,37,0.5)', lineHeight: 1.4 }}>
                          <p style={{ margin: '0 0 0.3rem 0' }}>Підтверджуючи замовлення, я приймаю умови:</p>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            <li style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.2rem' }}>
                              <span style={{ color: 'rgba(82,79,37,0.3)' }}>•</span>
                              <button 
                                type="button"
                                onClick={() => setInfoModal({ isOpen: true, title: 'Про обробку та захист персональних даних', type: 'pdf', src: '/docs/personaldata.pdf' })}
                                style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                              >положення про обробку і захист персональних даних</button>
                            </li>
                            <li style={{ display: 'flex', gap: '0.4rem' }}>
                              <span style={{ color: 'rgba(82,79,37,0.3)' }}>•</span>
                              <button 
                                type="button"
                                onClick={() => setInfoModal({ isOpen: true, title: 'Публічна оферта', type: 'pdf', src: '/docs/oferta.pdf' })}
                                style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
                              >угоди користувача</button>
                            </li>
                          </ul>
                        </div>
                      </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </motion.main>

      <InfoModal 
        isOpen={infoModal.isOpen} 
        onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
        title={infoModal.title}
        type={infoModal.type}
        src={infoModal.src}
      />
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CheckoutCard({ icon, title, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: '20px',
      border: '1px solid rgba(82,79,37,0.07)',
      boxShadow: '0 4px 20px rgba(82,79,37,0.05)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(82,79,37,0.06)',
        color: '#524f25',
        borderRadius: '20px 20px 0 0',
      }}>
        {icon}
        <span style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
    </div>
  );
}

const CheckoutInput = forwardRef(({ label, onClear, ...props }, ref) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.72rem', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(82,79,37,0.45)',
        fontFamily: 'var(--font-sans)', marginBottom: '0.4rem',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          ref={ref}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={{
            width: '100%', padding: '0.7rem 1rem', paddingRight: onClear ? '2.5rem' : '1rem', boxSizing: 'border-box',
            border: `1px solid ${focused ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
            borderRadius: '10px', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#524f25',
            background: focused ? 'white' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.2s',
          }}
        />
        {onClear && props.value && props.value !== '+38 (___) ___-__-__' && (
          <button
            type="button"
            onClick={onClear}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'rgba(82,79,37,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#524f25'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(82,79,37,0.4)'}
          >
            <Eraser size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

CheckoutInput.displayName = 'CheckoutInput';
