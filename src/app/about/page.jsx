export const metadata = {
  title: "Про нас",
  description: "Дізнайтеся більше про Store Olivka: наші цінності, умови оплати та доставки, публічну оферту та корисні матеріали для мам.",
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: "Про нас | Store Olivka",
    description: "Дізнайтеся більше про Store Olivka: наші цінності, умови оплати та доставки, публічну оферту та корисні матеріали для мам.",
    type: 'website',
    siteName: 'Store Olivka',
    locale: 'uk_UA',
    images: [{
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: 'Store Olivka — Про нас',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Про нас | Store Olivka",
    description: "Дізнайтеся більше про Store Olivka: наші цінності, умови оплати та доставки.",
  }
};

import AboutClient from './AboutClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Store Olivka',
    url: baseUrl,
    logo: `${baseUrl}/apple-touch-icon.png`,
    description: 'Інтернет-магазин ніжного дитячого одягу для немовлят з натуральних тканин.',
    email: 'olivka.hello@gmail.com',
    priceRange: '₴₴',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'UA',
    },
    sameAs: [
      'https://www.instagram.com/store.olivka',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutClient />
    </>
  );
}
