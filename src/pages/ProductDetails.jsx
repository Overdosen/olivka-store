import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AddToCartButton from '../components/AddToCartButton';
import SEO from '../components/SEO';
import InfoModal from '../components/InfoModal';
import sizeIcon from '../assets/icons/size.png';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const sliderRef = useRef(null);
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
        const imageUrl = data.image_url 
          ? (data.image_url?.startsWith('http') ? data.image_url : `/images/${data.image_url}`)
          : '';
        setProduct({ ...data, image: imageUrl });
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container section text-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4rem' }}>
        <p className="font-serif italic text-[#524f25]/60">Завантаження...</p>
      </div>
    );
  }

  const hasSizes = product && product.sizes && product.sizes.length > 0;
  
  const isAvailable = product && 
    (hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0);

  const getGalleryLinks = () => {
    if (!product || !product.gallery) return [];
    let galleryLinks = [];
    if (Array.isArray(product.gallery)) {
      galleryLinks = product.gallery;
    } else if (typeof product.gallery === 'string') {
      try {
        if (product.gallery.startsWith('[')) {
          galleryLinks = JSON.parse(product.gallery);
        } else {
          // Postgres array string {}
          galleryLinks = product.gallery.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        }
      } catch(e) { console.error('Error parsing gallery', e); }
    }
    return galleryLinks.map(url => url.startsWith('http') ? url : `/images/${url}`);
  };

  const galleryImages = [
    product?.image,
    ...getGalleryLinks()
  ].filter(Boolean);

  const handleScroll = (e) => {
    const scrollAmount = e.target.scrollLeft;
    const width = e.target.clientWidth;
    const index = Math.round(scrollAmount / width);
    if (index !== activeSlide) setActiveSlide(index);
  };

  const scrollPrev = () => {
    if (sliderRef.current) {
      if (activeSlide === 0) {
        sliderRef.current.scrollTo({ left: sliderRef.current.scrollWidth, behavior: 'smooth' });
      } else {
        sliderRef.current.scrollBy({ left: -sliderRef.current.clientWidth, behavior: 'smooth' });
      }
    }
  };

  const scrollNext = () => {
    if (sliderRef.current) {
      if (activeSlide === galleryImages.length - 1) {
        sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        sliderRef.current.scrollBy({ left: sliderRef.current.clientWidth, behavior: 'smooth' });
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product || !isAvailable) return;
    if (hasSizes && !selectedSize) {
      toast.error('Будь ласка, оберіть розмір');
      // Re-throw so the button knows it didn't succeed
      throw new Error('no-size');
    }
    // We pass the size name to addToCart
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


  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="container product-details"
    >
      {product && (
        <SEO 
          title={product.name}
          description={product.meta_description || product.description}
          keywords={product.meta_keywords}
          image={product.image}
          type="product"
        />
      )}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="product-gallery relative overflow-hidden group"
      >
        <div 
          ref={sliderRef}
          className="flex overflow-x-auto snap-x snap-mandatory aspect-[4/5] bg-stone-50 rounded-xl"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          onScroll={handleScroll}
        >
          {galleryImages.map((src, i) => (
            <div key={i} className="snap-center relative bg-stone-50 flex items-center justify-center overflow-hidden" style={{ flex: '0 0 100%', height: '100%' }}>
              <img 
                src={src} 
                alt={`${product.name} - Фото ${i + 1}`} 
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
        
        {galleryImages.length > 1 && (
          <>
            <button 
              onClick={scrollPrev}
              className="absolute top-1/2 left-4 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-10 hidden md:flex hover:scale-110 active:scale-95 opacity-90 hover:opacity-100"
              style={{ 
                backgroundColor: 'rgba(235, 215, 210, 0.95)', 
                color: '#8c5a55'
              }}
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={scrollNext}
              className="absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-10 hidden md:flex hover:scale-110 active:scale-95 opacity-90 hover:opacity-100"
              style={{ 
                backgroundColor: 'rgba(235, 215, 210, 0.95)', 
                color: '#8c5a55'
              }}
            >
              <ChevronRight size={28} />
            </button>
            <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2.5 z-10">
              {galleryImages.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 ${i === activeSlide ? 'bg-stone-800 scale-125' : 'bg-white/80 hover:bg-white'}`}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="product-info"
      >
        <h1>{product.name}</h1>
        {product.sku && (
          <div style={{ color: '#524f25', opacity: 0.7, fontSize: '1rem', marginTop: '0.5rem' }}>
            Артикул: <span style={{ fontWeight: 500 }}>{product.sku}</span>
          </div>
        )}
        <div className="price">{product.price} грн</div>
        

        {hasSizes && (
          <div className="size-selector">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-6">
              <div /> {/* Spacer */}
              <h3 className="m-0 leading-none text-center">
                Розмір <span style={{fontSize: '0.8rem', color: '#888', fontWeight: 'normal', marginLeft: '8px'}}>(Оберіть доступний)</span>
              </h3>
              <div className="flex items-center">
                {product.measurements && (
                  <button 
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="flex items-center justify-center -translate-y-3 hover:scale-110 active:scale-95 transition-transform"
                    style={{ marginLeft: 'calc(1cm - 10px)' }}
                  >
                    <img src={sizeIcon} alt="Size Guide" className="w-12 h-12 object-contain" />
                  </button>
                )}
              </div>
            </div>
            <div className="size-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {product.sizes.map(size => {
                const isOutOfStock = size.quantity <= 0;
                return (
                  <button 
                    key={size.name}
                    className={`size-btn ${selectedSize === size.name ? 'active' : ''}`}
                    onClick={() => !isOutOfStock && setSelectedSize(size.name)}
                    disabled={isOutOfStock}
                    style={{
                      opacity: isOutOfStock ? 0.4 : 1,
                      textDecoration: isOutOfStock ? 'line-through' : 'none',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      backgroundColor: isOutOfStock ? '#f5f5f5' : undefined,
                      color: isOutOfStock ? '#999' : undefined
                    }}
                    title={isOutOfStock ? "Немає в наявності" : "В наявності"}
                  >
                    {size.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {isAvailable ? (
          <AddToCartButton
            onAdd={handleAddToCart}
            label="Додати до кошика"
            addedLabel="Додано до кошика"
          />
        ) : (
          <button
            disabled
            style={{
              width: '100%',
              height: '3.25rem',
              borderRadius: '9999px',
              backgroundColor: '#ccc',
              border: 'none',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'not-allowed',
              marginTop: '1rem',
            }}
          >
            Немає в наявності
          </button>
        )}

        <p className="desc" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>{product.description}</p>

        {product.details && product.details.length > 0 && (
          <ul className="details-list">
            {product.details.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
        )}
      </motion.div>

      <InfoModal 
        isOpen={isSizeGuideOpen} 
        onClose={() => setIsSizeGuideOpen(false)} 
        title="Заміри виробу" 
        type="static_text" 
        src={product.measurements} 
        maxWidth="max-w-[360px]"
      />
    </motion.main>
  );
}
