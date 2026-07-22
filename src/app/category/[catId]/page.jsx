import React from 'react';
import { supabase } from '../../../lib/supabase';
import CategoryClient from './CategoryClient';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { notFound } from 'next/navigation';

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
    } else {
      notFound();
    }
  } else {
    title = 'Весь каталог';
    description = 'Весь асортимент дитячого одягу Store Olivka в одному місці.';
  }

  const fullTitle = `${title} | Store Olivka`;
  const ogImageUrl = '/opengraph-image.png';

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
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'Store Olivka' }],
      locale: 'uk_UA',
      type: 'website',
    },
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
    notFound();
  }

  // Fetch initial products
  let query = supabase.from('products').select('*');
  if (catId) query = query.eq('category_id', catId);
  const { data: prodData } = await query;

  let products = (prodData || []).map(p => ({ ...p, image: p.image_url }));

  // For 'fullset' category: compute availability from component stocks
  if (catId === 'fullset' && products.length > 0) {
    const bundleIds = products.map(p => p.id);
    const { data: compLinks } = await supabase
      .from('product_components')
      .select('bundle_id, size, products!component_id(id, stock, sizes)')
      .in('bundle_id', bundleIds);

    // Group components by bundle_id (include size)
    const componentsByBundle = {};
    if (compLinks && compLinks.length > 0) {
      compLinks.forEach(row => {
        if (!componentsByBundle[row.bundle_id]) componentsByBundle[row.bundle_id] = [];
        if (row.products) componentsByBundle[row.bundle_id].push({ ...row.products, selectedSize: row.size || null });
      });
    }

    // Mark each bundle product with computed availability
    products = products.map(p => {
      const components = componentsByBundle[p.id];
      // If no components linked, the bundle is explicitly unavailable
      if (!components || components.length === 0) {
        return { ...p, bundleAvailable: false };
      }
      const allAvailable = components.every(comp => {
        // If a specific size is linked, check only that size
        if (comp.selectedSize && comp.sizes && comp.sizes.length > 0) {
          const sizeObj = comp.sizes.find(s => s.name === comp.selectedSize);
          return sizeObj ? (parseInt(sizeObj.quantity) || 0) > 0 : false;
        }
        if (comp.sizes && comp.sizes.length > 0) {
          return comp.sizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0) > 0;
        }
        return (comp.stock || 0) > 0;
      });
      return { ...p, bundleAvailable: allAvailable };
    });
  }

  const categoryWithId = { ...category, id: catId || 'all' };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';
  
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Головна',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Каталог',
        item: `${baseUrl}/catalog`,
      },
    ],
  };

  if (catId && catId !== 'all') {
    breadcrumbJsonLd.itemListElement.push({
      '@type': 'ListItem',
      position: 3,
      name: category.name,
      item: `${baseUrl}/category/${catId}`,
    });
  }

  const breadcrumbItems = [
    { label: 'Каталог', href: '/catalog' },
    ...(catId && catId !== 'all' ? [{ label: category.name }] : [])
  ];

  return (
    <React.Suspense fallback={
      <div className="container section text-center" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="font-serif italic text-[#524f25]/60">Завантаження...</p>
      </div>
    }>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container" style={{ paddingTop: '2rem' }}>
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <CategoryClient initialCategory={categoryWithId} initialProducts={products} />
    </React.Suspense>
  );
}
