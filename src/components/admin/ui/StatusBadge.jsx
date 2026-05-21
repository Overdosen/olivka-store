'use client';

import { STATUS_MAP } from '../../../lib/admin-constants';

export default function StatusBadge({ status, size = 'sm' }) {
  const info = STATUS_MAP[status] || { label: status, color: '#71717a', bg: '#f4f4f5' };

  const sizes = {
    xs: 'px-2 py-0.5 text-[9px]',
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-[11px]',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-md uppercase tracking-wider whitespace-nowrap ${sizes[size]}`}
      style={{
        color: info.color,
        backgroundColor: info.bg,
        border: `1px solid ${info.color}30`,
        boxShadow: `0 1px 2px ${info.color}10`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
        style={{
          backgroundColor: info.color,
          boxShadow: `0 0 4px ${info.color}`
        }}
      />
      {info.label}
    </span>
  );
}
