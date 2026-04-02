import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, LogOut, ChevronRight, Package } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

/** Перетворити full_name → { firstName, lastName } */
function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName  = parts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

/** Форматування UA-номера */
function formatUaPhone(raw) {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('380')) digits = digits.slice(3);
  if (digits.startsWith('0'))   digits = digits.slice(1);
  digits = digits.slice(0, 9);
  let out = '+380';
  if (digits.length > 0) out += ' ' + digits.slice(0, 3);
  if (digits.length > 3) out += ' ' + digits.slice(3, 6);
  if (digits.length > 6) out += ' ' + digits.slice(6, 9);
  return out;
}

/** Перевірка повного UA-номера */
function isValidUaPhone(phone) {
  if (!phone || phone === '+380') return true; // порожній — ок
  return phone.replace(/[^\d]/g, '').length === 12;
}

export default function AccountPage() {
  const { user, profile, signOut, updateProfile, loading } = useAuth();
  const navigate = useNavigate();

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
    setPhoneUa(profile?.phone_ua || '');
    setIsInternational(profile?.is_international || false);
    setSaveError('');
    setEditing(true);
  }

  function handlePhoneChange(e) {
    if (isInternational) {
      const val = e.target.value;
      if (/^[\d+()\-\s]*$/.test(val)) {
        setPhoneUa(val.startsWith('+') ? val : '+' + val.replace(/\+/g, ''));
      }
    } else {
      setPhoneUa(formatUaPhone(e.target.value));
    }
  }

  async function handleSave() {
    setSaveError('');

    // Валідація
    if (!firstName.trim()) return setSaveError("Введіть ім'я");
    if (!lastName.trim())  return setSaveError('Введіть прізвище');
    if (!isInternational && !isValidUaPhone(phoneUa)) {
      return setSaveError('Невірний формат номера. Має бути +380 XXX XXX XXX');
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
    navigate('/');
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
        <button onClick={() => navigate('/')} className="btn btn-primary">На головну</button>
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
                placeholder={isInternational ? "+XXX XXXXXXXX" : "+380 XXX XXX XXX"}
              />
              
              {/* Switch International */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
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

        {/* Мої замовлення (заготовка) */}
        <Section icon={<Package size={18} />} title="Мої замовлення">
          <div style={{
            textAlign: 'center', padding: '2rem 1rem',
            color: 'rgba(82,79,37,0.35)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
          }}>
            Замовлень ще немає 🛍️
          </div>
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

function EditInput({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(82,79,37,0.45)', marginBottom: '0.4rem',
      }}>
        {label}
      </label>
      <input
        value={value} onChange={onChange} placeholder={placeholder || ''}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '0.7rem 1rem',
          border: `1px solid ${focused ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
          borderRadius: '10px', outline: 'none',
          fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#524f25',
          background: focused ? 'white' : 'rgba(255,255,255,0.7)',
          transition: 'all 0.2s',
        }}
      />
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
