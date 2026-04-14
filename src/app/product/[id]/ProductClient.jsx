'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AddToCartButton from '../../../components/AddToCartButton';
import InfoModal from '../../../components/InfoModal';
import sizeIcon from '../../../assets/icons/size.png';

export default function ProductClient({ product }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const sliderRef = useRef(null);
  const { addToCart, cartItems } = useCart();

  const mainImgRef = useRef(null);

  // Hydration fix for instant cached image display
  useEffect(() => {
    if (mainImgRef.current?.complete) {
      setIsImageLoaded(true);
    }
    // Safety fallback
    const timer = setTimeout(() => setIsImageLoaded(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const hasSizes = product && product.sizes && product.sizes.length > 0;
  const isAvailable = product && (hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0);

  const galleryImages = [product.image, ...product.galleryLinks].filter(Boolean);

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
      throw new Error('no-size');
    }

    // Отримуємо поточну кількість цього товару в кошику
    const existingInCart = cartItems.find(item => item.id === product.id && item.size === selectedSize);
    const qtyInCart = existingInCart ? existingInCart.quantity : 0;

    let stockLimit = product.stock;
    if (selectedSize && product.sizes) {
      const sizeObj = product.sizes.find(s => s.name === selectedSize);
      if (sizeObj) stockLimit = sizeObj.quantity;
    }

    if (qtyInCart + 1 > (stockLimit ?? Infinity)) {
      toast.error('Більше немає в наявності');
      throw new Error('out-of-stock');
    }

    addToCart(product, selectedSize, 1);
    toast.success(`${product.name} додано до кошика!`, { icon: '🛍️' });
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      className="container product-details"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="product-gallery relative overflow-hidden group"
      >
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-stone-100 animate-pulse rounded-xl" />
        )}
        <div
          ref={sliderRef}
          className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory aspect-[4/5] bg-stone-50 rounded-xl"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'auto'
          }}
          onScroll={handleScroll}
        >
          {galleryImages.map((src, i) => (
            <div key={i} className="snap-center relative bg-stone-50 flex items-center justify-center overflow-hidden" style={{ flex: '0 0 100%', height: '100%' }}>
              <img
                ref={i === 0 ? mainImgRef : null}
                src={src}
                onLoad={() => i === 0 && setIsImageLoaded(true)}
                onError={() => i === 0 && setIsImageLoaded(true)}
                alt={`${product.name} - ${i === 0 ? 'Головне фото' : `Фото ${i + 1}`} | Дитячий одяг Store Olivka`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>
          ))}
        </div>

        {galleryImages.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute top-1/2 left-4 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-10 hidden md:flex hover:scale-110 active:scale-95 opacity-90 hover:opacity-100"
              style={{ backgroundColor: 'rgba(235, 215, 210, 0.95)', color: '#8c5a55' }}
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={scrollNext}
              className="absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-10 hidden md:flex hover:scale-110 active:scale-95 opacity-90 hover:opacity-100"
              style={{ backgroundColor: 'rgba(235, 215, 210, 0.95)', color: '#8c5a55' }}
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
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
              <div />
              <h3 className="m-0 leading-none text-center">
                Розмір <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal', marginLeft: '8px' }}>(Оберіть доступний)</span>
              </h3>
              <div className="flex items-center">
                {product.measurements && (
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="flex items-center justify-center -translate-y-3 hover:scale-110 active:scale-95 transition-transform"
                    style={{ marginLeft: 'calc(1cm - 10px)' }}
                  >
                    <img src={sizeIcon.src || sizeIcon} alt="Size Guide" className="w-12 h-12 object-contain" />
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
