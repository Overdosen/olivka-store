'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Truck, MapPin, Phone, User, FileText, ChevronRight, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/useAuth';
import AuthModal from '../../components/AuthModal';
import NovaPoshtaSelector from '../../components/NovaPoshtaSelector';
import UkrPoshtaSelector from '../../components/UkrPoshtaSelector';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatUaMasked, isPhoneFull } from '../../lib/utils';

const DELIVERY_OPTIONS = [
  { id: 'nova_poshta', label: 'Нова Пошта', icon: '🚚', desc: '1–3 дні' },
  { id: 'ukrposhta',   label: 'Укрпошта',   icon: '📮', desc: '3–7 днів' },
];

const PAYMENT_OPTIONS = [
  { id: 'cash_on_delivery', label: 'Накладений платіж', icon: '💵', desc: 'Оплата при отриманні' },
  { id: 'liqpay',           label: 'LiqPay / Карткою', icon: '💳', desc: 'Скоро', disabled: true },
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
  const [address, setAddress]       = useState('');
  const [delivery, setDelivery]     = useState('nova_poshta');
  const [payment, setPayment]       = useState('cash_on_delivery');
  const [notes, setNotes]           = useState('');

  // --- Phone Formatting ---
  const handlePhoneChange = (e) => {
    const val = formatUaMasked(e.target.value);
    setPhone(val);
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
    }
  }, [profile]);

  // Очищення адреси при зміні способу доставки
  useEffect(() => {
    setAddress('');
  }, [delivery]);

  // Показуємо AuthModal якщо не авторизований після завантаження
  useEffect(() => {
    if (!authLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [authLoading, user]);

  const total = cartTotal ?? cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { setAuthModalOpen(true); return; }
    if (!fullName.trim()) { toast.error("Введіть ПІБ"); return; }
    
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
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        name:       item.name,
        price:      item.price,
        qty:        item.quantity,
        size:       item.size,
        image_url:  item.image_url || item.image || null,
      }));

      const { data, error } = await supabase.from('orders').insert({
        user_id:         user.id,
        status:          'new',
        total,
        items:           orderItems,
        full_name:       fullName.trim(),
        phone:           phone.trim(),
        address:         address.trim(),
        delivery_method: delivery,
        payment_method:  payment,
        notes:           notes.trim() || null,
      }).select().single();

      if (error) throw error;

      clearCart();
      const shortId = data.id.slice(0, 8).toUpperCase();
      toast.success(`✅ Замовлення #${shortId} прийнято!`, { duration: 5000 });
      router.push('/account');
    } catch (err) {
      console.error(err);
      toast.error('Помилка при оформленні. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  }

  // Порожній кошик
  if (!authLoading && cartItems.length === 0 && user) {
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
          if (!user) router.push('/');
        }}
        onSuccess={() => setAuthModalOpen(false)}
        initialMode="register"
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ paddingBottom: '6rem', fontFamily: 'var(--font-sans)' }}
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

        <div className="container" style={{ paddingTop: '2.5rem', maxWidth: '1000px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

              {/* ── Ліва колонка: форма ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Контактні дані */}
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
                      placeholder="+38 (0__) ___-__-__"
                      type="tel"
                      required
                      ref={phoneRef}
                    />
                  </div>
                </CheckoutCard>

                {/* Спосіб доставки */}
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
                        <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500, color: '#524f25', fontSize: '0.9rem' }}>{opt.label}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(82,79,37,0.45)' }}>{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CheckoutCard>

                {/* Адреса — залежно від способу доставки */}
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

                {/* Спосіб оплати */}
                <CheckoutCard icon={<span style={{ fontSize: '1rem' }}>💳</span>} title="Спосіб оплати">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {PAYMENT_OPTIONS.map(opt => (
                      <label key={opt.id} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.875rem 1rem',
                        border: `1.5px solid ${payment === opt.id ? '#524f25' : 'rgba(82,79,37,0.12)'}`,
                        borderRadius: '12px',
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        opacity: opt.disabled ? 0.5 : 1,
                        background: payment === opt.id ? 'rgba(82,79,37,0.04)' : 'transparent',
                        transition: 'all 0.2s',
                      }}>
                        <input type="radio" name="payment" value={opt.id} checked={payment === opt.id}
                          disabled={opt.disabled}
                          onChange={() => !opt.disabled && setPayment(opt.id)}
                          style={{ accentColor: '#524f25' }} />
                        <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500, color: '#524f25', fontSize: '0.9rem' }}>{opt.label}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(82,79,37,0.45)' }}>{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CheckoutCard>

                {/* Коментар */}
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

              {/* ── Права колонка: підсумок ── */}
              <div style={{ position: 'sticky', top: '2rem' }}>
                <div style={{
                  background: 'white', borderRadius: '20px',
                  border: '1px solid rgba(82,79,37,0.07)',
                  boxShadow: '0 4px 20px rgba(82,79,37,0.05)',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(82,79,37,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#524f25' }}>
                      <Package size={18} />
                      <span style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
                        Ваше замовлення
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {cartItems.map((item, idx) => (
                      <div key={`${item.id}-${item.size}-${idx}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {(item.image_url || item.image) && (
                          <img
                            src={item.image_url || item.image}
                            alt={item.name}
                            style={{ width: '56px', height: '68px', objectFit: 'cover', borderRadius: '8px', background: '#f5f2e9', flexShrink: 0 }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#524f25', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'rgba(82,79,37,0.5)' }}>
                            {item.size && `Розмір: ${item.size} · `}{item.quantity} шт.
                          </p>
                        </div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#524f25', flexShrink: 0, fontSize: '0.9rem' }}>
                          {item.price * item.quantity} грн
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(82,79,37,0.08)', background: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: '#524f25' }}>
                      <span>Разом</span>
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
                      }}
                    >
                      {submitting ? 'Оформлюємо...' : (<>Підтвердити замовлення <ChevronRight size={16} /></>)}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </motion.main>
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

const CheckoutInput = forwardRef(({ label, ...props }, ref) => {
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
      <input
        {...props}
        ref={ref}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '0.7rem 1rem', boxSizing: 'border-box',
          border: `1px solid ${focused ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
          borderRadius: '10px', outline: 'none',
          fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#524f25',
          background: focused ? 'white' : 'rgba(255,255,255,0.7)',
          transition: 'all 0.2s',
        }}
      />
    </div>
  );
});

CheckoutInput.displayName = 'CheckoutInput';
