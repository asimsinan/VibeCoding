import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['@/components/ui'],
  },
  // Disable webpack polling to prevent unnecessary recompiles
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      poll: false,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
