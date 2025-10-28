/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  // File size limit for API routes
  serverRuntimeConfig: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
  },
  // Public configuration
  publicRuntimeConfig: {},
  webpack: (config, { isServer }) => {
    // Exclude pdf-parse and its dependencies from webpack bundling on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        'pdfjs-dist': 'commonjs pdfjs-dist',
      });
    }
    return config;
  },
}

module.exports = nextConfig

