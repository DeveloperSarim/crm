/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Tree-shake lucide-react icons — only bundles icons actually imported,
  // cutting JS payload by ~200–400 KB on first load.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Fix for hosting proxies (e.g. Hostinger/Nginx) that cache RSC streaming
  // payloads and serve them as full-page HTML to subsequent visitors.
  // The Vary header tells the CDN/proxy to store separate cache entries for
  // RSC requests vs normal browser page loads.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Vary',
            value: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
