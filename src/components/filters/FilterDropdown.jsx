import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function FilterDropdown({ 
  label, 
  options, 
  selected, 
  onSelect, 
  isSingleSelect = false,
  renderOption,
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    const optionValue = typeof option === 'object' ? option.name : option;
    
    if (isSingleSelect) {
      onSelect(selected === optionValue ? '' : optionValue);
      setIsOpen(false);
    } else {
      if (selected.includes(optionValue)) {
        onSelect(selected.filter(item => item !== optionValue));
      } else {
        onSelect([...selected, optionValue]);
      }
    }
  };

  const isSelected = (option) => {
    const optionValue = typeof option === 'object' ? option.name : option;
    return isSingleSelect ? selected === optionValue : selected.includes(optionValue);
  };

  const selectedCount = !isSingleSelect && Array.isArray(selected) ? selected.length : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border px-2 py-3 shadow-sm transition-all duration-200 ${isOpen ? 'border-stone-400 z-10' : 'border-stone-200 hover:border-stone-300'} ${className}`}
        style={{ backgroundColor: '#faf9f6' }}
      >
        <span className="font-medium pr-2" style={{ fontSize: '1.3rem', color: '#524f25' }}>
          {isSingleSelect && selected ? (
            <span style={{ color: '#524f25', whiteSpace: 'nowrap' }}>&nbsp;{selected}</span>
          ) : (
            <span style={{ color: '#524f25', whiteSpace: 'nowrap' }}>{label}</span>
          )}
          {selectedCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-stone-900 text-white text-[12px] font-bold rounded-sm">
              {selectedCount}
            </span>
          )}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-6 h-6 transition-colors ${isOpen ? 'text-stone-600' : 'text-stone-400'}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 border border-stone-200 rounded-sm shadow-2xl max-h-80 overflow-y-auto custom-scrollbar"
            style={{ backgroundColor: '#faf9f6' }}
          >
            <div className="space-y-3">
              {options.map((option, idx) => {
                const optionValue = typeof option === 'object' ? option.name : option;
                const active = isSelected(option);
                
                return (
                  <div
                    key={typeof option === 'object' ? option.id || idx : option}
                    onClick={() => toggleOption(option)}
                    className={`flex items-center space-x-4 px-3 py-3 cursor-pointer rounded-sm transition-all ${active ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
                  >
                    {!renderOption && (
                      <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${active ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
                        {active && <Check className="w-4 h-4 text-white" />}
                      </div>
                    )}
                    
                    {renderOption ? (
                      renderOption(option, active)
                    ) : (
                      <span className={`font-medium transition-colors ${active ? 'font-bold' : 'group-hover:text-black'}`} style={{ fontSize: '1.15rem', color: '#524f25' }}>
                        &nbsp;{optionValue}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


