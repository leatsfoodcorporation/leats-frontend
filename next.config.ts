import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 75, 80, 85, 90, 100],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Show only errors during build, suppress warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { isServer }) => {
    // Suppress warnings in production builds
    if (!isServer) {
      config.stats = 'errors-only';
    }
    return config;
  },
  
  // Rewrite /image/* requests to backend API
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      console.warn('NEXT_PUBLIC_API_URL is not set — skipping /image/* rewrite');
      return [];
    }
    return [
      {
        source: '/image/:path*',
        destination: `${backendUrl}/api/image/:path*`,
      },
    ];
  },
};

export default nextConfig;
