/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    N8N_WEBHOOK_URL: process.env.VITE_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL,
    NEXT_PUBLIC_LIQPAY_PUBLIC_KEY: process.env.VITE_LIQPAY_PUBLIC_KEY || process.env.NEXT_PUBLIC_LIQPAY_PUBLIC_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'whmsyhshgvuhfqwyguft.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/product-images/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.olivka.store',
          },
        ],
        destination: 'https://olivka.store/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
