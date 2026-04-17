'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, LogOut, ChevronRight, Package, MapPin, Truck, Clock } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { formatUaMasked, isPhoneFull } from '../../lib/utils';

/** Перетворити full_name → { firstName, lastName } */
function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName  = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}


export default function AccountClient() {
  const { user, profile, signOut, updateProfile, loading } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState('');

  // Поля редагування
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phoneUa, setPhoneUa]     = useState('');
  const [isInternational, setIsInternational] = useState(false);

  function startEdit() {
    const { firstName: fn, lastName: ln } = splitName(profile?.full_name);
    setFirstName(fn);
    setLastName(ln);
    setPhoneUa(formatUaMasked(profile?.phone_ua || ''));
    setIsInternational(profile?.is_international || false);
    setSaveError('');
    setEditing(true);
  }

  function handlePhoneChange(e) {
    const val = e.target.value;
    if (isInternational) {
      if (/^[\d+()\-\s]*$/.test(val)) {
        setPhoneUa(val.startsWith('+') ? val : '+' + val.replace(/\+/g, ''));
      }
    } else {
      const isDeletion = val.length < phoneUa.length;
      let digits = val.replace(/\D/g, '');
      
      if (isDeletion) {
        const prevDigits = phoneUa.replace(/\D/g, '');
        if (digits === prevDigits && digits.length > 2) {
          digits = digits.slice(0, -1);
        }
      }
      setPhoneUa(formatUaMasked(digits));
    }
  }

  function handlePhoneFocus() {
    if (!isInternational && (!phoneUa || phoneUa === '')) {
      setPhoneUa(formatUaMasked(''));
    }
  }

  async function handleSave() {
    setSaveError('');

    // Валідація
    if (!firstName.trim()) return setSaveError("Введіть ім'я");
    if (!lastName.trim())  return setSaveError('Введіть прізвище');
    if (!isInternational && !isPhoneFull(phoneUa)) {
      return setSaveError('Будь ласка, введіть повний номер телефону: +38 (0__) ___-__-__');
    }

    const full_name = `${firstName.trim()} ${lastName.trim()}`;
    const finalPhone = (phoneUa && phoneUa !== '+380') ? phoneUa : null;

    setSaving(true);
    try {
      await updateProfile({
        full_name,
        phone_ua: finalPhone,
        is_international: isInternational,
      });
      setEditing(false);
      toast.success('Дані збережено!');
    } catch (err) {
      setSaveError(err.message || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/');
    toast.success('Ви вийшли з акаунту');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(82,79,37,0.4)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>
          Завантаження...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'rgba(82,79,37,0.5)', fontFamily: 'var(--font-sans)' }}>Увійдіть, щоб побачити кабінет</p>
        <button onClick={() => router.push('/')} className="btn btn-primary">На головну</button>
      </div>
    );
  }

  const { firstName: displayFirst, lastName: displayLast } = splitName(profile?.full_name);
  const initials = ((profile?.full_name || user.email || '?')[0]).toUpperCase();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ paddingBottom: '6rem' }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f2e9 0%, #eae6d8 100%)',
        padding: '4rem 2rem 3rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(82,79,37,0.08)',
      }}>
        {/* Аватар */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#524f25', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-serif)', fontSize: '1.75rem',
          margin: '0 auto 1.25rem',
          boxShadow: '0 8px 24px rgba(82,79,37,0.2)',
        }}>
          {initials}
        </div>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(82,79,37,0.4)', marginBottom: '0.4rem',
        }}>
          Особистий кабінет
        </p>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          color: '#524f25', fontWeight: 400, margin: 0,
        }}>
          {profile?.full_name || 'Мій профіль'}
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
          color: 'rgba(82,79,37,0.45)', marginTop: '0.4rem',
        }}>
          {user.email}
        </p>
      </div>

      <div className="container" style={{ paddingTop: '3rem', maxWidth: '680px' }}>
        {/* Мої дані */}
        <Section
          icon={<User size={18} />}
          title="Мої дані"
          action={!editing ? <ActionBtn onClick={startEdit} label="Редагувати" /> : null}
        >
          {!editing ? (
            <InfoGrid>
              <InfoRow label="Ім'я"      value={displayFirst || '—'} />
              <InfoRow label="Прізвище"  value={displayLast  || '—'} />
              <InfoRow label="Email"     value={user.email} />
              <InfoRow label="Телефон"   value={profile?.phone_ua || '—'} />
            </InfoGrid>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Ім'я і прізвище поруч */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <EditInput label="Ім'я"     value={firstName} onChange={e => setFirstName(e.target.value)} />
                <EditInput label="Прізвище" value={lastName}  onChange={e => setLastName(e.target.value)} />
              </div>
              <EditInput
                label="Телефон"
                value={phoneUa}
                onChange={handlePhoneChange}
                onFocus={handlePhoneFocus}
                onClear={!isInternational ? (() => setPhoneUa(formatUaMasked(''))) : null}
                placeholder={isInternational ? "+XXX XXXXXXXX" : "+38 (0__) ___-__-__"}
              />
              
              {/* Switch International */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
                <label className="relative inline-flex items-center cursor-pointer gap-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isInternational}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsInternational(checked);
                      setPhoneUa(checked ? '+' : formatUaMasked(''));
                    }}
                  />
                  <div className="relative group peer bg-stone-50 rounded-full duration-300 w-12 h-6 ring-2 ring-yellow-500 after:duration-300 after:bg-yellow-500 peer-checked:after:bg-green-500 peer-checked:ring-green-500 after:rounded-full after:absolute after:h-4 after:w-4 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:translate-x-6 peer-hover:after:scale-95"></div>
                  <span className="text-[0.7rem] font-sans uppercase tracking-wider text-stone-400">міжнародний</span>
                </label>
              </div>

              {/* Повідомлення про помилку збереження */}
              {saveError && (
                <div style={{
                  background: '#fdf1e8', border: '1px solid #e0b98a',
                  borderRadius: '10px', padding: '0.75rem 1rem',
                  color: '#8a5c2a', fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
                }}>
                  {saveError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleSave} disabled={saving}
                  style={{
                    flex: 1, padding: '0.75rem',
                    background: saving ? 'rgba(82,79,37,0.45)' : '#524f25',
                    color: 'white', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    borderRadius: '10px', fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem', letterSpacing: '0.1em',
                    textTransform: 'uppercase', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#43411e'; }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#524f25'; }}
                >
                  {saving ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  onClick={() => { setEditing(false); setSaveError(''); }}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'rgba(82,79,37,0.07)',
                    color: 'rgba(82,79,37,0.6)',
                    border: 'none', cursor: 'pointer',
                    borderRadius: '10px', fontFamily: 'var(--font-sans)',
                    fontSize: '0.8rem',
                  }}
                >
                  Скасувати
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Мої замовлення */}
        <Section icon={<Package size={18} />} title="Мої замовлення">
          <OrdersList userId={user.id} />
        </Section>

        {/* Вихід */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', marginTop: '0.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.875rem', border: '1px solid rgba(82,79,37,0.12)',
            borderRadius: '16px', cursor: 'pointer',
            background: 'transparent', color: 'rgba(82,79,37,0.45)',
            fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fdf1e8'; e.currentTarget.style.color = '#8a5c2a'; e.currentTarget.style.borderColor = '#e0b98a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(82,79,37,0.45)'; e.currentTarget.style.borderColor = 'rgba(82,79,37,0.12)'; }}
        >
          <LogOut size={15} />
          Вийти з акаунту
        </button>
      </div>
    </motion.main>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ icon, title, action, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: '20px',
      border: '1px solid rgba(82,79,37,0.07)',
      boxShadow: '0 4px 20px rgba(82,79,37,0.05)',
      marginBottom: '1.25rem', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(82,79,37,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#524f25' }}>
          {icon}
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
            letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500,
          }}>
            {title}
          </span>
        </div>
        {action}
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div style={{ display: 'grid', gap: '0.75rem' }}>{children}</div>;
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'rgba(82,79,37,0.4)', flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
        color: '#524f25', textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

function EditInput({ label, value, onChange, onFocus, onBlur, onClear, placeholder }) {
  const [focused, setFocused] = useState(false);
  const { isInternational } = useAuth(); // or pass it as prop, though here we can just check if onClear exists
  
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(82,79,37,0.45)', marginBottom: '0.4rem',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          value={value} 
          onChange={onChange} 
          placeholder={placeholder || ''}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }} 
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={{
            width: '100%', padding: '0.7rem 1rem', paddingRight: onClear ? '2.5rem' : '1rem',
            border: `1px solid ${focused ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
            borderRadius: '10px', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#524f25',
            background: focused ? 'white' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.2s',
          }}
        />
        {onClear && value && value !== '+38 (___) ___-__-__' && (
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
            }}
          >
            <LogOut size={14} style={{ transform: 'rotate(180deg)' }} /> 
          </button>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(82,79,37,0.45)', transition: 'color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#524f25'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(82,79,37,0.45)'}
    >
      {label} <ChevronRight size={13} />
    </button>
  );
}
// ─── OrdersList ─────────────────────────────────────────────────────────────

const STATUS_MAP = {
  new:             { label: 'Нове',         color: '#b5880b', bg: '#fef9e7' },
  shipped:         { label: 'Відправлено',  color: '#e65100', bg: '#fff3e0' },
  delivered:       { label: 'Доставлено',   color: '#2e7d32', bg: '#e8f5e9' },
  cancelled:       { label: 'Скасовано',    color: '#c62828', bg: '#ffebee' },
  paid:            { label: 'Сплачено',     color: '#10b981', bg: '#ecfdf5' },
  payment_error:   { label: 'Помилка оплати', color: '#dc2626', bg: '#fef2f2' },
  pending_payment: { label: 'Очікує оплати', color: '#7c3aed', bg: '#f5f3ff' },
};

function OrdersList({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error) setOrders(data || []);
      setLoading(false);
    }

    fetchOrders();

    // Підписка на зміни статусів або нові замовлення користувача
    const channel = supabase
      .channel(`user-orders-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${userId}` 
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(82,79,37,0.35)', fontSize: '0.9rem' }}>
      Завантаження...
    </div>
  );

  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(82,79,37,0.35)', fontSize: '0.9rem' }}>
      Замовлень ще немає 🛍️
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {orders.map(order => {
        const status = STATUS_MAP[order.status] || STATUS_MAP.new;
        const isExpanded = expandedId === order.id;
        const displayId = order.order_number;
        const dateObj = new Date(order.created_at);
        const date = dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*р\.?$/, '');
        const time = dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        const items = Array.isArray(order.items) ? order.items : [];

        return (
          <div key={order.id} style={{
            border: '1px solid rgba(82,79,37,0.09)', borderRadius: '14px',
            overflow: 'hidden', background: 'white',
          }}>
            {/* Рядок замовлення */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', background: 'none', border: 'none',
                cursor: 'pointer', gap: '1rem', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600, color: '#524f25' }}>
                  №{displayId}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'rgba(82,79,37,0.4)' }}>{date}, {time}</span>
              </div>
              <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 600,
                color: status.color, background: status.bg,
              }}>
                {status.label}
              </span>
              <span style={{ fontWeight: 600, color: '#524f25', fontSize: '0.9rem', flexShrink: 0 }}>
                {order.total} грн
              </span>
              <ChevronRight size={16} style={{
                color: 'rgba(82,79,37,0.35)', flexShrink: 0,
                transform: isExpanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }} />
            </button>

            {/* Деталі */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(82,79,37,0.07)' }}>
                    {/* Список товарів */}
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: '#524f25' }}>
                            {item.name}{item.size ? ` · ${item.size}` : ''} × {item.qty}
                          </span>
                          <span style={{ color: 'rgba(82,79,37,0.6)', flexShrink: 0 }}>{item.price * item.qty} грн</span>
                        </div>
                      ))}
                    </div>
                    {/* Мета-інфо */}
                    <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px dashed rgba(82,79,37,0.1)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {order.address && (
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(82,79,37,0.55)' }}>
                          <MapPin size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                          <span>{order.address}</span>
                        </div>
                      )}
                      {order.delivery_method && (
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(82,79,37,0.55)' }}>
                          <Truck size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                          <span>{{
                            nova_poshta: 'Нова Пошта',
                            ukrposhta: 'Укрпошта',
                            pickup: 'Самовивіз',
                          }[order.delivery_method]}</span>
                        </div>
                      )}
                      {order.payment_method && (
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(82,79,37,0.55)' }}>
                          <span style={{ fontSize: '14px', flexShrink: 0 }}>💳</span>
                          <span>{{
                            cash_on_delivery: 'Накладений платіж',
                            liqpay: 'Картою (LiqPay)',
                          }[order.payment_method] || order.payment_method}</span>
                        </div>
                      )}
                      {order.notes && (
                        <div style={{ 
                          marginTop: '0.4rem', padding: '0.625rem 0.75rem', 
                          background: 'rgba(215,190,130,0.1)', borderRadius: '10px',
                          fontSize: '0.75rem', color: '#8a7b4f', fontStyle: 'italic',
                          display: 'flex', gap: '0.5rem'
                        }}>
                          <span style={{ shrink: 0 }}>💬</span>
                          <span>{order.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
