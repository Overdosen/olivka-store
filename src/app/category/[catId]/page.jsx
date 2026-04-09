import { supabase } from '../../../lib/supabase';
import CategoryClient from './CategoryClient';

// Dynamic SEO tags on the server
export async function generateMetadata({ params }) {
  const { catId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.olivka.store';
  let categoryName = 'Категорія не знайдена';
  let description = '';

  if (catId) {
    const { data: catData } = await supabase
      .from('categories')
      .select('name')
      .eq('id', catId)
      .single();

    if (catData) {
      categoryName = catData.name;
    } else if (catId === 'fullset') {
      categoryName = 'Готові рішення';
    }
    description = `Переглядайте наш асортимент товарів у категорії "${categoryName}". Обирайте найкращі речі для ваших малюків в Olivka Store.`;
  } else {
    categoryName = 'Весь каталог';
    description = 'Весь асортимент дитячого одягу Olivka Store в одному місці.';
  }

  const fullTitle = `${categoryName} | Store Olivka`;
  const logoUrl = `${baseUrl}/favicon.svg`;

  return {
    title: categoryName,
    description: description,
    alternates: {
      canonical: `${baseUrl}/category/${catId || ''}`,
    },
    openGraph: {
      title: fullTitle,
      description: description,
      url: `${baseUrl}/category/${catId || ''}`,
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
      .select('name')
      .eq('id', catId)
      .single();

    if (catData) {
      category = { id: catId, name: catData.name };
    } else if (catId === 'fullset') {
      category = { id: 'fullset', name: 'Готові рішення' };
    }
  } else {
    category = { name: 'Весь каталог' };
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
