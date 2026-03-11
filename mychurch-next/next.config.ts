import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    // Skip type checking on VPS build (low RAM — OOM prevention)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
