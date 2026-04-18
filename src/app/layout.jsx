import '../index.css';
import '../admin.css';
import { Inter } from 'next/font/google';
import ClientProviders from './ClientProviders';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';
const normalizedSiteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;

export const metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: {
    default: 'Store Olivka | Ніжний одяг для немовлят',
    template: '%s | Store Olivka',
  },
  description: 'Натуральний одяг для вашого малюка з любов’ю від Store Olivka. Естетичний та комфортний одяг для немовлят.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Store Olivka | Ніжний одяг для немовлят',
    description: 'Натуральний одяг для вашого малюка з любов’ю від Store Olivka. Естетичний та комфортний одяг для немовлят.',
    siteName: 'Store Olivka',
    locale: 'uk_UA',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Store Olivka Logo',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  themeColor: '#fcfaf8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk" className={inter.variable}>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
