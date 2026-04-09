import React from 'react';

export default function ColorFilter({ selectedColors, onChange }) {
  const customColors = [
    { name: 'Молочний', hex: '#EAEAE8' },
    { name: 'Рожевий/пудра', hex: '#CC98B8' },
    { name: 'Сірий', hex: '#A8A4A7' },
    { name: 'Беж/коричневий', hex: '#987B66' },
    { name: 'Гірчичний', hex: '#C87615' },
  ];

  const toggleColor = (colorName) => {
    if (selectedColors.includes(colorName)) {
      onChange(selectedColors.filter(c => c !== colorName));
    } else {
      onChange([...selectedColors, colorName]);
    }
  };

  const isOther = selectedColors.length === 0;

  return (
    <div className="flex flex-col gap-4" style={{ paddingLeft: '8px' }}>
      {/* Інше / Всі кольори (Скидання) */}
      <button 
        onClick={() => onChange([])}
        className="w-full flex items-center gap-[14px] group cursor-pointer"
      >
        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-transform ${isOther ? 'ring-2 ring-offset-2 ring-stone-800 scale-110' : 'group-hover:scale-110'}`}
             style={{
               background: 'conic-gradient(from 180deg at 50% 50%, #FF0000 0deg, #FF8A00 60deg, #FFE600 120deg, #14FF00 180deg, #00A3FF 240deg, #0500FF 300deg, #FF0000 360deg)'
             }}>
        </div>
        <span className={`text-sm font-medium transition-colors ${isOther ? 'text-stone-900 font-bold' : 'text-stone-600 group-hover:text-stone-900'}`}>
          Всі кольори
        </span>
      </button>

      {/* Список кольорів */}
      {customColors.map((color) => {
        const isSelected = selectedColors.includes(color.name);
        return (
          <button 
            key={color.name}
            onClick={() => toggleColor(color.name)}
            className="w-full flex items-center gap-[14px] group cursor-pointer"
          >
            <div 
              className={`w-6 h-6 rounded-full shrink-0 shadow-sm border border-black/10 transition-transform ${isSelected ? 'ring-2 ring-offset-2 ring-stone-800 scale-110' : 'group-hover:scale-110'}`}
              style={{ backgroundColor: color.hex }}
            />
            <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-stone-900 font-bold' : 'text-stone-600 group-hover:text-stone-900'}`}>
              {color.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
