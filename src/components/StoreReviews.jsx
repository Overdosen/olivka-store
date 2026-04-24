'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';

const rawReviews = [
  {
    id: 1,
    text: "Дуже хочу залишити відгук про ваш онлайн-магазин дитячого одягу 🤍 Я приємно здивована! Якість матеріалу просто чудова, тканина м’яка, ніжна і дуже приємна на дотик, ідеально для малюків. Сервіс на високому рівні: швидко відповідають, допомагають з вибором і відчувається турбота про клієнта. Доставка теж дуже швидка. Окремо хочу відзначити упакування - воно просто неймовірне!",
    author: "Покупець",
    date: "25 березня",
    rating: 5
  },
  {
    id: 10,
    text: "Хочу вам подякувати від щирого серця за неймовірно якісний, ніжний та гарний одяг для майбутньої донечки 😍 🥺 неможливо стримати емоцій.. окремо дякую за подаруночок у виді прекрасних шкарпеточок 💗",
    author: "Покупець",
    date: "16 липня",
    rating: 5
  },
  {
    id: 2,
    text: "Дякую велике. Мама отримала посилку ) Все дуже гарне, окремо дякую за шкарпеточки 🫶🏻",
    author: "Покупець",
    date: "7 січня",
    rating: 5
  },
  {
    id: 11,
    text: "Пелюшки усі сподобались теж по якості, ті принти - то любов, однозначно хочеться повернутись у ваш магазин, враховуєте усі деталі та перевершуєте очікування, від пакування до вкладених листівок 🌸 💖",
    author: "Покупець",
    date: "20 травня",
    rating: 5
  },
  {
    id: 3,
    text: "Добрий вечір 😍 отримала вашу посилочку 🥰 речі всі супер задоволена 😍 і дякую за приємний подаруночок 😍😘 дуже приємно 🫶🏻",
    author: "Покупець",
    date: "12 лютого",
    rating: 5
  },
  {
    id: 14,
    text: "Доброго дня) Посилку забрала 🥰 все таке гарне, ніжне, приємне і маленькеее 🥺 🥹 Дуже дякую за милий подаруночок) Замовляла такі ж самі платочки, але в іншому магазині і вони мені так сподобались, що хотіла б собі ще і ще і це така приємність була, що ви поклали саме платочок 🥹 🥹 Дуже дякую!",
    author: "Покупець",
    date: "10 вересня",
    rating: 5
  },
  {
    id: 4,
    text: "Вітаю , вдячна вашому магазину, речі дуже якісні, доставка швидка , а упаковка 🥰 окремий кайф. Дякую за допомогу і приємне спілкування",
    author: "Покупець",
    date: "15 квітня",
    rating: 5
  },
  {
    id: 16,
    text: "Дякую вам безмежно! Все отримала Супер ніжнятіна і мілота 🥰 🥰 🥰",
    author: "Покупець",
    date: "25 липня",
    rating: 5
  },
  {
    id: 12,
    text: "дякую за одяг, та за чудове пакування ❤️ ❤️",
    author: "Покупець",
    date: "3 серпня",
    rating: 5
  },
  {
    id: 5,
    text: "Доброго дня! Речі дуже сподобались за якістю і виглядом Дякую ☺️",
    author: "Покупець",
    date: "16 липня",
    rating: 5
  },
  {
    id: 17,
    text: "Вітаю) Забрала посилочку, ідеальний перший одяг для малюка 💙 Дякую вам!",
    author: "Покупець",
    date: "14 жовтня",
    rating: 5
  },
  {
    id: 13,
    text: "Доброго вечора Тільки зараз отримала своє замовлення і дуже вам дякую Все гарне і якісне)",
    author: "Покупець",
    date: "7 січня",
    rating: 5
  },
  {
    id: 6,
    text: "Дякую. Замовленням дуже задоволена)",
    author: "Покупець",
    date: "20 травня",
    rating: 5
  },
  {
    id: 15,
    text: "Пізніше обов’язково ще й зробимо відгуки на модельці 🥰",
    author: "Покупець",
    date: "12 листопада",
    rating: 5
  },
  {
    id: 7,
    text: "Доброго дня! Посилочку взяла, все дуже красиве, дякую 💗",
    author: "Покупець",
    date: "22 червня",
    rating: 5
  },
  {
    id: 8,
    text: "Отримала посилку) щиро дякую, дуже гарно упакована, буду знімати огляд 🥰🫶🏻",
    author: "Покупець",
    date: "3 серпня",
    rating: 5
  },
  {
    id: 9,
    text: "Дякую, замовлення прийшло, все добре 🥰",
    author: "Покупець",
    date: "10 вересня",
    rating: 5
  }
];

export default function StoreReviews() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Сортуємо відгуки за довжиною тексту (найкоротші спочатку)
  const sortedReviews = useMemo(() => {
    return [...rawReviews].sort((a, b) => a.text.length - b.text.length);
  }, []);

  const displayedReviews = isExpanded ? sortedReviews : sortedReviews.slice(0, 4);

  return (
    <section className="store-reviews-section">
      <div className="container">
        <div className="reviews-header">
          <div className="header-left">
            <h2 className="reviews-title">Що про нас кажуть мами</h2>
          </div>
          <div className="header-right">
            <div className="aggregate-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <span className="rating-text">4.9/5 • 150+ відгуків</span>
            </div>
          </div>
        </div>

        <motion.div 
          layout
          transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}
          className="reviews-grid"
        >
          <AnimatePresence initial={false}>
            {displayedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className="review-bubble"
              >
                <div className="bubble-content">
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                  <p className="review-text">{review.text}</p>
                </div>
                <div className="bubble-footer">
                  <span className="review-date">{review.date}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="reviews-footer">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-expand"
          >
            {isExpanded ? (
              <>Згорнути <ChevronUp size={18} /></>
            ) : (
              <>Читати всі відгуки <ChevronDown size={18} /></>
            )}
          </button>
        </div>
      </div>

      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Olivka Store",
            "url": "https://olivka.store",
            "logo": "https://olivka.store/logo.png",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "154"
            },
            "review": sortedReviews.map(r => ({
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": "Покупець Olivka Store"
              },
              "reviewBody": r.text,
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5"
              }
            }))
          })
        }}
      />
    </section>
  );
}
