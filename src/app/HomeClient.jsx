'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import Image from 'next/image';
import cottonIcon from '../assets/icons/cotton.png';
import motherIcon from '../assets/icons/mother.png';
import deliveryIcon from '../assets/icons/deliveryandpay.png';
import giftIcon from '../assets/icons/gift.png';
import InfoModal from '../components/InfoModal';
import BlogPreviewSection from '../components/blog/BlogPreviewSection';
import StoreReviews from '../components/StoreReviews';

function ProductCard({ product }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);
  const hasSizes = product.sizes && product.sizes.length > 0;
  const isAvailable = hasSizes ? product.sizes.some(s => s.quantity > 0) : product.stock > 0;

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div className="popular-card" style={{ scrollSnapAlign: 'start' }}>
      <Link href={`/product/${product.id}`} className="popular-card-inner">
        <div className="product-image-wrapper" style={{ position: 'relative', aspectRatio: '3 / 4' }}>
          {!isLoaded && (
            <div className="absolute inset-0 bg-stone-100 animate-pulse z-10" />
          )}
          <Image
            src={product.image?.startsWith('http') ? product.image : `/images/${product.image}`}
            alt={product.name}
            fill
            onLoad={() => setIsLoaded(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
            className={`product-image ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            style={{
              objectFit: 'cover',
              opacity: isAvailable ? (isLoaded ? 1 : 0) : 0.6
            }}
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
          <h3 className="product-title"><span>{product.name}</span></h3>
          <p className="product-price">{product.price} грн</p>
        </div>
      </Link>
    </div>
  );
}

export default function HomeClient({ blogPosts = [] }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const carouselRef = useRef(null);
  const [activeFeature, setActiveFeature] = useState(null);

  const features = [
    {
      id: 'cotton',
      icon: cottonIcon,
      title: '100% бавовна',
      desc: 'ніжна та безпечна',
      tooltip: 'Якість та Комфорт',
      content: "Ми використовуємо бавовну найвищої якості. Це натуральний матеріал, який дозволяє шкірі дихати, не викликає алергічних реакцій та дарує неперевершене відчуття м'якості. Кожна ниточка ретельно відібрана для того, щоб забезпечити комфорт та безпеку вашому малюку з перших днів життя."
    },
    {
      id: 'mother',
      icon: motherIcon,
      title: 'Перевірено мамами',
      desc: 'нам довіряють найцінніше',
      tooltip: 'нам довіряють найцінніше',
      content: "Ми обираємо для ваших малюків те, що обрали б для власних дітей. Кожна модель у нашому магазині пройшла перевірку реальними життєвими ситуаціями. Ми уважно прислухаємося до кожної мами, щоб пропонувати лише той одяг, де кожна застібка та кожен шов на своєму місці. Ваша довіра допомагає нам пропонувати вам найкраще, що полегшує щоденний догляд за крихіткою."
    },
    {
      id: 'delivery',
      icon: deliveryIcon,
      title: 'Швидка відправка',
      desc: '1-2 дні по Україні',
      tooltip: 'Ваша швидка доставка',
      content: "Ми цінуємо ваш час, тому організували логістику так, щоб замовлення потрапляло до вас якнайшвидше. Відправка здійснюється протягом 1-2 днів по всій Україні через надійних операторів доставки. Ви отримаєте номер ТТН відразу після відправки, щоб мати можливість відстежувати свою посилку в режимі реального часу. При замовленні на суму від 2500 грн доставка за наш рахунок — це наш спосіб подякувати вам за довіру."
    },
    {
      id: 'gift',
      icon: giftIcon,
      title: 'Подарунок від 450₴',
      desc: 'маленька турбота від нас',
      tooltip: 'Сюрприз у посилці',
      content: "Ми обожнюємо дарувати радість, тому кожне ваше замовлення на суму від 450 грн супроводжується приємним сюрпризом. До кожної такої посилки ми додаємо корисний подарунок — м'які шкарпетки або ніжний рушничок. Для нас важливо, щоб ви відчували щиру турботу про комфорт вашого малюка з першої хвилини знайомства з нашим магазином."
    }
  ];

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

  const scroll = (dir) => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const itemWidth = carouselRef.current.children[0]?.offsetWidth || 300;

      if (dir === 1 && scrollLeft + clientWidth >= scrollWidth - 10) {
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (dir === -1 && scrollLeft <= 10) {
        carouselRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
      }
    }
  };

  return (
    <main>
      {/* Головна секція (Hero) */}
      <section className="hero" style={{
        position: 'relative',
        overflow: 'visible', /* Тепер дівчинка не буде обрізана знизу */
        height: 'auto',
        backgroundColor: '#fdfbf7'
      }}>

        <div className="mobile-only">
          <img
            src="/images/bannermobile.png"
            alt="Store Olivka Mobile Banner"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>

        <div className="desktop-only" style={{ position: 'relative', width: '100%', minHeight: '350px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1920 / 600' }}>
            <Image
              src="/images/emptybanner.png"
              alt="Hero Background"
              fill
              priority
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>

          <div className="cloud-layer cloud-1" style={{ top: '10%', left: 0, width: '260px', height: '150px', opacity: 0.5, zIndex: 1 }}>
            <Image src="/images/oblako.png" alt="Cloud" fill style={{ objectFit: 'contain' }} />
          </div>

          <div className="cloud-layer cloud-2" style={{ top: '35%', left: 0, width: '180px', height: '100px', opacity: 0.4, zIndex: 2 }}>
            <Image src="/images/oblako.png" alt="Cloud" fill style={{ objectFit: 'contain' }} />
          </div>

          <div className="cloud-layer cloud-3" style={{ top: '55%', left: 0, width: '310px', height: '180px', opacity: 0.35, zIndex: 3 }}>
            <Image src="/images/oblako.png" alt="Cloud" fill style={{ objectFit: 'contain' }} />
          </div>

          <div className="cloud-layer cloud-4" style={{ top: '15%', left: 0, width: '200px', height: '120px', opacity: 0.45, zIndex: 1 }}>
            <Image src="/images/oblako.png" alt="Cloud" fill style={{ objectFit: 'contain' }} />
          </div>

          <div className="cloud-layer cloud-5" style={{ top: '42%', left: 0, width: '240px', height: '140px', opacity: 0.3, zIndex: 2 }}>
            <Image src="/images/oblako.png" alt="Cloud" fill style={{ objectFit: 'contain' }} />
          </div>

          <div className="cloud-layer cloud-6" style={{ top: '28%', left: 0, width: '150px', height: '90px', opacity: 0.4, zIndex: 1 }}>
            <Image src="/images/oblako.png" alt="Cloud" fill style={{ objectFit: 'contain' }} />
          </div>

          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '-22%', /* Тепер вона рівно сидить на панелі */
            width: '23%',
            aspectRatio: '1 / 1.5',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <Image
                src="/images/girl.png"
                alt="Girl"
                fill
                priority
                style={{ objectFit: 'contain' }}
              />
            </motion.div>
          </div>

          <div
            className="stork-float"
            style={{
              position: 'absolute',
              right: '10%',
              top: '12%',
              width: '25%',
              aspectRatio: '1 / 1',
              zIndex: 11,
              pointerEvents: 'none'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <Image
                src="/images/leleka.png"
                alt="Stork"
                fill
                priority
                style={{ objectFit: 'contain' }}
              />
            </motion.div>
          </div>

        </div>

        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Естетика та комфорт <br className="sm-hidden" />
            з перших днів життя<br className="sm-hidden" />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Базовий одяг із натуральних тканин, <br className="sm-hidden" />
            нічого зайвого — тільки затишок для малюка <br className="sm-hidden" />
            та спокій для мами.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hero-buttons"
          >
            <Link href="/category/sets" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', backgroundColor: '#524f25', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Обрати набір
            </Link>
            <Link href="/catalog" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '0.9rem', borderColor: '#524f25', color: '#524f25' }}>
              Перейти в каталог
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="mb-12 w-full">
        <nav className="bg-[#f0ede4]/90 px-4 sm:px-10 py-5 sm:py-6 shadow-[0_10px_40px_rgba(82,79,37,0.12)] border-b border-[#524f25]/10 backdrop-blur-md w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {features.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveFeature(item)}
                type="button"
                className="bg-transparent border-none p-0 m-0 outline-none block"
              >
                <div className="relative group flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer active:scale-95 transition-transform duration-100">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center relative">
                    <Image
                      src={item.icon?.src || item.icon}
                      alt={item.title}
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="font-serif text-[#524f25] text-sm sm:text-base font-bold leading-tight">{item.title}</span>
                    <span className="font-sans text-[#524f25]/70 text-[8px] sm:text-[10px] uppercase tracking-widest mt-0.5">{item.desc}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </nav>
      </div>


      <section id="catalog" className="section container">
        <h2 className="section-title">Популярні товари</h2>

        <div style={{ position: 'relative', padding: '0 10px', maxWidth: '1100px', margin: '0 auto' }}>
          {featuredProducts.length > 0 && (
            <button onClick={() => scroll(-1)} className="carousel-btn left"><ChevronLeft /></button>
          )}

          <div ref={carouselRef} className="hide-scrollbar" style={{
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            padding: '1rem 0',
            touchAction: 'auto'
          }}>
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {featuredProducts.length > 0 && (
            <button onClick={() => scroll(1)} className="carousel-btn right"><ChevronRight /></button>
          )}
        </div>
      </section>

      <BlogPreviewSection posts={blogPosts} />

      <StoreReviews />

      <InfoModal
        isOpen={!!activeFeature}
        onClose={() => setActiveFeature(null)}
        title={activeFeature?.title}
        type="static_text"
        src={activeFeature?.content}
        compact={true}
      />
    </main>
  );
}
