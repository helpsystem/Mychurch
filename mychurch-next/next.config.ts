import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    // Skip type checking on VPS build (low RAM — OOM prevention)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['better-sqlite3', 'sqlite3', 'sql.js'],
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
  turbopack: {},
};

export default nextConfig;
