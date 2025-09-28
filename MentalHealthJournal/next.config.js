/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['chart.js', 'react-chartjs-2'],
  },

  // Ensure proper routing configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss: https://moodtracker-lac.vercel.app https://*.vercel.app;",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
    ];
  },
  // PWA configuration
  async generateBuildId() {
    return 'mood-tracker-' + Date.now();
  },
  // Enable static optimization
  trailingSlash: false,
  // Optimize images
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable compression
  compress: true,

  // Configure src directory
  transpilePackages: [],

  // Optimize for production
  swcMinify: true,
  reactStrictMode: true,

  // Output configuration
  output: 'standalone',
};

module.exports = nextConfig;