'use client';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5 mb-8 md:mb-10">
      <div className="min-w-0">
        <h1 
          className="text-2xl md:text-[2.25rem] font-bold tracking-tight leading-tight"
          style={{ color: '#1c1917', letterSpacing: '-0.03em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p 
            className="mt-2 text-[14px] md:text-[15px] font-medium"
            style={{ color: '#78716c' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-shrink-0 admin-stagger">
          {children}
        </div>
      )}
    </div>
  );
}
