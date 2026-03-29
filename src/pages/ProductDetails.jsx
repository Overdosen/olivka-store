import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { PRODUCTS as STATIC_PRODUCTS } from '../data';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(STATIC_PRODUCTS.find(p => p.id === id));
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Помилка при завантаженні товару:', error);
      } else if (data) {
        setProduct({ ...data, image: data.image_url });
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Будь ласка, оберіть розмір');
      return;
    }
    addToCart(product, selectedSize);
    toast.success(`${product.name} додано до кошика!`, {
      icon: '🛍️',
    });
  };

  if (!product && !loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container section text-center"
      >
        <h2>Товар не знайдено</h2>
        <Link to="/catalog" className="btn btn-primary" style={{marginTop: '2rem'}}>До каталогу</Link>
      </motion.div>
    );
  }

  if (loading && !product) {
    return (
      <div className="container section text-center">
        <h2>Завантаження...</h2>
      </div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="container product-details"
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="product-gallery"
      >
        <img src={product.image} alt={product.name} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="product-info"
      >
        <h1>{product.name}</h1>
        <div className="price">{product.price} грн</div>
        
        <p className="desc">{product.description}</p>

        {product.sizes && product.sizes.length > 0 && (
          <div className="size-selector">
            <h3>Розмір</h3>
            <div className="size-grid">
              {product.sizes.map(size => (
                <button 
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <motion.button 
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '1rem' }}
          onClick={handleAddToCart}
        >
          <ShoppingBag size={20} style={{marginRight: '0.5rem'}} />
          Додати до кошика
        </motion.button>

        {product.details && product.details.length > 0 && (
          <ul className="details-list">
            {product.details.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
        )}
      </motion.div>
    </motion.main>
  );
}
