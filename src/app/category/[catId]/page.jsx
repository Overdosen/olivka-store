import { supabase } from '../../../lib/supabase';
import CategoryClient from './CategoryClient';

// Dynamic SEO tags on the server
export async function generateMetadata({ params }) {
  const { catId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';
  
  let title = 'Категорія не знайдена';
  let description = 'Весь асортимент дитячого одягу Store Olivka.';
  let keywords = 'дитячий одяг, магазин, Olivka';

  if (catId) {
    const { data: catData } = await supabase
      .from('categories')
      .select('name, seo_title, meta_description, meta_keywords')
      .eq('id', catId)
      .single();

    if (catData) {
      title = catData.seo_title || catData.name;
      description = catData.meta_description || `Переглядайте наш асортимент товарів у категорії "${catData.name}". Обирайте найкращі речі для ваших малюків в Store Olivka.`;
      keywords = catData.meta_keywords || keywords;
    } else if (catId === 'fullset') {
      title = 'Готові рішення';
      description = 'Економте час та кошти з нашими готовими наборами одягу для немовлят.';
    }
  } else {
    title = 'Весь каталог';
    description = 'Весь асортимент дитячого одягу Store Olivka в одному місці.';
  }

  const fullTitle = `${title} | Store Olivka`;
  const logoUrl = `${baseUrl}/favicon.svg`;

  return {
    title: title,
    description: description,
    keywords: keywords,
    alternates: {
      canonical: `/category/${catId || ''}`,
    },
    openGraph: {
      title: fullTitle,
      description: description,
      siteName: 'Store Olivka',
      images: [{ url: logoUrl, width: 800, height: 800, alt: 'Store Olivka Logo' }],
      locale: 'uk_UA',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description: description,
      images: [logoUrl],
    }
  };
}

export default async function CategoryPage({ params }) {
  const { catId } = await params;

  let category = null;

  if (catId) {
    const { data: catData } = await supabase
      .from('categories')
      .select('name, description')
      .eq('id', catId)
      .single();

    if (catData) {
      category = { id: catId, name: catData.name, description: catData.description };
    } else if (catId === 'fullset') {
      category = { id: 'fullset', name: 'Готові рішення', description: 'Комплекти одягу для немовлят' };
    }
  } else {
    category = { name: 'Весь каталог', description: 'Повний асортимент магазину' };
  }

  if (!category) {
    return (
      <div className="container section text-center" style={{ paddingTop: '4rem' }}>
        <h2>Категорія не знайдена</h2>
      </div>
    );
  }

  // Fetch initial products
  let query = supabase.from('products').select('*');
  if (catId) query = query.eq('category_id', catId);
  const { data: prodData } = await query;

  const products = (prodData || []).map(p => ({ ...p, image: p.image_url }));

  return <CategoryClient initialCategory={category} initialProducts={products} />;
}
