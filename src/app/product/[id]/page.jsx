import { supabase } from '../../../lib/supabase';
import ProductClient from './ProductClient';

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
    return {
      title: 'Товар не знайдено | Store Olivka',
    };
  }

  // Ensure absolute URL for social previews
  const imageUrl = product.image_url 
    ? (product.image_url.startsWith('http') 
        ? product.image_url 
        : `${baseUrl}/images/${product.image_url}`)
    : '';

  const fullTitle = `${product.name} | Store Olivka`;
  const description = product.meta_description || product.description || '';

  return {
    title: product.name,
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
      type: 'article',
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
  
  // Fetch product on the server for initial render
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!data) {
    return (
      <div className="container section text-center" style={{ paddingTop: '4rem' }}>
        <h2>Товар не знайдено</h2>
      </div>
    );
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
    galleryLinks: parsedGallery.map(url => url.startsWith('http') ? url : `${baseUrl}/images/${url}`)
  };

  // Structured Data for Google (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    image: mainImageUrl,
    description: data.meta_description || data.description,
    sku: data.sku || String(data.id),
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
      availability: data.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Store Olivka',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient product={productWithParsedData} />
    </>
  );
}
