import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    ppr: true,
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
    ],
  },
};

export default nextConfig;
