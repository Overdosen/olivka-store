import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function Category() {
  const { catId } = useParams();
  
  const [category, setCategory] = useState(
    catId ? null : { name: 'Весь каталог' }
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="section-title">{category?.name}</h1>
      
      {products.length === 0 && !loading ? (
        <div className="text-center" style={{padding: '4rem 0', color: 'var(--color-stone-500)'}}>
          <p>У цій категорії поки що немає товарів.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product, index) => {
            const hasSizes = product.sizes && product.sizes.length > 0;
            const isAvailable = hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0;
            
            return (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
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
        </div>
      )}
    </motion.main>
  );
}
