'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { Save, Calendar, Globe, AlertTriangle, ShoppingCart } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [vacationMode, setVacationMode] = useState({
    enabled: false,
    bannerText: 'Вітаю! Ми у відпустці до [Дата]! Ви можете робити замовлення, але всі відправки розпочнуться з [Дата]. Дякуємо за розуміння.',
    productText: 'Увага! Відправка цього товару буде здійснена після [Дата]',
    checkoutText: 'Я розумію, що замовлення буде відправлене [Дата]'
  });

  useEffect(() => {
    async function loadSettings() {
      setFetching(true);
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('value')
          .eq('id', 'vacation_mode')
          .single();
        
        if (data?.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            setVacationMode(prev => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error('Failed to parse vacation settings', e);
          }
        }
      } catch (err) {
        console.error('Error loading settings', err);
      } finally {
        setFetching(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('global_settings')
        .upsert({ 
          id: 'vacation_mode', 
          value: JSON.stringify(vacationMode)
        });

      if (error) throw error;
      toast.success('Налаштування збережено');
    } catch (err) {
      console.error(err);
      toast.error('Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setVacationMode(prev => ({ ...prev, [field]: value }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500">
        Завантаження налаштувань...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Налаштування магазину</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-stone-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 flex items-center gap-3 bg-stone-50/50">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Режим відпустки</h2>
            <p className="text-sm text-stone-500">Налаштування повідомлень про відпустку для клієнтів</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Toggle */}
          <div className="pb-6 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-stone-800 mb-1">Увімкнути відпустку</h3>
                <p className="text-sm text-stone-500">Активує банери та попередження на всьому сайті</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={vacationMode.enabled}
                  onChange={(e) => updateField('enabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>

          {/* Texts */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <Globe className="w-4 h-4 text-stone-400" />
                Головний банер (зверху сайту)
              </div>
              <textarea
                value={vacationMode.bannerText}
                onChange={(e) => updateField('bannerText', e.target.value)}
                rows={3}
                placeholder="Текст для банера..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-stone-400" />
                Попередження на сторінці товару
              </div>
              <input
                type="text"
                value={vacationMode.productText}
                onChange={(e) => updateField('productText', e.target.value)}
                placeholder="Текст для товару..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <ShoppingCart className="w-4 h-4 text-stone-400" />
                Чекбокс при оформленні замовлення
              </div>
              <input
                type="text"
                value={vacationMode.checkoutText}
                onChange={(e) => updateField('checkoutText', e.target.value)}
                placeholder="Текст для чекауту..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
