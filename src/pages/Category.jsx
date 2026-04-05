import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { Filter, X } from 'lucide-react';
import FilterBar from '../components/filters/FilterBar';

export default function Category() {
  const { catId } = useParams();
  
  const [category, setCategory] = useState(
    catId ? null : { name: 'Весь каталог' }
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unified Filters state
  const [filters, setFilters] = useState({
    gender: '',
    sizes: [],
    ages: [],
    materials: [],
    colors: []
  });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Options
  const filterOptions = {
    sizes: ['56', '56-62', '62', '62-68', '74', '80', '86', '92'],
    ages: ['0-1 місяць', '0-3 місяці', '1-3 місяці', '3-6 місяців', '6-9 місяців', '9-12 місяців', '12-18 місяців', '2 роки'],
    materials: ['Інтерлок', 'Футер', 'Перфорація', 'Муслін', 'Бавовна']
  };

  const clearFilters = () => {
    setFilters({
      gender: '',
      sizes: [],
      ages: [],
      materials: [],
      colors: []
    });
    setIsMobileFiltersOpen(false);
  };

  useEffect(() => {
    async function fetchCategoryData() {
      setLoading(true);
      
      if (catId) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('name')
          .eq('id', catId)
          .single();
        
        if (!catError && catData) {
          setCategory({ id: catId, name: catData.name });
        }
      } else {
        setCategory({ name: 'Весь каталог' });
      }

      let query = supabase.from('products').select('*');
      if (catId) query = query.eq('category_id', catId);
      
      const { data: prodData, error: prodError } = await query;
      
      if (prodError) {
        console.error('Помилка при завантаженні товарів:', prodError);
      } else if (prodData) {
        setProducts(prodData.map(p => ({ ...p, image: p.image_url })));
      }
      
      setLoading(false);
    }

    fetchCategoryData();
  }, [catId]);

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
    return true;
  });

  if (loading) {
    return (
      <div className="container section text-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4rem' }}>
        <p className="font-serif italic text-[#524f25]/60">Завантаження...</p>
      </div>
    );
  }

  if (!category && !loading) {
    return (
      <div className="container section text-center">
        <h2>Категорія не знайдена</h2>
        <Link to="/catalog" className="btn btn-primary" style={{marginTop: '2rem'}}>До каталогу</Link>
      </div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="container-wide section"
    >
      <SEO 
        title={category?.name || 'Каталог'}
        description={`Переглядайте наш асортимент товарів у категорії "${category?.name || 'Всі товари'}". Обирайте найкращі речі для ваших малюків в Olivka Store.`}
      />
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-2 lg:mb-12 -translate-y-10">
        {/* Placeholder to compensate for sidebar width on desktop */}
        <div className="hidden lg:block w-[212px] shrink-0"></div>
        
        <div className="flex-1 text-center">
          <h1 className="section-title !mb-4">{category?.name}</h1>
          
          {/* Mobile Filter Toggle */}
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
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[212px] shrink-0 sticky top-24 self-start">
          <FilterBar
            products={products}
            filters={filters}
            setFilters={setFilters}
            onClear={clearFilters}
            options={filterOptions}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {filteredProducts.length === 0 && !loading ? (
            <div className="text-center" style={{padding: '4rem 0', color: 'var(--color-stone-500)'}}>
              <p>У цій категорії поки що немає товарів.</p>
            </div>
          ) : (
            <div className="products-grid !grid-cols-3 md:!grid-cols-4 xl:!grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const hasSizes = product.sizes && product.sizes.length > 0;
                  const isAvailable = hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0;
                  
                  return (
                    <motion.div 
                      layout="position"
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        opacity: { duration: 0.4, ease: "easeOut" },
                        layout: { duration: 0.25, ease: "easeInOut" }
                      }}
                    >
                      <Link to={`/product/${product.id}`} className="product-card">
                        <div className="product-image-wrapper" style={{ position: 'relative' }}>
                          <img 
                            src={product.image?.startsWith('http') ? product.image : `/images/${product.image}`}  
                            alt={product.name} 
                            className="product-image"
                            style={{ opacity: isAvailable ? 1 : 0.6 }}
                          />
                          {!isAvailable && (
                            <div style={{
                              position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(28, 25, 23, 0.85)', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10
                            }}>
                              Немає в наявності
                            </div>
                          )}
                        </div>
                        <div className="product-info" style={{ opacity: isAvailable ? 1 : 0.6 }}>
                          <h3 className="product-title">{product.name}</h3>
                          <p className="product-price">{product.price} грн</p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Drawer */}
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
              className="fixed inset-y-0 left-0 z-[70] w-[85%] max-w-sm bg-stone-50 p-6 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-stone-800 font-serif lowercase italic">Фільтри</h2>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 border rounded-full text-stone-500 bg-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6 pb-20">
                <FilterBar
                  products={products}
                  filters={filters}
                  setFilters={setFilters}
                  onClear={clearFilters}
                  options={filterOptions}
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-stone-50 border-t border-stone-200">
                <button 
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full btn btn-primary !py-4"
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
