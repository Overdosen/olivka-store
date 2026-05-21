'use client';

import { formatMoney } from '../../../lib/admin-constants';

export default function StatCard({ label, value, icon: Icon, trend, prefix, suffix = '', className = '', accentColor, children }) {
  return (
    <div 
      className={`admin-card-hover bg-white rounded-lg px-4 py-6 md:px-5 lg:px-2.5 xl:px-4.5 relative overflow-hidden flex flex-col justify-between ${className}`}
      style={{
        boxShadow: '0 2px 8px rgba(28,25,23,0.03), 0 1px 2px rgba(28,25,23,0.02)',
        border: '1px solid rgba(231,229,228,0.6)'
      }}
    >
      <div className="flex flex-col items-center text-center">
        {Icon && (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 mb-3"
            style={{ background: 'linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)' }}
          >
            <Icon className="w-5 h-5" style={{ color: '#57534e' }} />
          </div>
        )}
        
        <p className="text-[12px] uppercase tracking-[0.1em] font-bold mb-1" style={{ color: '#a8a29e' }}>
          {label}
        </p>
        
        <div className="flex items-baseline justify-center gap-1">
          <h3 
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: accentColor || '#1c1917', letterSpacing: '-0.04em' }}
          >
            {prefix}{typeof value === 'number' && !suffix ? formatMoney(value) : value}
          </h3>
          {suffix && <span className="text-sm font-semibold align-baseline" style={{ color: '#a8a29e' }}>{suffix}</span>}
        </div>

        {trend !== undefined && trend !== null && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5"
              style={{ 
                background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: trend >= 0 ? '#059669' : '#dc2626'
              }}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
            <span className="text-[11px] font-medium" style={{ color: '#a8a29e' }}>vs минулий тиждень</span>
          </div>
        )}
      </div>

      {children && (
        <div className="w-full mt-3">
          {children}
        </div>
      )}

      {/* Decorative background glow */}
      <div 
        className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: trend >= 0 ? '#10b981' : (trend < 0 ? '#ef4444' : '#a8a29e') }}
      />
    </div>
  );
}
