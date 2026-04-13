import '../index.css';
import '../admin.css';
import ClientProviders from './ClientProviders';

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
    url: normalizedSiteUrl,
    siteName: 'Store Olivka',
    locale: 'uk_UA',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Store Olivka - Ніжний дитячий одяг',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Store Olivka | Ніжний одяг для немовлят',
    description: 'Натуральний одяг для вашого малюка з любов’ю від Store Olivka.',
    images: ['/og-image.png'],
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
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
