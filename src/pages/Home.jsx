import { CATEGORIES, PRODUCTS } from '../data';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Section */}
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

      {/* Featured Products */}
      <section id="catalog" className="section container">
        <h2 className="section-title">Новинки</h2>
        <div className="products-grid">
          {PRODUCTS.filter(p => p.isNew).map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={`/product/${product.id}`} className="product-card">
                <div className="product-image-wrapper">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="product-image"
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-price">{product.price} грн</p>
                </div>
              </Link>
            </motion.div>
          ))}
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
