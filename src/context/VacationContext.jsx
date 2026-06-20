'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const VacationContext = createContext();

export function VacationProvider({ children }) {
  const [vacationMode, setVacationMode] = useState({
    enabled: false,
    endDate: '',
    bannerText: '',
    productText: '',
    checkoutText: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('value')
          .eq('id', 'vacation_mode')
          .single();
        
        if (!error && data?.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          setVacationMode(prev => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.error('Error loading vacation settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  return (
    <VacationContext.Provider value={{ vacationMode, loading }}>
      {children}
    </VacationContext.Provider>
  );
}

export function useVacation() {
  return useContext(VacationContext);
}
