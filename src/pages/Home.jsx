import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import cottonIcon from '../assets/icons/cotton.png';
import motherIcon from '../assets/icons/mother.png';
import deliveryIcon from '../assets/icons/deliveryandpay.png';
import giftIcon from '../assets/icons/gift.png';
import {
  FloatingPanelRoot,
  FloatingPanelTrigger,
  FloatingPanelContent
} from '../components/ui/floating-panel';
import SEO from '../components/SEO';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const carouselRef = useRef(null);

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

  useEffect(() => {
    // Авто-прокрутка вимкнена за запитом користувача.
    // Тільки стрілки для ручної навігації.
  }, [featuredProducts]);

  const scroll = (dir) => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const itemWidth = carouselRef.current.children[0]?.offsetWidth || 300;

      if (dir === 1 && scrollLeft + clientWidth >= scrollWidth - 10) {
        // Если в конце - скроллим в начало
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (dir === -1 && scrollLeft <= 10) {
        // Если в начале - скроллим в конец
        carouselRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        carouselRef.current.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
      }
    }
  };

  return (
    <main>
      <SEO 
        title="Головна | Дитячий одяг"
        description="Найкращий вибір базового одягу для ваших малюків. Натуральні тканини, комфорт та якість, перевірена мамами. Швидка доставка по Україні."
        image="/logo_olivka.png"
      />
      {/* Головна секція (Hero) */}
      <section className="hero" style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        height: 'auto',
        minHeight: '400px',
        backgroundColor: '#fdfbf7' 
      }}>
        {/* Layer 0: Background Scenery (Empty Banner) */}
        <div style={{ position: 'relative', width: '100%', minHeight: '350px' }}>
          <motion.img 
            src="/images/emptybanner.png" 
            alt="Hero Background" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              display: 'block',
              minHeight: '300px',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          />

          {/* Layer 1: Looping Clouds (Moving behind characters) */}
          {/* Using Pure CSS for reliability and diverse timings (6 clouds) */}
          <div className="cloud-layer cloud-1" style={{ top: '10%', left: 0, width: '260px', opacity: 0.5, zIndex: 1 }}>
            <img src="/images/oblako.png" alt="Cloud" style={{ width: '100%' }} />
          </div>

          <div className="cloud-layer cloud-2" style={{ top: '35%', left: 0, width: '180px', opacity: 0.4, zIndex: 2 }}>
            <img src="/images/oblako.png" alt="Cloud" style={{ width: '100%' }} />
          </div>

          <div className="cloud-layer cloud-3" style={{ top: '55%', left: 0, width: '310px', opacity: 0.35, zIndex: 3 }}>
            <img src="/images/oblako.png" alt="Cloud" style={{ width: '100%' }} />
          </div>

          <div className="cloud-layer cloud-4" style={{ top: '15%', left: 0, width: '200px', opacity: 0.45, zIndex: 1 }}>
            <img src="/images/oblako.png" alt="Cloud" style={{ width: '100%' }} />
          </div>

          <div className="cloud-layer cloud-5" style={{ top: '42%', left: 0, width: '240px', opacity: 0.3, zIndex: 2 }}>
            <img src="/images/oblako.png" alt="Cloud" style={{ width: '100%' }} />
          </div>

          <div className="cloud-layer cloud-6" style={{ top: '28%', left: 0, width: '150px', opacity: 0.4, zIndex: 1 }}>
            <img src="/images/oblako.png" alt="Cloud" style={{ width: '100%' }} />
          </div>







          {/* Layer 2: Characters (Girl and Stork positioned) */}
          {/* The Girl - Centered, Smaller, and Lower */}
          <motion.img 
            src="/images/girl.png" 
            alt="Girl" 
            style={{ 
              position: 'absolute',
              left: '50%',
              x: '-50%',
              bottom: '-5%', // Even lower
              width: '23%', // Reduced by another 10%
              zIndex: 10,
              pointerEvents: 'none'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />

          {/* The Stork - Back to the Right and Larger */}
          <div
            className="stork-float"
            style={{
              position: 'absolute',
              right: '10%', // Returned correctly to the right
              top: '12%',
              width: '25%', // Increased by 40% (from 18%)
              zIndex: 11,
              pointerEvents: 'none'
            }}
          >
            <motion.img 
              src="/images/leleka.png" 
              alt="Stork" 
              style={{ width: '100%', display: 'block' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            />
          </div>

        </div>







        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Естетика та комфорт<br className="sm-hidden" />
            з перших днів життя<br className="sm-hidden" />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Базовий одяг із натуральних тканин,<br className="sm-hidden" />
            Нічого зайвого — тільки затишок для малюка<br className="sm-hidden" />
            та спокій для мами.
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

      {/* Плавний перехід між баннером і Features Bar */}
      <div style={{
        marginTop: '-3px',
        height: '40px',
        background: 'linear-gradient(to bottom, rgba(240,237,228,0) 0%, rgba(240,237,228,0.6) 40%, rgba(240,237,228,0.95) 100%)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        pointerEvents: 'none',
        position: 'relative',
        zIndex: 5
      }} />

      {/* Блок переваг (Features Bar) */}
      <div className="mb-12 w-full">
        <nav className="bg-[#f0ede4]/90 px-4 sm:px-10 py-5 sm:py-6 shadow-[0_10px_40px_rgba(82,79,37,0.12)] border-y border-[#524f25]/10 backdrop-blur-md w-full">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {features.map((item) => (
              <FloatingPanelRoot key={item.id}>
                <FloatingPanelTrigger>
                  <div className="relative group flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer active:scale-95 transition-transform duration-100">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                      <img src={item.icon} alt={item.title} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-serif text-[#524f25] text-sm sm:text-base font-bold leading-tight">{item.title}</span>
                      <span className="font-sans text-[#524f25]/70 text-[8px] sm:text-[10px] uppercase tracking-widest mt-0.5">{item.desc}</span>
                    </div>

                  </div>
                </FloatingPanelTrigger>

                <FloatingPanelContent title={item.title}>
                  <p>{item.content}</p>
                </FloatingPanelContent>
              </FloatingPanelRoot>
            ))}
          </div>
        </nav>
      </div>

      {/* Рекомендовані товари */}
      <section id="catalog" className="section container">
        <h2 className="section-title">Популярні товари</h2>

        <div style={{ position: 'relative', padding: '0 10px', maxWidth: '1000px', margin: '0 auto' }}>
          {featuredProducts.length > 0 && (
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
              )
            })}
          </div>

          {featuredProducts.length > 0 && (
            <button onClick={() => scroll(1)} className="carousel-btn right"><ChevronRight /></button>
          )}
        </div>

      </section>
    </main>
  );
}
