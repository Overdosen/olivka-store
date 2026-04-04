import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Lock, Mail, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';

/**
 * AuthModal — модальне вікно реєстрації та входу
 * Закривається при кліку поза вікном.
 */
export default function AuthModal({ isOpen, onClose }) {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Поля
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneUa, setPhoneUa] = useState('');
  const [isInternational, setIsInternational] = useState(false);

  // Скидаємо при відкритті
  useEffect(() => {
    if (isOpen) {
      setError(''); setSuccess(''); setLoading(false); setMode('login');
      setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setPhoneUa('');
      setIsInternational(false);
    }
  }, [isOpen]);

  // ── Форматування UA-номера ──────────────────────────────────────────────────
  function formatUaPhone(raw) {
    let digits = raw.replace(/[^\d]/g, '');
    if (digits.startsWith('380')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 9);
    let out = '+380';
    if (digits.length > 0) out += ' ' + digits.slice(0, 3);
    if (digits.length > 3) out += ' ' + digits.slice(3, 6);
    if (digits.length > 6) out += ' ' + digits.slice(6, 9);
    return out;
  }

  function handlePhoneChange(e) {
    if (isInternational) {
      const val = e.target.value;
      // Дозволяємо лише +, цифри, пробіли, дужки, дефіси
      if (/^[\d+()\-\s]*$/.test(val)) {
        setPhoneUa(val.startsWith('+') ? val : '+' + val.replace(/\+/g, ''));
      }
    } else {
      setPhoneUa(formatUaPhone(e.target.value));
    }
  }

  // ── Валідація формату UA-телефону ──────────────────────────────────────────
  function validatePhone(phone) {
    if (!phone || phone === '+380') return true; // порожній — дозволено (необов'язково)
    const digits = phone.replace(/[^\d]/g, '');
    return digits.length === 12; // 380 + 9 цифр
  }

  // ── Вхід ───────────────────────────────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn({ email, password });
      onClose();
    } catch (err) {
      setError(parseError(err.message));
    } finally {
      setLoading(false);
    }
  }

  // ── Реєстрація ─────────────────────────────────────────────────────────────
  async function handleSignUp(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!firstName.trim()) return setError("Введіть ваше ім'я");
    if (!lastName.trim()) return setError('Введіть прізвище');
    if (password.length < 6) return setError('Пароль — мінімум 6 символів');

    // Валідація телефону
    if (!isInternational && phoneUa && phoneUa !== '+380' && !validatePhone(phoneUa)) {
      return setError('Невірний формат номера. Має бути +380 XXX XXX XXX (9 цифр після коду)');
    }

    setLoading(true);
    try {
      const finalPhone = phoneUa && (isInternational || phoneUa !== '+380') ? phoneUa : null;
      await signUp({ email, password, firstName, lastName, phoneUa: finalPhone, isInternational });
      setSuccess('👋 Вітаємо! Реєстрація успішна. Ви автоматично увійшли в акаунт.');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(parseError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function parseError(msg) {
    const message = msg?.toString() || '';
    if (message.includes('already registered') || message.includes('already exists') || message.includes('User already'))
      return 'Ця пошта вже зареєстрована';
    if (message.includes('Invalid login') || message.includes('invalid_credentials'))
      return 'Невірна пошта або пароль';
    if (message.includes('Email not confirmed'))
      return 'Підтвердіть email — перевірте пошту';
    if (message.includes('Password should'))
      return 'Пароль — мінімум 6 символів';
    return message;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // Overlay — закривається при кліку в будь-яку область ПОЗА модалом
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}   // клік на підкладку = закрити
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(28, 25, 23, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Модальне вікно — зупиняємо поширення кліку, щоб overlay не закрився */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}   // ← ключовий рядок
            style={{
              background: '#faf9f6',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '440px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 30px 80px rgba(82, 79, 37, 0.18)',
              position: 'relative',
            }}
          >
            {/* Шапка */}
            <div style={{
              background: 'linear-gradient(135deg, #f5f2e9 0%, #eae6d8 100%)',
              padding: '2rem 2rem 1.5rem',
              borderBottom: '1px solid rgba(82,79,37,0.08)',
            }}>
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(82,79,37,0.45)', padding: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#524f25'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(82,79,37,0.45)'}
              >
                <X size={20} />
              </button>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(82,79,37,0.4)', marginBottom: '0.5rem',
              }}>
                store.Olivka
              </p>
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontSize: '1.75rem',
                fontWeight: 400, color: '#524f25', margin: 0,
              }}>
                {mode === 'login' ? 'Вхід' : 'Реєстрація'}
              </h2>
            </div>

            {/* Таб-перемикач */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(82,79,37,0.08)', background: '#faf9f6' }}>
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  style={{
                    flex: 1, padding: '0.875rem', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
                    background: 'transparent',
                    color: mode === m ? '#524f25' : 'rgba(82,79,37,0.4)',
                    borderBottom: mode === m ? '2px solid #524f25' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {m === 'login' ? 'Увійти' : 'Реєстрація'}
                </button>
              ))}
            </div>

            {/* Тіло */}
            <div style={{ padding: '1.75rem 2rem 2rem' }}>

              {/* Успіх */}
              {success && (
                <div style={{
                  background: '#edf3e9', border: '1px solid #9cb691',
                  borderRadius: '12px', padding: '1rem 1.25rem',
                  marginBottom: '1.25rem', color: '#4e6247',
                  fontFamily: 'var(--font-sans)', fontSize: '0.875rem', lineHeight: 1.6,
                }}>
                  {success}
                </div>
              )}

              {/* Помилка */}
              {error && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                  background: '#fdf1e8', border: '1px solid #e0b98a',
                  borderRadius: '12px', padding: '0.875rem 1.25rem',
                  marginBottom: '1.25rem', color: '#8a5c2a',
                  fontFamily: 'var(--font-sans)', fontSize: '0.875rem', lineHeight: 1.5,
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  {error}
                </div>
              )}

              {/* ── ФОРМА ВХОДУ ── */}
              {mode === 'login' && (
                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <AuthInput icon={<Mail size={16} />} type="email" placeholder="Email"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                  <AuthInput icon={<Lock size={16} />} type="password" placeholder="Пароль"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <AuthButton loading={loading} label="Увійти" />
                </form>
              )}

              {/* ── ФОРМА РЕЄСТРАЦІЇ ── */}
              {mode === 'register' && !success && (
                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Ім'я і Прізвище — два окремих поля */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <AuthInput icon={<User size={16} />} type="text" placeholder="Ім'я"
                      value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    <AuthInput icon={<User size={16} />} type="text" placeholder="Прізвище"
                      value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                  <AuthInput icon={<Mail size={16} />} type="email" placeholder="Email"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                  <AuthInput icon={<Lock size={16} />} type="password" placeholder="Пароль (мін. 6 символів)"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <AuthInput icon={<Phone size={16} />} type="tel"
                    placeholder={isInternational ? "+XXX XXXXXXXX" : "+380 XXX XXX XXX"}
                    value={phoneUa} onChange={handlePhoneChange} />

                  {/* Switch International */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                      color: 'rgba(82,79,37,0.4)',
                      letterSpacing: '0.05em',
                    }}>

                    </p>

                    <label className="relative inline-flex items-center cursor-pointer gap-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isInternational}
                        onChange={(e) => {
                          setIsInternational(e.target.checked);
                          setPhoneUa(e.target.checked ? '+' : '+380');
                        }}
                      />

                    </label>
                  </div>
                  <AuthButton loading={loading} label="Зареєструватись" />
                </form>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Допоміжні компоненти ──────────────────────────────────────────────────────

function AuthInput({ icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      border: `1px solid ${focused ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
      borderRadius: '12px', padding: '0.75rem 1rem',
      background: focused ? 'white' : 'rgba(255,255,255,0.6)',
      transition: 'all 0.2s ease',
    }}>
      <span style={{ color: focused ? '#524f25' : 'rgba(82,79,37,0.35)', flexShrink: 0, display: 'flex' }}>
        {icon}
      </span>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          background: 'none', border: 'none', outline: 'none',
          fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
          color: '#524f25', width: '100%',
        }}
      />
    </div>
  );
}

function AuthButton({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', padding: '0.875rem',
        background: loading ? 'rgba(82,79,37,0.5)' : '#524f25',
        color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        borderRadius: '12px',
        fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
        letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        transition: 'all 0.25s ease',
        marginTop: '0.25rem',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#43411e'; }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? 'rgba(82,79,37,0.5)' : '#524f25'; }}
    >
      {loading ? (
        <span style={{ display: 'flex', gap: '4px' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </span>
      ) : (
        <>{label} <ArrowRight size={16} /></>
      )}
    </button>
  );
}
