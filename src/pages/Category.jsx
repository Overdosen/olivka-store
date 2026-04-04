import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { Filter, X } from 'lucide-react';
import GenderRadio from '../components/filters/GenderRadio';
import FilterDropdown from '../components/filters/FilterDropdown';
import ColorFilter from '../components/filters/ColorFilter';

export default function Category() {
  const { catId } = useParams();
  
  const [category, setCategory] = useState(
    catId ? null : { name: 'Весь каталог' }
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedAges, setSelectedAges] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Options
  const sizeOptions = ['56', '56-62', '62', '62-68', '74', '80', '86', '92'];
  const ageOptions = ['0-1 місяць', '0-3 місяці', '1-3 місяці', '3-6 місяців', '6-9 місяців', '9-12 місяців', '12-18 місяців', '2 роки'];
  const materialOptions = ['Інтерлок', 'Футер', 'Перфорація', 'Муслін', 'Бавовна'];

  useEffect(() => {
    async function fetchCategoryData() {
      setLoading(true);
      
      // Спершу отримуємо назву категорії, якщо це не "Весь каталог"
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

      // Потім отримуємо товари
      let query = supabase.from('products').select('*');
      
      if (catId) {
        query = query.eq('category_id', catId);
      }
      
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

  if (loading) {
    return (
      <div className="container section text-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4rem' }}>
        <p className="font-serif italic text-[#524f25]/60">Завантаження...</p>
      </div>
    );
  }

  if (!category && !loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container section text-center"
      >
        <h2>Категорія не знайдена</h2>
        <Link to="/catalog" className="btn btn-primary" style={{marginTop: '2rem'}}>До каталогу</Link>
      </motion.div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="container section"
    >
      <SEO 
        title={category?.name || 'Каталог'}
        description={`Переглядайте наш асортимент товарів у категорії "${category?.name || 'Всі товари'}". Обирайте найкращі речі для ваших малюків в Olivka Store.`}
      />
      
      <div className="relative mb-2 text-center -translate-y-10">
        <h1 className="section-title !mb-0">{category?.name}</h1>
        <button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-2 px-4 py-2 border border-stone-200 rounded-full font-medium text-stone-700 bg-white"
        >
          <Filter className="w-4 h-4" />
          <span>Фільтри</span>
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-14">
        
        {/* Адаптивний Sidebar */}
        <div className={`fixed inset-0 z-50 bg-black/50 transition-opacity lg:hidden ${isMobileFiltersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileFiltersOpen(false)} />
        <aside className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-stone-50 p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:w-[260px] lg:shrink-0 lg:p-0 lg:bg-transparent lg:z-auto ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ marginTop: '0px', marginLeft: '65px', position: 'relative' }}>
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h2 className="text-xl font-bold text-stone-800">Фільтри</h2>
            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 border rounded-full text-stone-500 bg-white shadow-sm">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="lg:sticky lg:top-24 pl-2" style={{ marginTop: '-95px', marginLeft: '65px', position: 'relative' }}>
            <div className="flex justify-center w-[160px]">
              <GenderRadio value={selectedGender} onChange={setSelectedGender} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 w-[160px]" style={{ marginTop: '20px' }}>
              <FilterDropdown label="Розмір" options={sizeOptions} selected={selectedSizes} onChange={setSelectedSizes} />
              <FilterDropdown label="Вік" options={ageOptions} selected={selectedAges} onChange={setSelectedAges} />
              <FilterDropdown label="Матеріал" options={materialOptions} selected={selectedMaterials} onChange={setSelectedMaterials} />
            </div>
            <div style={{ marginTop: '4vh' }}>
              <ColorFilter selectedColors={selectedColors} onChange={setSelectedColors} />
            </div>
            
            <button 
              onClick={() => {
                setSelectedGender('');
                setSelectedSizes([]);
                setSelectedAges([]);
                setSelectedMaterials([]);
                setSelectedColors([]);
                setIsMobileFiltersOpen(false);
              }}
              className="btn btn-primary w-[130px] block mx-auto !py-3 tracking-widest text-xs uppercase"
              style={{ marginTop: '4vh' }}
            >
              Очистити
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="w-full lg:flex-1 mt-6 lg:mt-0" style={{ marginLeft: '-20%' }}>
          {products.length === 0 && !loading ? (
            <div className="text-center" style={{padding: '4rem 0', color: 'var(--color-stone-500)'}}>
              <p>У цій категорії поки що немає товарів.</p>
            </div>
          ) : (
            <div className="products-grid">
              <AnimatePresence mode="popLayout">
                {products.filter(product => {
                  if (selectedGender && product.gender !== selectedGender) return false;
                  if (selectedSizes.length > 0) {
                    if (!product.sizes || !product.sizes.some(s => selectedSizes.includes(s.name))) return false;
                  }
                  if (selectedAges.length > 0) {
                    if (!product.age || !product.age.some(a => selectedAges.includes(a))) return false;
                  }
                  if (selectedMaterials.length > 0) {
                    if (!product.material || !product.material.some(m => selectedMaterials.includes(m))) return false;
                  }
                  if (selectedColors.length > 0) {
                    if (!product.color || !product.color.some(c => selectedColors.includes(c))) return false;
                  }
                  return true;
                }).map((product, index) => {
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
                )})}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
