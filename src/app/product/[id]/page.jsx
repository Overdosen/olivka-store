import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import ProductClient from './ProductClient';
import Breadcrumbs from '../../../components/Breadcrumbs';
import RelatedProducts from '../../../components/RelatedProducts';
import { notFound } from 'next/navigation';

// Server-safe Supabase client (no localStorage, no persistSession)
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

// Dynamic SEO tags on the server
export async function generateMetadata({ params }) {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) {
    notFound();
  }

  // Ensure absolute URL for social previews
  const imageUrl = product.image_url 
    ? (product.image_url.startsWith('http') 
        ? product.image_url 
        : `${baseUrl}/images/${product.image_url}`)
    : '';

  const pageTitle = product.seo_title || product.name;
  const fullTitle = `${pageTitle} | Store Olivka`;
  const description = product.meta_description || product.description || '';

  return {
    title: pageTitle,
    description: description,
    keywords: product.meta_keywords || 'Store Olivka, дитячий одяг, купити',
    alternates: {
      canonical: `/product/${id}`,
    },
    openGraph: {
      title: fullTitle,
      description: description,
      siteName: 'Store Olivka',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: product.name }] : [],
      locale: 'uk_UA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  
  // Fetch product with category and reviews on the server for initial render
  const { data } = await supabase
    .from('products')
    .select('*, categories(id, name)')
    .eq('id', id)
    .single();

  if (!data) {
    notFound();
  }
  
  // Parse gallery
  let parsedGallery = [];
  if (data.gallery) {
    if (Array.isArray(data.gallery)) {
      parsedGallery = data.gallery;
    } else if (typeof data.gallery === 'string') {
      try {
        if (data.gallery.startsWith('[')) {
          parsedGallery = JSON.parse(data.gallery);
        } else {
          parsedGallery = data.gallery.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        }
      } catch(e) { console.error('Error parsing gallery', e); }
    }
  }
  
  // Pre-calculate image and gallery links for consistency
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';
  const mainImageUrl = data.image_url 
    ? (data.image_url.startsWith('http') ? data.image_url : `${baseUrl}/images/${data.image_url}`)
    : '';
    
  const productWithParsedData = {
    ...data,
    image: mainImageUrl,
    galleryLinks: parsedGallery.map(url => url.startsWith('http') ? url : `${baseUrl}/images/${url}`),
    reviews: []
  };

  // For fullset products: compute availability from component stocks
  if (data.category_id === 'fullset') {
    const { data: compLinks } = await supabaseServer
      .from('product_components')
      .select('size, products!component_id(id, stock, sizes)')
      .eq('bundle_id', id);

    if (compLinks && compLinks.length > 0) {
      const components = compLinks
        .map(row => row.products ? { ...row.products, selectedSize: row.size || null } : null)
        .filter(Boolean);
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
      productWithParsedData.bundleAvailable = allAvailable;
    } else {
      // Якщо немає компонентів — набір не може бути зібраний, тому він не в наявності
      productWithParsedData.bundleAvailable = false;
    }
  }

  // Use global store rating for product SEO consistency
  const averageRating = "4.9";
  const reviewCount = 154;

  // Structured Data for Google (JSON-LD)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.seo_title || data.name,
    image: mainImageUrl,
    description: data.meta_description || data.description,
    sku: data.sku || String(data.id),
    category: data.categories?.name,
    brand: {
      '@type': 'Brand',
      name: 'Store Olivka',
    },
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/product/${id}`,
      priceCurrency: 'UAH',
      price: data.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      availability: (() => {
        const hasSizes = data.sizes && data.sizes.length > 0;
        const inStock = hasSizes
          ? data.sizes.some(s => s.quantity > 0)
          : data.stock > 0;
        return inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
      })(),
      seller: {
        '@type': 'Organization',
        name: 'Store Olivka',
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'UA',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 0,
          currency: 'UAH',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'UA',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 4,
            unitCode: 'd',
          },
        },
      },
    },
  };

  // Add AggregateRating based on store reputation
  productJsonLd.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: averageRating,
    reviewCount: reviewCount,
    bestRating: '5',
    worstRating: '1'
  };

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
        name: data.categories?.name || 'Каталог',
        item: `${baseUrl}/category/${data.categories?.id || 'all'}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.seo_title || data.name,
        item: `${baseUrl}/product/${id}`,
      },
    ],
  };

  const breadcrumbItems = [
    { label: 'Каталог', href: '/catalog' },
    { label: data.categories?.name || 'Категорія', href: `/category/${data.categories?.id}` },
    { label: data.name }
  ];

  // ── Fetch related_products_settings ──────────────────────────────────────
  let relatedSettings = { enabled: false, categories: [] };
  try {
    const { data: relSettingsData, error: relErr } = await supabaseServer
      .from('global_settings')
      .select('value')
      .eq('id', 'related_products_settings')
      .maybeSingle();
    if (!relErr && relSettingsData?.value) {
      const parsed = typeof relSettingsData.value === 'string'
        ? JSON.parse(relSettingsData.value)
        : relSettingsData.value;
      relatedSettings = parsed;
    }
    if (relErr) console.error('[RelatedSettings] fetch error:', relErr.message);
  } catch (e) { console.error('[RelatedSettings] exception:', e); }

  // ── Fetch related products ────────────────────────────────────────────────
  let relatedProducts = [];

  if (relatedSettings.enabled && relatedSettings.categories?.length > 0) {
    // Custom pool: fetch from each configured category and pick random subset
    const fetchPromises = relatedSettings.categories.map(async ({ categoryId, count }) => {
      // Fetch more than needed so we can shuffle and pick
      const { data: pool } = await supabase
        .from('products')
        .select('id, name, price, image_url, stock, sizes')
        .eq('category_id', categoryId)
        .eq('is_published', true)
        .neq('id', id)
        .or('stock.gt.0,sizes.cs.[{"quantity":1}]')
        .limit(50);

      // Filter in-stock
      const inStock = (pool || []).filter(p => {
        if (p.sizes && p.sizes.length > 0) return p.sizes.some(s => s.quantity > 0);
        return p.stock > 0;
      });

      // Shuffle (server-side random)
      for (let i = inStock.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [inStock[i], inStock[j]] = [inStock[j], inStock[i]];
      }

      return inStock.slice(0, count);
    });

    const results = await Promise.all(fetchPromises);
    const combined = results.flat();

    // Deduplicate by id
    const seen = new Set();
    const deduped = combined.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

    // Final shuffle of the combined list
    for (let i = deduped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
    }

    relatedProducts = deduped;
  } else if (data.category_id) {
    // Fallback: same category
    const defaultCount = relatedSettings.categories?.[0]?.count || 8;
    const { data: related } = await supabase
      .from('products')
      .select('id, name, price, image_url, stock, sizes')
      .eq('category_id', data.category_id)
      .eq('is_published', true)
      .neq('id', id)
      .or('stock.gt.0,sizes.cs.[{"quantity":1}]')
      .limit(defaultCount + 10);

    const filtered = (related || []).filter(p => {
      if (p.sizes && p.sizes.length > 0) return p.sizes.some(s => s.quantity > 0);
      return p.stock > 0;
    });

    // Shuffle
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    relatedProducts = filtered.slice(0, defaultCount);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="container" style={{ paddingTop: '2rem' }}>
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <ProductClient product={productWithParsedData} />
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </>
  );
}
