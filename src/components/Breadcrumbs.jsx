'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="flex items-center space-x-2 text-[12px] sm:text-[14px] font-sans text-[#524f25]/60 mb-6 flex-wrap leading-relaxed"
    >
      <Link 
        href="/" 
        className="flex items-center hover:text-[#524f25] transition-colors"
        title="Головна"
      >
        <Home className="w-3 h-3 sm:w-4 sm:h-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#524f25]/30 shrink-0" />
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-[#524f25] transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#524f25] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-none">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
