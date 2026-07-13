import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['better-sqlite3', 'sqlite3', 'sql.js'],
  env: {
    API_BIBLE_KEY: process.env.API_BIBLE_KEY || 'b27dc6902b00019756980695a12eb0da',
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Keep turbopack config empty - we force --webpack flag in build script
  turbopack: {},
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      // Fixes npm packages that depend on `fs` module
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
        // اعمال هدرهای ضد دانلود برای تمام فایل‌های صوتی محلی
        source: '/worship/audio/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'audio/mpeg',
          },
          {
            key: 'Content-Disposition',
            value: 'inline',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        // در صورت استفاده از فولدر فایل‌های عمومی دیگر
        source: '/files/:path*',
        headers: [
          {
            key: 'Content-Disposition',
            value: 'inline',
          }
        ]
      }
    ];
  },
};

export default nextConfig;
