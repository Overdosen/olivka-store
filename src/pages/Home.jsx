import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const carouselRef = useRef(null);

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

  useEffect(() => {
    if (featuredProducts.length <= 4) return;
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          const itemWidth = carouselRef.current.children[0].offsetWidth;
          carouselRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [featuredProducts]);

  const scroll = (dir) => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.children[0].offsetWidth;
      carouselRef.current.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Головна секція (Hero) */}
      <section className="hero">
        <img src="/images/banner.png" alt="Hero Banner" className="hero-banner-img" />
        <div className="hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Базовий одяг<br />
            для новонароджених,<br />
            який справді потрібен
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Натуральні тканини, продумані набори,<br />
            нічого зайвого для комфорту малюка<br />
            і спокою мами.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hero-buttons"
          >
            <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', backgroundColor: '#524f25' }}>
              Обрати набір
            </button>
            <Link to="/catalog" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', borderColor: '#524f25', color: '#524f25' }}>
              Перейти в каталог
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Рекомендовані товари */}
      <section id="catalog" className="section container">
        <h2 className="section-title">Популярні товари</h2>
        
        <div style={{ position: 'relative', padding: '0 10px', maxWidth: '1000px', margin: '0 auto' }}>
          {featuredProducts.length > 4 && (
            <button onClick={() => scroll(-1)} className="carousel-btn left"><ChevronLeft /></button>
          )}
          
          <div ref={carouselRef} className="hide-scrollbar" style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory', 
            padding: '1rem 0'
          }}>
            {featuredProducts.map((product, index) => {
              const hasSizes = product.sizes && product.sizes.length > 0;
              const isAvailable = hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0;
              
              return (
              <div 
                key={product.id}
                className="popular-card"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Link to={`/product/${product.id}`} className="popular-card-inner">
                  <div className="product-image-wrapper" style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden' }}>
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
                    <h3 className="product-title" style={{ fontSize: '0.95rem' }}>{product.name}</h3>
                    <p className="product-price">{product.price} грн</p>
                  </div>
                </Link>
              </div>
            )})}
          </div>

          {featuredProducts.length > 4 && (
            <button onClick={() => scroll(1)} className="carousel-btn right"><ChevronRight /></button>
          )}
        </div>
        
        <div className="text-center" style={{marginTop: '4rem'}}>
          <Link to="/catalog" className="btn btn-outline" style={{ padding: '0.75rem 3rem' }}>
            Весь каталог
          </Link>
        </div>
      </section>

      {/* Про нас */}
      <section id="about" className="section container">
        <h2 className="section-title">Про нас</h2>
        <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <Link to="#" className="product-card" style={{ padding: '2rem', backgroundColor: 'var(--color-stone-100)', borderRadius: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px', textDecoration: 'none' }}>
            <h3 className="product-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Публічна оферта</h3>
            <p style={{ color: 'var(--color-stone-500)', fontSize: '0.875rem' }}>Умови надання послуг та правила</p>
          </Link>
          <Link to="#" className="product-card" style={{ padding: '2rem', backgroundColor: 'var(--color-stone-100)', borderRadius: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px', textDecoration: 'none' }}>
            <h3 className="product-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Куточок споживача</h3>
            <p style={{ color: 'var(--color-stone-500)', fontSize: '0.875rem' }}>Важлива інформація для покупців</p>
          </Link>
        </div>
      </section>
    </motion.main>
  );
}
