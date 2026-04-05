import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function FilterDropdown({ label, options, selected, onChange }) {
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
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-stone-200 px-4 py-3 rounded-md shadow-sm hover:border-stone-300 transition-colors"
        style={{ backgroundColor: '#eee6d8' }}
      >
        <span className="text-stone-700 font-medium">
          &nbsp;{label} {selected.length > 0 && <span className="ml-1 text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600 font-bold">{selected.length}</span>}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-stone-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 min-w-full w-max mt-2 bg-white border border-stone-200 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar left-1/2"
          >
            <div className="p-2 space-y-1">
              {options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <label
                    key={option}
                    className="flex items-center space-x-4 px-3 py-2 cursor-pointer rounded-md hover:bg-stone-50 transition-colors group"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-stone-800 border-stone-800' : 'border-stone-300 group-hover:border-stone-400'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => toggleOption(option)}
                    />
                    <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-stone-900' : 'text-stone-600 group-hover:text-stone-900'}`}>
                      &nbsp;{option}
                    </span>
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
