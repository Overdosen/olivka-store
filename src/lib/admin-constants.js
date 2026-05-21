import { supabase } from './supabase';

// ─── Order Status Map ───────────────────────────────────────────────────────────
export const STATUS_MAP = {
  new:             { label: 'Нове',            color: '#b5880b', bg: '#fef9e7' },
  pending_payment: { label: 'Очікує оплати',   color: '#7c3aed', bg: '#f5f3ff' },
  paid:            { label: 'Сплачено',        color: '#10b981', bg: '#ecfdf5' },
  shipped:         { label: 'Відправлено',     color: '#e65100', bg: '#fff3e0' },
  arrived:         { label: 'Прибуло',         color: '#1d4ed8', bg: '#eff6ff' },
  delivered:       { label: 'Доставлено',      color: '#2e7d32', bg: '#e8f5e9' },
  returned:        { label: 'Повернуто',       color: '#9d174d', bg: '#fdf2f8' },
  payment_error:   { label: 'Помилка оплати',  color: '#dc2626', bg: '#fef2f2' },
  cancelled:       { label: 'Скасовано',       color: '#c62828', bg: '#ffebee' },
};

export const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([id, v]) => ({ id, ...v }));

// ─── Delivery & Payment Labels ─────────────────────────────────────────────────
export const DELIVERY_LABELS = {
  nova_poshta: 'Нова Пошта',
  ukrposhta:   'Укрпошта',
  pickup:      'Самовивіз',
};

export const PAYMENT_LABELS = {
  cash_on_delivery: 'Накладний платіж',
  liqpay:           'LiqPay (онлайн)',
  iban:             'На рахунок (IBAN)',
};

// ─── Auth Headers ───────────────────────────────────────────────────────────────
export async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error('Admin session is unavailable');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

// ─── Date Formatting ────────────────────────────────────────────────────────────
export function formatDateShort(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateFull(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ─── Currency Formatting ────────────────────────────────────────────────────────
export function formatMoney(amount) {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
