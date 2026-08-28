import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['better-sqlite3', 'sqlite3', 'sql.js'],
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'framer-motion', 'lucide-react'],
  env: {
    API_BIBLE_KEY: process.env.API_BIBLE_KEY || 'b27dc6902b00019756980695a12eb0da',
  },
  images: {
    remotePatterns: [
      // Supabase Storage (primary media CDN)
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      // HiDrive / Strato (worship audio/media storage)
      { protocol: 'https', hostname: '*.hidrive.strato.com' },
      { protocol: 'https', hostname: 'my.hidrive.com' },
      // Google (user avatars, Gemini-generated images)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      // Telegram CDN (uploaded media via bot)
      { protocol: 'https', hostname: 'api.telegram.org' },
      { protocol: 'https', hostname: '*.cdn-telegram.org' },
      // Replicate AI image generation
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: 'pbxt.replicate.delivery' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Keep turbopack config empty - we force --webpack flag in build script
  turbopack: {},
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        // 🚨 PREVENT ALL STALE BROWSER/NGINX CACHING ON ADMIN & DYNAMIC ROUTES
        source: '/(admin|profile|verify-admin-login|api)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Static Audio & worship files (immutable caching for speed)
        source: '/worship/audio/:path*',
        headers: [
          { key: 'Content-Type', value: 'audio/mpeg' },
          { key: 'Content-Disposition', value: 'inline' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // General files
        source: '/files/:path*',
        headers: [
          { key: 'Content-Disposition', value: 'inline' },
        ],
      },
      {
        // Static images, video, and font files — long-lived immutable cache
        source: '/:path*.(png|jpg|jpeg|webp|avif|svg|gif|ico|woff|woff2|ttf|otf|webm|mp4)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Vary', value: 'Accept-Encoding' },
        ],
      },
      {
        // Next.js hashed static chunks — always immutable
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Security headers on all HTML responses
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=self, microphone=self, geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
