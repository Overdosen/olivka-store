'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import FilterBar from '../../../components/filters/FilterBar';

export default function CategoryClient({ initialCategory, initialProducts }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [category] = useState(initialCategory);
  const [products] = useState(initialProducts);

  // Initialize filters from URL search params
  const getInitialFilters = () => {
    return {
      gender: searchParams.get('gender') || '',
      sizes: searchParams.get('sizes')?.split(',').filter(Boolean) || [],
      ages: searchParams.get('ages')?.split(',').filter(Boolean) || [],
      materials: searchParams.get('materials')?.split(',').filter(Boolean) || [],
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
      features: searchParams.get('features')?.split(',').filter(Boolean) || []
    };
  };

  // Unified Filters state
  const [filters, setFilters] = useState(getInitialFilters);

  // Sync state with URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.gender) params.set('gender', filters.gender);
    if (filters.sizes.length > 0) params.set('sizes', filters.sizes.join(','));
    if (filters.ages.length > 0) params.set('ages', filters.ages.join(','));
    if (filters.materials.length > 0) params.set('materials', filters.materials.join(','));
    if (filters.colors.length > 0) params.set('colors', filters.colors.join(','));
    if (filters.features.length > 0) params.set('features', filters.features.join(','));

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    
    router.replace(url, { scroll: false });
  }, [filters, pathname, router]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Options
  const filterOptions = {
    sizes: ['56', '56-62', '62', '62-68', '74', '80', '86', '92', '100*80 см', '100*75 см', '75*50 см'],
    ages: ['0-1 місяць', '0-3 місяці', '1-3 місяці', '3-6 місяців', '6-9 місяців', '9-12 місяців', '12-18 місяців', '2 роки'],
    materials: ['Бавовна', 'Фланель', 'Муслін', 'Непромокаюча', 'Інтерлок', 'Футер', 'Перфорація'],
    features: [
      'З боді', 'З сорочкою', 'З шапочкою', 'Без шапочки',
      'Короткий рукав', 'Довгий рукав',
      'Пісочник', 'Ромпер',
      'Шапочка-вузлик', 'Чепчик',
      'Костюм', 'Сукня', 'Футболка/шорти', 'Лонгслів/штани'
    ]
  };

  const clearFilters = () => {
    setFilters({
      gender: '',
      sizes: [],
      ages: [],
      materials: [],
      colors: [],
      features: []
    });
  };

  const filteredProducts = products.filter(product => {
    if (filters.gender && product.gender !== filters.gender) return false;
    if (filters.sizes.length > 0) {
      if (!product.sizes || !product.sizes.some(s => filters.sizes.includes(s.name))) return false;
    }
    if (filters.ages.length > 0) {
      if (!product.age || !product.age.some(a => filters.ages.includes(a))) return false;
    }
    if (filters.materials.length > 0) {
      if (!product.material || !product.material.some(m => filters.materials.includes(m))) return false;
    }
    if (filters.colors.length > 0) {
      if (!product.color || !product.color.some(c => filters.colors.includes(c))) return false;
    }
    if (filters.features && filters.features.length > 0) {
      if (!product.features || !product.features.some(f => filters.features.includes(f))) return false;
    }
    return true;
  });

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container-wide section"
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-2 lg:mb-12 -translate-y-10">
        <div className="hidden lg:block w-[261px] shrink-0"></div>
        <div className="flex-1 text-center">
          <h1 className="section-title !mb-4">{category?.name}</h1>
          {category?.description && (
            <p className="text-[14px] text-stone-400 font-medium -mt-2 mb-6 tracking-wide">
              {category.description}
            </p>
          )}
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="lg:hidden mx-auto inline-flex justify-center items-center space-x-2 px-6 py-3 border border-stone-200 rounded-full font-medium text-stone-700 bg-white shadow-sm active:scale-95 transition-transform"
          >
            <Filter className="w-4 h-4" />
            <span>Фільтри {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== '') && <span className="ml-1 w-2 h-2 bg-stone-800 rounded-full" />}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        <aside className="hidden lg:block w-[261px] shrink-0 sticky top-32 self-start">
          <FilterBar
            products={products}
            filters={filters}
            setFilters={setFilters}
            onClear={clearFilters}
            options={filterOptions}
            categoryName={category?.name}
          />
        </aside>

        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center" style={{ padding: '4rem 0', color: 'var(--color-stone-500)' }}>
              <p>У цій категорії поки що немає товарів.</p>
            </div>
          ) : (
            <div className="products-grid !grid-cols-2 md:!grid-cols-4 xl:!grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-[280px] bg-stone-50 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="p-6 pb-2 relative flex items-center justify-center border-b border-stone-100">
                <h2 className="font-bold font-sans text-[#524f25]" style={{ fontSize: '1.4rem' }}>Фільтри</h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="absolute right-6 p-2 border border-stone-200 rounded-full text-stone-500 bg-white shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-6 custom-scrollbar">
                <FilterBar
                  products={products}
                  filters={filters}
                  setFilters={setFilters}
                  onClear={clearFilters}
                  options={filterOptions}
                  categoryName={category?.name}
                />
                <div className="h-12" />
              </div>

              <div className="p-6 bg-stone-50/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-15px_35px_rgba(82,79,37,0.08)]">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full btn btn-primary !py-4 shadow-lg active:scale-95 transition-transform"
                >
                  Показати товари ({filteredProducts.length})
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function ProductCard({ product, index }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);
  const hasSizes = product.sizes && product.sizes.length > 0;
  const isAvailable = hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0;

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.04, 0.35),
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      <Link href={`/product/${product.id}`} className="product-card">
        <div className="product-image-wrapper relative overflow-hidden bg-stone-100 aspect-[4/5]">
          {!isLoaded && (
            <div className="absolute inset-0 bg-stone-100 animate-pulse z-10" />
          )}
          <img
            ref={imgRef}
            src={product.image?.startsWith('http') ? product.image : `/images/${product.image}`}
            alt={product.name}
            onLoad={() => setIsLoaded(true)}
            className={`product-image absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            style={{ opacity: isAvailable ? undefined : 0.6 }}
          />
          {!isAvailable && (
            <div className="absolute top-2 left-2 bg-stone-800/80 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider z-20">
              Немає в наявності
            </div>
          )}
        </div>
        <div className="product-info" style={{ opacity: isAvailable ? 1 : 0.6 }}>
          <h3 className="product-title leading-tight line-clamp-2"><span>{product.name}</span></h3>
          <p className="product-price">{product.price} грн</p>
        </div>
      </Link>
    </motion.div>
  );
}
