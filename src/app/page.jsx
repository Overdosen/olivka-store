import HomeClient from './HomeClient';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.olivka.store';

export const metadata = {
  title: 'Olivka Store | Ніжний одяг для немовлят',
  description: 'Естетичний та базовий одяг для немовлят. Натуральні тканини, комфорт та якість, перевірена мамами. Швидка доставка по Україні.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'Olivka Store | Ніжний одяг для немовлят',
    description: 'Найкращий вибір базового одягу для ваших малюків. Натуральні тканини та естетичний дизайн.',
    url: baseUrl,
    siteName: 'Store Olivka',
    images: [{
      url: `${baseUrl}/favicon.svg`,
      width: 1200,
      height: 630,
      alt: 'Olivka Store Logo',
    }],
    locale: 'uk_UA',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Olivka Store | Ніжний одяг для немовлят',
    description: 'Натуральний одяг для вашого малюка з любов’ю від Olivka Store.',
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
