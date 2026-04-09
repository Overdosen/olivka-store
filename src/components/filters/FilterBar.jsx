import { useMemo } from 'react';
import { X } from 'lucide-react';
import FilterDropdown from './FilterDropdown';

// Map of common color names to hex codes for cases where DB only has names
const COLOR_MAP = {
  'молочний': '#EAEAE8',
  'рожевий/пудра': '#CC98B8',
  'рожевий': '#FFC0CB',
  'сірий': '#A8A4A7',
  'беж/коричневий': '#987B66',
  'бежевий': '#F5F5DC',
  'коричневий': '#8B4513',
  'гірчичний': '#C87615',
  'синій': '#0000FF',
  'блакитний': '#87CEEB',
  'зелений': '#008000',
  'жовтий': '#FFFF00',
  'червоний': '#FF0000',
  'м\'ятний': '#98FF98',
  'лаванда': '#E6E6FA',
  'персиковий': '#FFDAB9'
};

export default function FilterBar({ products, filters, setFilters, onClear, options, categoryName }) {
  // Extract all available colors from products for dynamic filtering
  const availableColors = useMemo(() => {
    const colorMap = new Map();

    products.forEach(product => {
      if (!product.color) return;

      const colors = Array.isArray(product.color) ? product.color : [product.color];

      colors.forEach(c => {
        if (!c) return;

        let name, hex;

        if (typeof c === 'object' && c.name) {
          name = c.name;
          hex = c.hex || COLOR_MAP[c.name.toLowerCase()] || '#CCCCCC';
        } else if (typeof c === 'string') {
          name = c;
          hex = COLOR_MAP[c.toLowerCase()] || '#CCCCCC';
        }

        if (name) {
          colorMap.set(name, { name, hex });
        }
      });
    });

    return Array.from(colorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.gender ||
      (filters.sizes && filters.sizes.length > 0) ||
      (filters.ages && filters.ages.length > 0) ||
      (filters.materials && filters.materials.length > 0) ||
      (filters.colors && filters.colors.length > 0) ||
      (filters.features && filters.features.length > 0)
    );
  }, [filters]);

  const genderOptions = ['Хлопчик', 'Дівчинка', 'Унісекс'];

  return (
    <div className="flex flex-col" style={{ gap: '14px', paddingTop: '8px' }}>
      {/* Gender Filter */}
      {categoryName !== 'Текстиль (пелюшки, пледи)' && (
        <FilterDropdown
          label=" Стать "
          options={genderOptions}
          selected={filters.gender}
          onSelect={(val) => setFilters(prev => ({ ...prev, gender: val }))}
          isSingleSelect={true}
          className="rounded-sm"
        />
      )}

      {/* Size Filter */}
      <FilterDropdown
        label=" Розмір  "
        options={categoryName === 'Текстиль (пелюшки, пледи)'
          ? ['100*80 см', '100*75 см', '75*50 см']
          : options.sizes.filter(s => !s.includes('*'))
        }
        selected={filters.sizes}
        onSelect={(val) => setFilters(prev => ({ ...prev, sizes: val }))}
        className="rounded-sm"
      />

      {/* Age Filter */}
      {categoryName !== 'Текстиль (пелюшки, пледи)' && (
        <FilterDropdown
          label=" Вік   "
          options={options.ages}
          selected={filters.ages}
          onSelect={(val) => setFilters(prev => ({ ...prev, ages: val }))}
          className="rounded-sm"
        />
      )}

      {/* Material Filter */}
      <FilterDropdown
        label=" Матеріал  "
        options={categoryName === 'Текстиль (пелюшки, пледи)'
          ? ['Бавовна', 'Фланель', 'Муслін', 'Непромокаюча']
          : options.materials.filter(m => !['Бавовна', 'Фланель', 'Непромокаюча'].includes(m))
        }
        selected={filters.materials}
        onSelect={(val) => setFilters(prev => ({ ...prev, materials: val }))}
        className="rounded-sm"
      />

      {/* Colors Filter */}
      {availableColors.length > 0 && (
        <FilterDropdown
          label=" Кольори  "
          options={availableColors}
          selected={filters.colors}
          onSelect={(val) => setFilters(prev => ({ ...prev, colors: val }))}
          className="rounded-sm"
          renderOption={(color, active) => (
            <div className="flex items-center space-x-5 w-full p-2">
              <div className="relative group/color shrink-0">
                <div
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${active ? 'border-white scale-110 shadow-lg' : 'border-white shadow-sm ring-1 ring-stone-200 hover:ring-stone-400'}`}
                  style={{ backgroundColor: color.hex }}
                />
                {active && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  </div>
                )}
              </div>
              <span className={`font-medium transition-colors ${active ? 'font-bold' : ''}`} style={{ fontSize: '1.0rem', color: '#524f25' }}>
                &nbsp;&nbsp;{color.name}
              </span>
            </div>
          )}
        />
      )}

      {/* Features Filter */}
      {['Комплекти', 'Боді', 'Пісочники, ромпери', 'Чепчики, шапочки', 'Костюми, сукні'].includes(categoryName) && (
        <FilterDropdown
          label=" Особливості моделі  "
          options={(() => {
            if (categoryName === 'Боді') return options.features.filter(f => f.includes('рукав'));
            if (categoryName === 'Пісочники, ромпери') return options.features.filter(f => ['Пісочник', 'Ромпер'].includes(f));
            if (categoryName === 'Чепчики, шапочки') return options.features.filter(f => ['Шапочка-вузлик', 'Чепчик'].includes(f));
            if (categoryName === 'Костюми, сукні') return options.features.filter(f => ['Костюм', 'Сукня', 'Футболка/шорти', 'Лонгслів/штани'].includes(f));
            return options.features.filter(f => ['З боді', 'З сорочкою', 'З шапочкою', 'Без шапочки'].includes(f));
          })()}
          selected={filters.features}
          onSelect={(val) => setFilters(prev => ({ ...prev, features: val }))}
          className="rounded-sm"
        />
      )}

      {/* Clear All Button */}
      {hasActiveFilters && (
        <div className="pt-6">
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center space-x-2 py-6 text-stone-400 hover:text-stone-800 transition-colors group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-bold uppercase tracking-widest">&nbsp;Очистити</span>
          </button>
        </div>
      )}
    </div>
  );
}
