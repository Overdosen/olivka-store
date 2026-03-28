import { useParams, Link } from 'react-router-dom';
import { CATEGORIES, PRODUCTS } from '../data';
import { motion } from 'framer-motion';

export default function Category() {
  const { catId } = useParams();
  
  // Якщо catId немає, значить показуємо весь каталог
  const category = catId ? CATEGORIES.find(c => c.id === catId) : { name: 'Весь каталог' };
  const products = catId ? PRODUCTS.filter(p => p.categoryId === catId) : PRODUCTS;

  if (!category) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container section text-center"
      >
        <h2>Категорія не знайдена</h2>
        <Link to="/catalog" className="btn btn-primary" style={{marginTop: '2rem'}}>В каталог</Link>
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
      <h1 className="section-title">{category.name}</h1>
      
      {products.length === 0 ? (
        <div className="text-center" style={{padding: '4rem 0', color: 'var(--color-stone-500)'}}>
          <p>У цій категорії поки що немає товарів.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
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
      )}
    </motion.main>
  );
}
