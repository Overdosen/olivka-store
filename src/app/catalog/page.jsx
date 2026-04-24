import CatalogClient from './CatalogClient';

export const metadata = {
  title: 'Каталог',
  description: 'Каталог ніжного дитячого одягу Store Olivka. Оберіть категорію: боді, комплекти, костюми, текстиль та багато іншого для вашого малюка.',
  alternates: {
    canonical: '/catalog',
  },
  openGraph: {
    title: 'Каталог дитячого одягу | Store Olivka',
    description: 'Оберіть категорію дитячого одягу: боді, комплекти, чоловічки, пісочники та інше. Натуральні тканини, ніжні кольори.',
    siteName: 'Store Olivka',
    locale: 'uk_UA',
    type: 'website',
    images: [{
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: 'Каталог Store Olivka',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Каталог дитячого одягу | Store Olivka',
    description: 'Оберіть категорію дитячого одягу: боді, комплекти, чоловічки, пісочники та інше.',
  },
};

export default function CatalogPage() {
  return (
    <>
      <h1 className="sr-only">Каталог дитячого одягу Store Olivka</h1>
      <CatalogClient />
    </>
  );
}
