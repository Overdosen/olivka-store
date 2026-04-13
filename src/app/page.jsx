import HomeClient from './HomeClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';

export const metadata = {
  title: 'Store Olivka | Ніжний одяг для немовлят',
  description: 'Натуральний одяг для вашого малюка з любов’ю від Store Olivka. Естетичний та комфортний одяг для немовлят. Швидка доставка по Україні.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Store Olivka | Ніжний одяг для немовлят',
    description: 'Натуральний одяг для вашого малюка з любов’ю від Store Olivka. Естетичний та комфортний одяг для немовлят.',
    url: baseUrl,
    siteName: 'Store Olivka',
    images: [{
      url: `${baseUrl}/favicon.svg`,
      width: 1200,
      height: 630,
      alt: 'Store Olivka Logo',
    }],
    locale: 'uk_UA',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Store Olivka | Ніжний одяг для немовлят',
    description: 'Натуральний одяг для вашого малюка з любов’ю від Store Olivka.',
    images: [`${baseUrl}/favicon.svg`],
  }
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Store Olivka',
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description: 'Одяг для новонароджених в пологовий. Якісна база з перших днів життя. Дитячий одяг.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'olivka.store@gmail.com', // Replace with actual if needed
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
