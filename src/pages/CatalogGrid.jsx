import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function CatalogGrid() {
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // СУВОРИЙ ПЕРЕЛІК КАТЕГОРІЙ (як у випадаючому меню)
  const targetCategories = [
    { name: 'Комплекти', slug: 'sets' },
    { name: 'Боді', slug: 'body' },
    { name: 'Пісочники, ромпери', slug: 'pisochniki' },
    { name: 'Чоловічки', slug: 'men' },
    { name: 'Чепчики, шапочки', slug: 'caps' },
    { name: 'Шкарпетки', slug: 'socks' },
    { name: 'Штанці', slug: 'pants' },
    { name: 'Кокони', slug: 'cocoons' },
    { name: 'Текстиль (пелюшки, пледи)', slug: 'swaddles' },
    { name: 'Костюми, сукні', slug: 'suits' }
  ];

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) {
        console.error('Помилка при завантаженні категорій:', error);
      } else if (data) {
        setDbCategories(data);
      }
      setLoading(false);
    }
    fetchCategories();
  }, []);

  // Мапимо статичний список на дані з бази (для отримання ID)
  const gridCategories = targetCategories.map(target => {
    // Шукаємо співпадіння за ім'ям або за ID
    const dbCat = dbCategories.find(c =>
      c.id === target.slug ||
      c.name.toLowerCase().trim() === target.name.toLowerCase().trim()
    );
    return {
      ...target,
      id: dbCat ? dbCat.id : target.slug // Використовуємо slug як фолбек ID
    };
  });

  const getCategoryImage = (slug) => {
    return `/images/categories/${slug}.png`;
  };

  if (loading) {
    return (
      <div className="container section text-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4rem' }}>
        <p className="font-serif italic text-[#524f25]/60">Завантаження...</p>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="container section"
      style={{ paddingTop: '4rem', paddingBottom: '6rem' }}
    >
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Каталог</h1>
        <p style={{ color: 'var(--color-stone-500)', maxWidth: '600px', margin: '0 auto' }}>
          Оберіть категорію товарів
        </p>
      </header>

      <div className="categories-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        <style dangerouslySetInnerHTML={{
          __html: `
          .categories-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
          }
          @media (min-width: 768px) {
            .categories-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          @media (min-width: 1024px) {
            .categories-grid {
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 2.5rem !important;
            }
          }
          
          .category-tile {
            display: block;
            position: relative;
            cursor: pointer;
            text-decoration: none;
          }
          
          .category-image-wrapper {
            aspect-ratio: 1 / 1;
            overflow: hidden;
            border-radius: 1.5rem;
            background-color: #e9e5d6;
            margin-bottom: 1.25rem;
            position: relative;
            box-shadow: 0 4px 15px rgba(82, 79, 37, 0.05);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .category-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .category-tile:hover .category-image-wrapper {
            transform: translateY(-8px);
            box-shadow: 0 12px 30px rgba(82, 79, 37, 0.12);
          }
          
          .category-tile:hover .category-image {
            transform: scale(1.08);
          }
          
          .category-name {
            font-family: var(--font-serif);
            font-weight: 500;
            font-size: 1.1rem;
            color: #524f25;
            text-align: center;
            transition: color 0.3s ease;
            letter-spacing: 0.02em;
            line-height: 1.3;
          }
          
          .category-tile:hover .category-name {
            color: var(--color-olive-600);
          }
        `}} />

        {gridCategories.map((cat, index) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
          >
            <Link to={`/category/${cat.id}`} className="category-tile">
              <div className="category-image-wrapper">
                <img
                  src={getCategoryImage(cat.slug)}
                  alt={cat.name}
                  className="category-image"
                  style={{ position: 'relative', zIndex: 2 }}
                  onError={(e) => {
                    e.target.style.opacity = '0';
                  }}
                />
                <div className="category-placeholder">
                  {cat.name}
                </div>
              </div>
              <h3 className="category-name">{cat.name}</h3>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.main>
  );
}
