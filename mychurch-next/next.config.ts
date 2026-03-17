import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip type checking on VPS build (low RAM — OOM prevention)
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['better-sqlite3', 'sqlite3', 'sql.js'],
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
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
};

export default nextConfig;
