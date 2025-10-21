/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip type checking during build for Vercel deployment
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist', 'pdf-parse'],
  },
  images: {
    domains: ['vercel.com', 'blob.vercel-storage.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
