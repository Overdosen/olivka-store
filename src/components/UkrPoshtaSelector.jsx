'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Package, Loader, X, ChevronDown, Truck, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

async function ukrPostFetch(endpoint, params = {}) {
  const searchParams = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`/api/ukrposhta?${searchParams.toString()}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[Ukrposhta API Error]', text);
    throw new Error(`Ukrposhta error: ${res.status}`);
  }

  const json = await res.json();
  // Укрпошта зазвичай повертає дані в полі "Entries" або "Entry"
  if (json?.Entries?.Entry) {
    return Array.isArray(json.Entries.Entry) ? json.Entries.Entry : [json.Entries.Entry];
  } else if (json?.Entry) {
    return Array.isArray(json.Entry) ? json.Entry : [json.Entry];
  }
  return [];
}

const DELIVERY_METHODS = {
  POSTOFFICE: { id: 'POSTOFFICE', label: 'У відділення', icon: Package },
  COURIER:    { id: 'COURIER',    label: 'Кур\'єром',    icon: Truck },
};

const SERVICE_TYPES = {
  STANDARD: { id: 'STANDARD', label: 'Стандарт', desc: 'Економна доставка' },
  EXPRESS:  { id: 'EXPRESS',  label: 'Експрес',  desc: 'Швидка доставка' },
};

export default function UkrPoshtaSelector({ onChange, value }) {
  // Config
  const [deliveryMethod, setDeliveryMethod] = useState('POSTOFFICE'); // POSTOFFICE | COURIER
  const [serviceType, setServiceType]       = useState('STANDARD');    // STANDARD | EXPRESS

  // City
  const [cityQuery, setCityQuery]       = useState('');
  const [cityList, setCityList]         = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityLoading, setCityLoading]   = useState(false);
  const [cityOpen, setCityOpen]         = useState(false);

  // Office (for POSTOFFICE)
  const [offices, setOffices]           = useState([]);
  const [offQuery, setOffQuery]         = useState('');
  const [selectedOff, setSelectedOff]   = useState(null);
  const [offLoading, setOffLoading]     = useState(false);
  const [offOpen, setOffOpen]           = useState(false);

  // Address (for COURIER)
  const [streetQuery, setStreetQuery]   = useState('');
  const [streetList, setStreetList]     = useState([]);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [streetLoading, setStreetLoading] = useState(false);
  const [streetOpen, setStreetOpen]     = useState(false);
  const [house, setHouse]               = useState('');
  const [apartment, setApartment]       = useState('');

  const debounceRef = useRef(null);

  // ── Sync with external value (initial load only if needed) ──
  useEffect(() => {
    if (value && !selectedCity && !cityQuery) {
      if (value.includes('Кур\'єр')) setDeliveryMethod('COURIER');
      if (value.includes('Експрес')) setServiceType('EXPRESS');
    }
  }, []);

  // ── Effect: Пошук міста ──────────────────────────────────────────────────
  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || selectedCity) {
      if (!selectedCity) setCityList([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const data = await ukrPostFetch('/get_city_by_region_id_and_district_id_and_city_ua', {
          city_ua: cityQuery
        });
        setCityList(data);
      } catch (e) {
        console.error('[Ukrposhta city]', e);
        setCityList([]);
      } finally {
        setCityLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [cityQuery, selectedCity]);

  // ── Effect: Пошук Відділень ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCity || deliveryMethod !== 'POSTOFFICE') {
      setOffices([]);
      return;
    }
    async function fetchOffices() {
      setOffLoading(true);
      try {
        const data = await ukrPostFetch('/get_postoffices_by_city_id', {
          city_id: selectedCity.CITY_ID
        });
        setOffices(data);
      } catch (e) {
        setOffices([]);
      } finally {
        setOffLoading(false);
      }
    }
    fetchOffices();
  }, [selectedCity, deliveryMethod]);

  // ── Effect: Пошук Вулиць (Кур'єр) ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedCity || deliveryMethod !== 'COURIER' || !streetQuery || streetQuery.length < 3 || selectedStreet) {
      if (!selectedStreet) setStreetList([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setStreetLoading(true);
      try {
        const data = await ukrPostFetch('/get_street_by_region_id_and_district_id_and_city_id_and_street_ua', {
          city_id: selectedCity.CITY_ID,
          street_ua: streetQuery
        });
        setStreetList(data);
      } catch (e) {
        setStreetList([]);
      } finally {
        setStreetLoading(false);
      }
    }, 400);
  }, [streetQuery, selectedCity, deliveryMethod, selectedStreet]);

  // ── Formatter: Update Parent ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCity) return;

    let finalValue = `Укрпошта ${SERVICE_TYPES[serviceType].label}: `;
    
    if (deliveryMethod === 'POSTOFFICE' && selectedOff) {
      finalValue += `${selectedOff.POSTINDEX}, ${selectedCity.REGION_UA}, ${selectedCity.CITY_UA}, ${selectedOff.PO_SHORT} (${selectedOff.ADDRESS})`;
      onChange(finalValue);
    } else if (deliveryMethod === 'COURIER' && selectedStreet && house) {
      finalValue += `Кур'єрська доставка: ${selectedCity.CITY_UA}, вул. ${selectedStreet.STREET_UA}, буд. ${house}${apartment ? ', кв. ' + apartment : ''}`;
      onChange(finalValue);
    }
  }, [selectedCity, selectedOff, selectedStreet, house, apartment, deliveryMethod, serviceType]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityQuery(`${city.CITY_UA} (${city.REGION_UA})`);
    setCityOpen(false);
    setSelectedOff(null);
    setSelectedStreet(null);
    setHouse('');
    setApartment('');
  };

  const clearCity = () => {
    setSelectedCity(null);
    setCityQuery('');
    setCityList([]);
    setSelectedOff(null);
    setSelectedStreet(null);
    onChange('');
  };

  const filteredOffices = offices.filter(off =>
    !offQuery || 
    off.PO_SHORT?.toLowerCase().includes(offQuery.toLowerCase()) || 
    off.ADDRESS?.toLowerCase().includes(offQuery.toLowerCase()) ||
    off.POSTINDEX?.includes(offQuery)
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-sans)' }}>
      
      {/* 1. Послуга (Стандарт/Експрес) */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(82,79,37,0.05)', padding: '0.25rem', borderRadius: '12px' }}>
        {Object.values(SERVICE_TYPES).map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setServiceType(type.id)}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '10px',
              background: serviceType === type.id ? 'white' : 'transparent',
              color: serviceType === type.id ? '#524f25' : 'rgba(82,79,37,0.5)',
              boxShadow: serviceType === type.id ? '0 4px 12px rgba(82,79,37,0.1)' : 'none',
              fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)'
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 2. Метод (Відділення/Кур'єр) */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {Object.values(DELIVERY_METHODS).map((method) => {
          const Icon = method.icon;
          const isActive = deliveryMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setDeliveryMethod(method.id)}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '12px',
                border: `1.5px solid ${isActive ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
                background: isActive ? '#524f25' : 'white',
                color: isActive ? 'white' : '#524f25',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer',
                fontFamily: 'var(--font-sans)'
              }}
            >
              <Icon size={16} />
              {method.label}
            </button>
          );
        })}
      </div>

      {/* 3. Населений пункт */}
      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>Населений пункт</label>
        <div style={inputWrapStyle(!!selectedCity)}>
          <Search size={16} style={{ color: 'rgba(82,79,37,0.4)' }} />
          <input
            value={cityQuery}
            onChange={e => { setCityQuery(e.target.value); if (selectedCity) setSelectedCity(null); setCityOpen(true); }}
            onFocus={() => { if (cityQuery.length >= 2 && !selectedCity) setCityOpen(true); }}
            placeholder="Введіть місто або смт..."
            style={inputStyle}
            autoComplete="off"
          />
          {cityLoading && <Loader size={14} className="animate-spin" />}
          {cityQuery && (
            <button type="button" onClick={clearCity} style={clearBtnStyle}><X size={14} /></button>
          )}
        </div>
        
        <AnimatePresence>
          {cityOpen && cityList.length > 0 && !selectedCity && (
            <DropdownList onClose={() => setCityOpen(false)}>
              {cityList.map((city, i) => (
                <DropdownItem key={city.CITY_ID || i} onClick={() => handleCitySelect(city)}>
                  <MapPin size={13} style={{ color: '#524f25', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.9rem', color: '#524f25', fontWeight: 500, fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                    {city.CITY_UA}, {city.REGION_UA}{city.DISTRICT_UA ? `, ${city.DISTRICT_UA} р-н` : ''}
                  </span>
                </DropdownItem>
              ))}
            </DropdownList>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Контент залежно від методу */}
      <AnimatePresence mode="wait">
        {selectedCity && (
          <motion.div 
            key={deliveryMethod}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
          >
            
            {deliveryMethod === 'POSTOFFICE' ? (
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Відділення ({offices.length})</label>
                <button
                  type="button"
                  onClick={() => offices.length > 0 && setOffOpen(!offOpen)}
                  disabled={offLoading}
                  style={{ ...inputWrapStyle(!!selectedOff), width: '100%', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                    <Package size={16} style={{ color: 'rgba(82,79,37,0.4)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', color: selectedOff ? '#524f25' : 'rgba(82,79,37,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {offLoading ? 'Завантаження...' : selectedOff ? `${selectedOff.PO_SHORT} (${selectedOff.POSTINDEX})` : 'Оберіть відділення...'}
                    </span>
                  </div>
                  <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: offOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                <AnimatePresence>
                  {offOpen && (
                    <DropdownList onClose={() => setOffOpen(false)} maxHeight="300px">
                      <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(82,79,37,0.08)', position: 'sticky', top: 0, background: 'white' }}>
                        <input
                          value={offQuery}
                          onChange={e => setOffQuery(e.target.value)}
                          placeholder="Шукати за номером або адресою..."
                          autoFocus
                          style={{ ...inputStyle, padding: '0.4rem', background: 'rgba(82,79,37,0.03)', borderRadius: '6px' }}
                        />
                      </div>
                      {filteredOffices.length === 0 ? (
                        <div style={{ padding: '2rem 1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'rgba(82,79,37,0.35)' }}>Нічого не знайдено</div>
                      ) : (
                        filteredOffices.map((off, i) => (
                          <DropdownItem key={off.ID || off.POSTINDEX || i} onClick={() => { setSelectedOff(off); setOffOpen(false); }}>
                            <Package size={14} style={{ color: '#524f25', flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.9rem', color: '#524f25', fontWeight: 500, lineHeight: 1.2, fontFamily: 'var(--font-sans)' }}>
                                {off.PO_SHORT} ({off.POSTINDEX})
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(82,79,37,0.45)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)' }}>
                                {off.ADDRESS}
                              </div>
                            </div>
                          </DropdownItem>
                        ))
                      )}
                    </DropdownList>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Вулиця */}
                <div style={{ position: 'relative' }}>
                  <label style={labelStyle}>Вулиця</label>
                  <div style={inputWrapStyle(!!selectedStreet)}>
                    <Home size={16} style={{ color: 'rgba(82,79,37,0.4)' }} />
                    <input
                      value={streetQuery}
                      onChange={e => { setStreetQuery(e.target.value); if (selectedStreet) setSelectedStreet(null); setStreetOpen(true); }}
                      placeholder="Почніть вводити назву..."
                      style={inputStyle}
                      autoComplete="off"
                    />
                    {streetLoading && <Loader size={14} className="animate-spin" />}
                  </div>
                  <AnimatePresence>
                    {streetOpen && streetList.length > 0 && !selectedStreet && (
                      <DropdownList onClose={() => setStreetOpen(false)}>
                        {streetList.map((st, i) => (
                          <DropdownItem key={st.STREET_ID || i} onClick={() => { setSelectedStreet(st); setStreetQuery(st.STREET_UA); setStreetOpen(false); }}>
                            <Search size={13} style={{ color: '#524f25', flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ fontSize: '0.9rem', color: '#524f25', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{st.STREET_UA}</span>
                          </DropdownItem>
                        ))}
                      </DropdownList>
                    )}
                  </AnimatePresence>
                </div>

                {/* Будинок та Квартира */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Будинок</label>
                    <input
                      value={house}
                      onChange={e => setHouse(e.target.value)}
                      placeholder="Номер"
                      style={{ ...inputWrapStyle(false), width: '100%', textAlign: 'center' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Кв. / Офіс</label>
                    <input
                      value={apartment}
                      onChange={e => setApartment(e.target.value)}
                      placeholder="Номер"
                      style={{ ...inputWrapStyle(false), width: '100%', textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function DropdownList({ children, onClose, maxHeight = '280px' }) {
  const ref = useRef(null);
  useEffect(() => {
    const click = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      style={{
        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
        background: 'white', borderRadius: '12px',
        border: '1px solid rgba(82,79,37,0.12)',
        boxShadow: '0 12px 40px rgba(82,79,37,0.18)',
        maxHeight, overflowY: 'auto'
      }}
    >
      {children}
    </motion.div>
  );
}

function DropdownItem({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: '0.9rem', color: '#524f25', transition: 'background 0.12s', fontFamily: 'var(--font-sans)'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,79,37,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </button>
  );
}

const labelStyle = { 
  display: 'block',
  fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', 
  color: 'rgba(82,79,37,0.45)', fontFamily: 'var(--font-sans)', marginBottom: '0.4rem' 
};

function inputWrapStyle(active) {
  return {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    borderRadius: '10px', border: `1px solid ${active ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
    padding: '0.7rem 1rem',
    background: active ? 'white' : 'rgba(255,255,255,0.7)', 
    transition: 'all 0.2s',
    fontFamily: 'var(--font-sans)'
  };
}

const inputStyle = { border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#524f25', background: 'transparent', fontFamily: 'var(--font-sans)' };
const clearBtnStyle = { border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(82,79,37,0.4)', display: 'flex', flexShrink: 0 };
