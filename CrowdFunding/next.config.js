/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000/api/v1',
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3000/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
