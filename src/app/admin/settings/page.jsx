'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import {
  Save, Calendar, Globe, AlertTriangle, ShoppingCart,
  Sparkles, ChevronUp, ChevronDown, X, Plus, FolderOpen,
  Shuffle, Loader2
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   TOGGLE — великий, чіткий, зелений коли ON
───────────────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="switch"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '56px',
        height: '30px',
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background 0.25s ease',
        background: checked ? '#16a34a' : '#d6d3d1',
        boxShadow: checked
          ? 'inset 0 1px 3px rgba(0,0,0,0.15), 0 0 0 4px rgba(22,163,74,0.12)'
          : 'inset 0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          transition: 'transform 0.25s ease',
          transform: checked ? 'translateX(30px)' : 'translateX(4px)',
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COUNT STEPPER — − N +
───────────────────────────────────────────────────────────────────────────── */
function CountStepper({ value, onChange, min = 1, max = 20 }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      border: '1.5px solid #e7e5e4',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'white',
    }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: '34px', height: '34px',
          border: 'none',
          background: 'transparent',
          cursor: value <= min ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: value <= min ? '#d6d3d1' : '#57534e',
          fontSize: '18px',
          fontWeight: 400,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (value > min) e.currentTarget.style.background = '#f5f5f4'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        −
      </button>
      <span style={{
        width: '36px',
        textAlign: 'center',
        fontSize: '15px',
        fontWeight: 700,
        color: '#1c1917',
        borderLeft: '1px solid #f0efed',
        borderRight: '1px solid #f0efed',
        height: '34px',
        lineHeight: '34px',
        userSelect: 'none',
      }}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: '34px', height: '34px',
          border: 'none',
          background: 'transparent',
          cursor: value >= max ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: value >= max ? '#d6d3d1' : '#57534e',
          fontSize: '18px',
          fontWeight: 400,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (value < max) e.currentTarget.style.background = '#f5f5f4'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        +
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FIELD — лейбл + вміст з відступами
───────────────────────────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {Icon && <Icon size={13} color="#a8a29e" />}
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#a8a29e',
        }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: '#fafaf9',
  border: '1.5px solid #e7e5e4',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#1c1917',
  outline: 'none',
  transition: 'border-color 0.15s, background 0.15s',
  fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION CARD
───────────────────────────────────────────────────────────────────────────── */
function SectionCard({ icon: Icon, iconBg, iconColor, title, subtitle, badge, children }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid rgba(231,229,228,0.8)',
      boxShadow: '0 2px 12px rgba(28,25,23,0.04), 0 1px 3px rgba(28,25,23,0.03)',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '22px 28px',
        borderBottom: '1px solid #f5f5f4',
        background: 'linear-gradient(to bottom, #fafaf9, white)',
      }}>
        <div style={{
          width: '44px', height: '44px',
          borderRadius: '12px',
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={iconColor} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1c1917',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {title}
            </h2>
            {badge}
          </div>
          <p style={{
            fontSize: '13px',
            color: '#a8a29e',
            margin: '3px 0 0',
            fontWeight: 400,
          }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DIVIDER
───────────────────────────────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: '1px', background: '#f5f5f4', margin: '4px 0' }} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOGGLE ROW — назва + підпис + toggle
───────────────────────────────────────────────────────────────────────────── */
function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      padding: '18px 20px',
      background: checked ? 'rgba(22,163,74,0.04)' : '#fafaf9',
      borderRadius: '12px',
      border: `1.5px solid ${checked ? 'rgba(22,163,74,0.2)' : '#f0efed'}`,
      transition: 'all 0.25s ease',
    }}>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: 0 }}>
          {title}
        </p>
        <p style={{ fontSize: '12px', color: '#a8a29e', margin: '4px 0 0', fontWeight: 400 }}>
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY ROW — обрана категорія з степером
───────────────────────────────────────────────────────────────────────────── */
function CategoryRow({ category, count, onCountChange, onRemove }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: 'white',
      border: '1.5px solid #e7e5e4',
      borderRadius: '12px',
      transition: 'border-color 0.15s',
    }}>
      <div style={{
        width: '32px', height: '32px',
        borderRadius: '8px',
        background: '#eff6ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <FolderOpen size={15} color="#3b82f6" />
      </div>

      <span style={{
        flex: 1,
        fontSize: '14px',
        fontWeight: 500,
        color: '#1c1917',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {category.name}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', color: '#a8a29e', fontWeight: 500 }}>показати</span>
        <CountStepper value={count} onChange={onCountChange} />
        <span style={{ fontSize: '12px', color: '#a8a29e', fontWeight: 500 }}>шт.</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        style={{
          width: '30px', height: '30px',
          borderRadius: '8px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#d6d3d1',
          flexShrink: 0,
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#d6d3d1'; e.currentTarget.style.background = 'transparent'; }}
        aria-label="Видалити"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═════════════════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [vacationMode, setVacationMode] = useState({
    enabled: false,
    bannerText: 'Вітаю! Ми у відпустці до [Дата]! Ви можете робити замовлення, але всі відправки розпочнуться з [Дата]. Дякуємо за розуміння.',
    productText: 'Увага! Відправка цього товару буде здійснена після [Дата]',
    checkoutText: 'Я розумію, що замовлення буде відправлене [Дата]',
  });

  const [relatedSettings, setRelatedSettings] = useState({
    enabled: false,
    categories: [],
  });

  const [allCategories, setAllCategories] = useState([]);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setFetching(true);
      try {
        const [vacRes, relRes, catRes] = await Promise.all([
          supabase.from('global_settings').select('value').eq('id', 'vacation_mode').single(),
          supabase.from('global_settings').select('value').eq('id', 'related_products_settings').single(),
          supabase.from('categories').select('id, name').order('sort_order', { ascending: true }),
        ]);

        if (vacRes.data?.value) {
          const parsed = typeof vacRes.data.value === 'string' ? JSON.parse(vacRes.data.value) : vacRes.data.value;
          setVacationMode(p => ({ ...p, ...parsed }));
        }
        if (relRes.data?.value) {
          const parsed = typeof relRes.data.value === 'string' ? JSON.parse(relRes.data.value) : relRes.data.value;
          setRelatedSettings(p => ({ ...p, ...parsed }));
        }
        setAllCategories(catRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const [r1, r2] = await Promise.all([
        supabase.from('global_settings').upsert({ id: 'vacation_mode', value: JSON.stringify(vacationMode) }),
        supabase.from('global_settings').upsert({ id: 'related_products_settings', value: JSON.stringify(relatedSettings) }),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      toast.success('Налаштування збережено');
    } catch (e) {
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateVacation = (field, value) =>
    setVacationMode(p => ({ ...p, [field]: value }));

  const selectedIds = new Set(relatedSettings.categories.map(c => c.categoryId));
  const availableCats = allCategories.filter(c => !selectedIds.has(c.id));

  const addCat = (cat) =>
    setRelatedSettings(p => ({ ...p, categories: [...p.categories, { categoryId: cat.id, count: 3 }] }));

  const removeCat = (id) =>
    setRelatedSettings(p => ({ ...p, categories: p.categories.filter(c => c.categoryId !== id) }));

  const updateCatCount = (id, count) =>
    setRelatedSettings(p => ({
      ...p,
      categories: p.categories.map(c => c.categoryId === id ? { ...c, count } : c),
    }));

  const getCat = (id) => allCategories.find(c => c.id === id);
  const totalCount = relatedSettings.categories.reduce((s, c) => s + c.count, 0);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', gap: '10px', color: '#a8a29e' }}>
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontSize: '14px' }}>Завантаження налаштувань...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '36px',
        gap: '20px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#1c1917',
            margin: 0,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}>
            Налаштування
          </h1>
          <p style={{ fontSize: '14px', color: '#78716c', margin: '6px 0 0', fontWeight: 400 }}>
            Керування режимами та відображенням магазину
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            background: saving ? '#44403c' : '#1c1917',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(28,25,23,0.25)',
            transition: 'background 0.15s, transform 0.1s',
            transform: 'scale(1)',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#292524'; }}
          onMouseLeave={e => { e.currentTarget.style.background = saving ? '#44403c' : '#1c1917'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>

      {/* ── SECTIONS ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ════════════════════════════════════════════════════════════════════
            БЛОК 1: ВІДПУСТКА
        ════════════════════════════════════════════════════════════════════ */}
        <SectionCard
          icon={Calendar}
          iconBg="#fef3c7"
          iconColor="#d97706"
          title="Режим відпустки"
          subtitle="Показує банери і попередження клієнтам поки ви відпочиваєте"
          badge={
            vacationMode.enabled
              ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.04em' }}>АКТИВНИЙ</span>
              : null
          }
        >
          {/* Toggle */}
          <ToggleRow
            title="Увімкнути режим відпустки"
            description={vacationMode.enabled ? 'Клієнти бачать банер та попередження на сайті' : 'Зараз вимкнений — банери приховані'}
            checked={vacationMode.enabled}
            onChange={val => updateVacation('enabled', val)}
          />

          <Divider />

          {/* Fields */}
          <Field label="Головний банер (верхівка сайту)" icon={Globe}>
            <textarea
              value={vacationMode.bannerText}
              onChange={e => updateVacation('bannerText', e.target.value)}
              rows={3}
              placeholder="Текст для банера..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              onFocus={e => { e.target.style.borderColor = '#a8a29e'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e7e5e4'; e.target.style.background = '#fafaf9'; }}
            />
          </Field>

          <Field label="Попередження на сторінці товару" icon={AlertTriangle}>
            <input
              type="text"
              value={vacationMode.productText}
              onChange={e => updateVacation('productText', e.target.value)}
              placeholder="Текст для товару..."
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#a8a29e'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e7e5e4'; e.target.style.background = '#fafaf9'; }}
            />
          </Field>

          <Field label="Чекбокс при оформленні замовлення" icon={ShoppingCart}>
            <input
              type="text"
              value={vacationMode.checkoutText}
              onChange={e => updateVacation('checkoutText', e.target.value)}
              placeholder="Текст для чекауту..."
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#a8a29e'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = '#e7e5e4'; e.target.style.background = '#fafaf9'; }}
            />
          </Field>
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            БЛОК 2: РЕКОМЕНДОВАНІ ТОВАРИ
        ════════════════════════════════════════════════════════════════════ */}
        <SectionCard
          icon={Sparkles}
          iconBg="#eff6ff"
          iconColor="#3b82f6"
          title="Рекомендовані товари"
          subtitle={`Блок "Може сподобатись / Схожі товари" на сторінці товару`}
          badge={
            relatedSettings.enabled
              ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.04em' }}>АКТИВНИЙ</span>
              : null
          }
        >
          {/* Toggle */}
          <ToggleRow
            title="Власний пул категорій"
            description={
              relatedSettings.enabled
                ? 'Товари беруться з обраних категорій нижче, рандомно перемішуються'
                : 'Вимкнено — показуються товари з тієї ж категорії що й поточний товар'
            }
            checked={relatedSettings.enabled}
            onChange={val => setRelatedSettings(p => ({ ...p, enabled: val }))}
          />

          {relatedSettings.enabled && (
            <>
              <Divider />

              {/* Підсумок */}
              {relatedSettings.categories.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                }}>
                  <Shuffle size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: '#1d4ed8', margin: 0, fontWeight: 500 }}>
                    Всього відображається{' '}
                    <strong>{totalCount}</strong> товар(ів) рандомно з{' '}
                    <strong>{relatedSettings.categories.length}</strong>{' '}
                    {relatedSettings.categories.length === 1 ? 'категорії' : 'категорій'}. При кожному відкритті сторінки — новий порядок.
                  </p>
                </div>
              )}

              {/* Список обраних категорій */}
              {relatedSettings.categories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a8a29e' }}>
                      Обрані категорії
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: '#57534e',
                      background: '#f5f5f4',
                      borderRadius: '999px',
                      padding: '1px 8px',
                    }}>
                      {relatedSettings.categories.length}
                    </span>
                  </div>
                  {relatedSettings.categories.map(({ categoryId, count }) => {
                    const cat = getCat(categoryId);
                    if (!cat) return null;
                    return (
                      <CategoryRow
                        key={categoryId}
                        category={cat}
                        count={count}
                        onCountChange={val => updateCatCount(categoryId, val)}
                        onRemove={() => removeCat(categoryId)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '32px 20px',
                  border: '2px dashed #e7e5e4',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <FolderOpen size={32} color="#d6d3d1" />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#78716c', margin: 0 }}>
                      Категорії не обрано
                    </p>
                    <p style={{ fontSize: '12px', color: '#a8a29e', margin: '4px 0 0' }}>
                      Додайте категорії нижче — з них будуть братися товари для блоку
                    </p>
                  </div>
                </div>
              )}

              {/* Доступні категорії для додавання */}
              {availableCats.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a8a29e' }}>
                    Додати категорію
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {availableCats.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => addCat(cat)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'white',
                          border: '1.5px solid #e7e5e4',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#57534e',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.color = '#2563eb';
                          e.currentTarget.style.background = '#eff6ff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e7e5e4';
                          e.currentTarget.style.color = '#57534e';
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <Plus size={13} />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableCats.length === 0 && allCategories.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                }}>
                  <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>
                    ✓ Всі категорії вже додані
                  </span>
                </div>
              )}
            </>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
