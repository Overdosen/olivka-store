import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PRODUCTS as STATIC_PRODUCTS } from '../data';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState(STATIC_PRODUCTS.filter(p => p.isNew));

  useEffect(() => {
    async function fetchNewArrivals() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_new', true);
      
      if (error) {
        console.error('Помилка при завантаженні новинок:', error);
      } else if (data) {
        // Мапимо image_url у image для сумісності
        setFeaturedProducts(data.map(p => ({ ...p, image: p.image_url })));
      }
    }
    fetchNewArrivals();
  }, []);

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Головна секція (Hero) */}
      <section className="hero">
        <div className="hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Ніжність у кожній деталі
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Естетичний та комфортний одяг для ваших малюків. 
            Створюємо речі, в які закохуєшся з першого дотику.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link to="/catalog" className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>
              Дивитися колекцію
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Рекомендовані товари */}
      <section id="catalog" className="section container">
        <h2 className="section-title">Новинки</h2>
        <div className="products-grid">
          {featuredProducts.map((product, index) => {
            const hasSizes = product.sizes && product.sizes.length > 0;
            const isAvailable = hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0;
            
            return (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
        
        <div className="text-center" style={{marginTop: '4rem'}}>
          <Link to="/catalog" className="btn btn-outline" style={{ padding: '0.75rem 3rem' }}>
            Весь каталог
          </Link>
        </div>
      </section>
    </motion.main>
  );
}
