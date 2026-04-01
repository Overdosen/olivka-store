import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import cottonIcon from '../assets/icons/cotton.png';
import motherIcon from '../assets/icons/mother.png';
import deliveryIcon from '../assets/icons/delivery.png';
import giftIcon from '../assets/icons/gift.png';
import {
  FloatingPanelRoot,
  FloatingPanelTrigger,
  FloatingPanelContent
} from '../components/ui/floating-panel';

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
      content: "Ми використовуємо лише преміальну бавовну найвищої якості. Це натуральний матеріал, який дозволяє шкірі дихати, не викликає алергічних реакцій та дарує неперевершене відчуття м'якості. Кожна ниточка ретельно відібрана для того, щоб забезпечити комфорт та безпеку вашому малюку з перших днів життя."
    },
    {
      id: 'mother',
      icon: motherIcon,
      title: 'Перевірено мамами',
      desc: 'нам довіряють найцінніше',
      tooltip: 'нам довіряють найцінніше',
      content: "Наш одяг пройшов випробування часом та тисячами реальних життєвих ситуацій. Ми прислухаємося до кожної мами, щоб вдосконалювати кожну деталь: від застібок до швів. Довіра понад 1000 щасливих клієнтів — це наше головне досягнення та натхнення для створення нових колекцій, які полегшують догляд за дитиною."
    },
    {
      id: 'delivery',
      icon: deliveryIcon,
      title: 'Швидка відправка',
      desc: '1-2 дні по Україні',
      tooltip: 'Ваша швидка доставка',
      content: "Ми цінуємо ваш час, тому організували логістику так, щоб замовлення потрапляло до вас якнайшвидше. Відправка здійснюється протягом 1-2 днів по всій Україні через надійного оператора «Нова Пошта». Ви отримаєте номер ТТН відразу після оформлення, щоб мати можливість відстежувати свою посилку в режимі реального часу."
    },
    {
      id: 'gift',
      icon: giftIcon,
      title: 'Подарунок від 450₴',
      desc: 'маленька турбота від нас',
      tooltip: 'Сюрприз у посилці',
      content: "Ми обожнюємо дарувати радість! Кожне ваше замовлення на суму від 450 грн супроводжується приємним сюрпризом. Це наша щира подяка за вашу довіру до бренду. Корисні дрібнички, аксесуари або унікальні бонуси додаються до кожної посилки, щоб розпаковка вашого замовлення була ще більш захоплюючою та емоційною."
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
    </motion.main>
  );
}
