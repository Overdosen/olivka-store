'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Package, Loader, X, ChevronDown, Truck, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NP_API = 'https://api.novaposhta.ua/v2.0/json/';
const API_KEY = process.env.NEXT_PUBLIC_NP_API_KEY;

const DELIVERY_METHODS = {
  WAREHOUSE: { id: 'WAREHOUSE', label: 'У відділення', icon: Package },
  COURIER:    { id: 'COURIER',    label: 'Кур\'єром',    icon: Truck },
};

const WAREHOUSE_TYPES = {
  branch:  { ref: '841339c7-591a-42e2-8233-7a0a000b9694', label: 'Відділення' },
  locker:  { ref: 'f9316480-5f2d-425d-bc2c-ac7cd29decf0', label: 'Поштомат'  },
};

async function npPost(modelName, calledMethod, methodProperties = {}) {
  const res = await fetch(NP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: API_KEY, modelName, calledMethod, methodProperties }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.errors?.[0] || 'NP API error');
  return json.data;
}

export default function NovaPoshtaSelector({ onChange, value }) {
  const [deliveryMethod, setDeliveryMethod] = useState('WAREHOUSE'); // WAREHOUSE | COURIER

  // City
  const [cityQuery, setCityQuery]     = useState('');
  const [cityList, setCityList]       = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityOpen, setCityOpen]       = useState(false);

  // Warehouse mode
  const [warehouseType, setWarehouseType] = useState('branch');
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [warehouses, setWarehouses]       = useState([]);
  const [whQuery, setWhQuery]             = useState('');
  const [selectedWh, setSelectedWh]       = useState(null);
  const [whLoading, setWhLoading]         = useState(false);
  const [whOpen, setWhOpen]               = useState(false);

  // Courier mode
  const [streetQuery, setStreetQuery]   = useState('');
  const [streetList, setStreetList]     = useState([]);
  const [selectedStreet, setSelectedStreet] = useState(null);
  const [streetLoading, setStreetLoading] = useState(false);
  const [streetOpen, setStreetOpen]     = useState(false);
  const [house, setHouse]               = useState('');
  const [apartment, setApartment]       = useState('');

  const debounceRef  = useRef(null);

  // ── Sync with external value ──
  useEffect(() => {
    if (value && !selectedCity && !cityQuery) {
      if (value.includes('Кур\'єр')) setDeliveryMethod('COURIER');
    }
  }, []);

  // ── Effect: Пошук міста ──
  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || selectedCity) {
      if (!selectedCity) setCityList([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const data = await npPost('Address', 'searchSettlements', {
          CityName: cityQuery,
          Limit: 7,
          Page: 1,
        });
        const list = data?.[0]?.Addresses || [];
        setCityList(list);
      } catch (e) {
        console.error('[NP city search]', e);
        setCityList([]);
      } finally {
        setCityLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [cityQuery, selectedCity]);

  // ── Effect: Завантаження відділень ──
  useEffect(() => {
    if (!selectedCity || deliveryMethod !== 'WAREHOUSE') {
      setAllWarehouses([]);
      return;
    }
    async function fetchAllCityWarehouses() {
      setWhLoading(true);
      try {
        const data = await npPost('Address', 'getWarehouses', {
          CityRef: selectedCity.DeliveryCity,
          Limit: 1000,
        });
        if (Array.isArray(data)) setAllWarehouses(data);
      } catch (e) {
        console.error('[NP fetch warehouses]', e);
        setAllWarehouses([]);
      } finally {
        setWhLoading(false);
      }
    }
    fetchAllCityWarehouses();
  }, [selectedCity, deliveryMethod]);

  // ── Effect: Фільтрація відділень ──
  useEffect(() => {
    if (allWarehouses.length === 0) {
      setWarehouses([]);
      return;
    }
    const typeRef = WAREHOUSE_TYPES[warehouseType].ref;
    const isLocker = warehouseType === 'locker';
    const filtered = allWarehouses.filter(w => {
      const isCorrectCategory = isLocker
        ? (w.CategoryOfWarehouse === 'Postomat' || (w.Description || '').includes('Поштомат'))
        : (w.CategoryOfWarehouse === 'Branch' || w.CategoryOfWarehouse === 'Warehouse' || !(w.Description || '').includes('Поштомат'));
      return isCorrectCategory || w.TypeOfWarehouse === typeRef;
    });
    setWarehouses(filtered);
    setSelectedWh(null);
    setWhOpen(false);
  }, [allWarehouses, warehouseType]);

  // ── Effect: Пошук вулиці ──
  useEffect(() => {
    if (!streetQuery || streetQuery.length < 2 || selectedStreet || !selectedCity) {
      if (!selectedStreet) setStreetList([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setStreetLoading(true);
      try {
        const data = await npPost('Address', 'searchSettlementStreets', {
          StreetName: streetQuery,
          SettlementRef: selectedCity.Ref,
          Limit: 10,
        });
        const list = data?.[0]?.Addresses || [];
        setStreetList(list);
      } catch (e) {
        console.error('[NP street search]', e);
        setStreetList([]);
      } finally {
        setStreetLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [streetQuery, selectedStreet, selectedCity]);

  // ── Effect: Корекція фінального значення ──
  useEffect(() => {
    if (deliveryMethod === 'WAREHOUSE') {
      if (selectedCity && selectedWh) {
        onChange(`НП Відділення: ${selectedWh.Description}`);
      } else {
        onChange('');
      }
    } else {
      if (selectedCity && selectedStreet && house.trim()) {
        const cityPart = `м. ${selectedCity.MainDescription}`;
        const aptPart = apartment.trim() ? `, кв. ${apartment}` : '';
        onChange(`Кур'єр НП: ${cityPart}, вул. ${selectedStreet.SettlementStreetDescription}, буд. ${house}${aptPart}`);
      } else {
        onChange('');
      }
    }
  }, [deliveryMethod, selectedCity, selectedWh, selectedStreet, house, apartment]);

  // ── Handlers ──
  function handleCitySelect(city) {
    setSelectedCity(city);
    setCityQuery(city.Present);
    setCityOpen(false);
    setSelectedWh(null);
    setSelectedStreet(null);
    setStreetQuery('');
  }

  function handleWhSelect(wh) {
    setSelectedWh(wh);
    setWhOpen(false);
  }

  function handleStreetSelect(s) {
    setSelectedStreet(s);
    setStreetQuery(s.SettlementStreetDescription);
    setStreetOpen(false);
  }

  const filteredWarehouses = warehouses.filter(wh =>
    !whQuery || (wh.Description || '').toLowerCase().includes(whQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      
      {/* ── Перемикач типу доставки ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
        {Object.values(DELIVERY_METHODS).map((m) => {
          const Icon = m.icon;
          const isActive = deliveryMethod === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setDeliveryMethod(m.id);
                setSelectedWh(null);
                setSelectedStreet(null);
                setStreetQuery('');
                setHouse('');
                setApartment('');
              }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                position: 'relative', background: 'rgba(82,79,37,0.05)',
                color: isActive ? 'white' : 'rgba(82,79,37,0.6)',
                fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 500,
                transition: 'color 0.2s', zIndex: 1
              }}
            >
              <Icon size={14} />
              {m.label}
              {isActive && (
                <motion.div
                  layoutId="np_method_bg"
                  style={{ position: 'absolute', inset: 0, background: '#524f25', borderRadius: '10px', zIndex: -1 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Пошук міста ── */}
      <div>
        <label style={labelStyle}>Місто</label>
        <div style={{ position: 'relative' }}>
          <div style={inputWrapStyle(!!selectedCity)}>
            <Search size={15} style={{ color: 'rgba(82,79,37,0.4)', flexShrink: 0 }} />
            <input
              value={cityQuery}
              onChange={e => {
                setCityQuery(e.target.value);
                setSelectedCity(null);
                setCityOpen(true);
              }}
              onFocus={() => cityQuery.length >= 2 && setCityOpen(true)}
              placeholder="Введіть місто..."
              style={inputStyle}
              autoComplete="off"
            />
            {cityLoading && <Loader size={14} style={{ color: '#524f25', animation: 'spin 1s linear infinite' }} />}
            {cityQuery && !cityLoading && (
              <button type="button" onClick={() => { setSelectedCity(null); setCityQuery(''); }} style={clearBtnStyle}>
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {cityOpen && cityList.length > 0 && (
              <DropdownList onClose={() => setCityOpen(false)}>
                {cityList.map((city, i) => (
                  <DropdownItem key={i} onClick={() => handleCitySelect(city)}>
                    <MapPin size={13} style={{ color: '#524f25', marginTop: '1px' }} />
                    <span>{city.Present}</span>
                  </DropdownItem>
                ))}
              </DropdownList>
            )}
          </AnimatePresence>
        </div>
      </div>

      {selectedCity && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >
          {deliveryMethod === 'WAREHOUSE' ? (
            <>
              {/* Warehouse UI */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Object.entries(WAREHOUSE_TYPES).map(([key, { label }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setWarehouseType(key)}
                    style={{
                      flex: 1, padding: '0.5rem 0.75rem',
                      border: `1.5px solid ${warehouseType === key ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
                      borderRadius: '10px', cursor: 'pointer',
                      background: warehouseType === key ? '#524f25' : 'white',
                      color: warehouseType === key ? 'white' : 'rgba(82,79,37,0.6)',
                      fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 500,
                      transition: 'all 0.18s',
                    }}
                  >
                    {key === 'branch' ? '🏢' : '📦'} {label}
                  </button>
                ))}
              </div>

              <div>
                <label style={labelStyle}>{WAREHOUSE_TYPES[warehouseType].label}</label>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => warehouses.length > 0 && setWhOpen(v => !v)}
                    disabled={whLoading}
                    style={{ ...inputWrapStyle(!!selectedWh), width: '100%', justifyContent: 'space-between', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '0.9rem', color: selectedWh ? '#524f25' : 'rgba(82,79,37,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {whLoading ? 'Завантаження...' : selectedWh ? selectedWh.Description : `Оберіть ${WAREHOUSE_TYPES[warehouseType].label.toLowerCase()}...`}
                    </span>
                    <ChevronDown size={15} style={{ color: 'rgba(82,79,37,0.4)', transform: whOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  <AnimatePresence>
                    {whOpen && (
                      <DropdownList onClose={() => setWhOpen(false)} maxHeight="280px">
                        <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(82,79,37,0.08)', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                          <input
                            value={whQuery}
                            onChange={e => setWhQuery(e.target.value)}
                            placeholder="Пошук відділення..."
                            style={{ border: 'none', outline: 'none', fontSize: '0.82rem', width: '100%', fontFamily: 'var(--font-sans)', color: '#524f25' }}
                          />
                        </div>
                        {filteredWarehouses.slice(0, 50).map((wh, i) => (
                          <DropdownItem key={wh.Ref || i} onClick={() => handleWhSelect(wh)}>
                            <Package size={14} style={{ color: '#524f25' }} />
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{wh.ShortAddress || wh.Description}</div>
                              <div style={{ fontSize: '0.72rem', color: 'rgba(82,79,37,0.45)' }}>{wh.Description}</div>
                            </div>
                          </DropdownItem>
                        ))}
                      </DropdownList>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Courier UI */}
              <div>
                <label style={labelStyle}>Вулиця</label>
                <div style={{ position: 'relative' }}>
                  <div style={inputWrapStyle(!!selectedStreet)}>
                    <MapPin size={15} style={{ color: 'rgba(82,79,37,0.4)' }} />
                    <input
                      value={streetQuery}
                      onChange={e => {
                        setStreetQuery(e.target.value);
                        setSelectedStreet(null);
                        setStreetOpen(true);
                      }}
                      onFocus={() => streetQuery.length >= 2 && setStreetOpen(true)}
                      placeholder="Назва вулиці..."
                      style={inputStyle}
                      autoComplete="off"
                    />
                    {streetLoading && <Loader size={14} style={{ color: '#524f25', animation: 'spin 1s linear infinite' }} />}
                  </div>

                  <AnimatePresence>
                    {streetOpen && streetList.length > 0 && (
                      <DropdownList onClose={() => setStreetOpen(false)}>
                        {streetList.map((s, i) => (
                          <DropdownItem key={i} onClick={() => handleStreetSelect(s)}>
                            <MapPin size={13} style={{ color: '#524f25' }} />
                            <span>{s.Present}</span>
                          </DropdownItem>
                        ))}
                      </DropdownList>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Будинок *</label>
                  <div style={inputWrapStyle(!!house.trim())}>
                    <Home size={15} style={{ color: 'rgba(82,79,37,0.4)' }} />
                    <input
                      value={house}
                      onChange={e => setHouse(e.target.value)}
                      placeholder="№"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Квартира</label>
                  <div style={inputWrapStyle(!!apartment.trim())}>
                    <Package size={15} style={{ color: 'rgba(82,79,37,0.4)' }} />
                    <input
                      value={apartment}
                      onChange={e => setApartment(e.target.value)}
                      placeholder="№"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───

function DropdownList({ children, onClose, maxHeight = '280px' }) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      style={{
        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
        background: 'white', borderRadius: '12px', border: '1px solid rgba(82,79,37,0.12)',
        boxShadow: '0 12px 40px rgba(82,79,37,0.18)', maxHeight, overflowY: 'auto'
      }}
    >
      {children}
    </motion.div>
  );
}

function DropdownItem({ children, onClick }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.875rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.12s', fontFamily: 'var(--font-sans)'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,79,37,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {children}
    </button>
  );
}

// ─── Styles ───

const labelStyle = {
  display: 'block', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'rgba(82,79,37,0.45)', fontFamily: 'var(--font-sans)', marginBottom: '0.4rem',
};

function inputWrapStyle(active) {
  return {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    border: `1px solid ${active ? '#524f25' : 'rgba(82,79,37,0.15)'}`,
    borderRadius: '10px', padding: '0.7rem 1rem',
    background: active ? 'white' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s',
  };
}

const inputStyle = {
  border: 'none', outline: 'none', background: 'none',
  fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: '#524f25',
  width: '100%', minWidth: 0,
};

const clearBtnStyle = {
  border: 'none', background: 'none', cursor: 'pointer', padding: '2px',
  color: 'rgba(82,79,37,0.4)', display: 'flex', alignItems: 'center',
};
