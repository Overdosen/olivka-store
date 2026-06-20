'use client';

import React from 'react';
import { useVacation } from '../context/VacationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export default function VacationBanner() {
  const { vacationMode, loading } = useVacation();

  if (loading || !vacationMode.enabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)',
          borderBottom: '1px solid #fcd34d',
          zIndex: 50
        }}
      >
        <div 
          className="mx-auto px-4 py-3 md:py-5 flex items-center justify-center gap-3 md:gap-4 text-center"
          style={{ maxWidth: '1600px' }}
        >
          <div className="flex-shrink-0 animate-pulse text-amber-600 flex items-center justify-center">
            <Info className="w-[18px] h-[18px] md:w-[27px] md:h-[27px]" strokeWidth={2.5} />
          </div>
          <p 
            className="text-amber-900 text-sm md:text-xl font-medium"
            style={{ 
              textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              lineHeight: '1.4'
            }}
          >
            {vacationMode.bannerText}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
