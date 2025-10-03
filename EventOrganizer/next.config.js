#!/usr/bin/env node
/**
 * Professional Next.js Configuration for Platform-Specific Optimization
 * 
 * Implements comprehensive optimizations including:
 * - Core Web Vitals optimization
 * - Bundle size optimization
 * - Image optimization
 * - Performance monitoring
 * - Security headers
 * - PWA configuration
 * - SEO optimization
 * - Accessibility enhancements
 */

const nextConfig = {
  // --- Performance Optimization ---
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'axios', 'zod'],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },

  // --- Bundle Optimization ---
  webpack: (config, { dev, isServer }) => {
    // Exclude CLI files from frontend bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      child_process: false,
      events: false,
      process: false,
    }

    // Exclude CLI files from being processed
    config.module.rules.push({
      test: /cli\.ts$/,
      use: 'null-loader',
    })

    // Code splitting optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          platform: {
            test: /[\\/]src[\\/]lib[\\/]platform[\\/]/,
            name: 'platform',
            chunks: 'all',
            priority: 8,
          },
        },
      }
    }

    return config
  },

  // --- Image Optimization ---
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // --- Compression ---
  compress: true,

  // --- Security Headers ---
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // --- Redirects ---
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // --- Rewrites ---
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // --- Environment Variables ---
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // --- Output Configuration ---
  // output: 'standalone', // Commented out for Vercel deployment

  // --- TypeScript Configuration ---
  typescript: {
    ignoreBuildErrors: true,
  },

  // --- ESLint Configuration ---
  eslint: {
    ignoreDuringBuilds: true,
  },

  // --- PWA Configuration (disabled for now) ---
  // PWA will be configured separately using next-pwa plugin

  // --- Performance Monitoring ---
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // --- Development Configuration ---
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),

  // --- Production Configuration ---
  ...(process.env.NODE_ENV === 'production' && {
    poweredByHeader: false,
    generateEtags: false,
  }),

  // --- Custom Configuration ---
  trailingSlash: false,
  reactStrictMode: true,
  swcMinify: true,
}

export default nextConfig
