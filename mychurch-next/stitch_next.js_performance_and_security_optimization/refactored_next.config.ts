import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // STEP 1: FIX PERFORMANCE & CONFIGURATION ISSUES
  // 1. next.config.ts refinements
  
  images: {
    // SECURITY: Removed wildcard hostname '**' to prevent potential image proxy abuse.
    // Replaced with specific allowed domains.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.iranianchurchdc.com',
      },
      {
        protocol: 'https',
        hostname: 'your-supabase-project-id.supabase.co', // Replace with your actual Supabase URL
      },
    ],
  },

  // PERFORMANCE: Removed ignoreBuildErrors to ensure code quality and prevent broken builds from reaching production.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // PERFORMANCE: Added Cache-Control headers for static assets to improve load times and reduce server load.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
