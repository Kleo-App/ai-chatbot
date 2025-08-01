import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    ppr: true,
    serverActions: {
      bodySizeLimit: '150mb',
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'img.clerk.com',
      },
      {
        hostname: 'images.unsplash.com',
      },
      {
        hostname: 'framerusercontent.com',
      },
      {
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/pdf.worker.min.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Handle PDF.js worker
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://us.i.posthog.com/flags',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
