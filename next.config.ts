import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false, // Remove X-Powered-By header for security
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure proper handling of static assets
  experimental: {
    optimizePackageImports: ['@next/font'],
  },
  // Configure output for static assets
  output: 'standalone',
  distDir: '.next',
  // Ensure static assets are properly handled
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Configure image optimization
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configure headers for SVG files
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*.svg',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/svg+xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*.png',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/png',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
