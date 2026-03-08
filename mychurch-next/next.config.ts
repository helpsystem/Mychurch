import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    // Skip type checking on VPS build (low RAM — OOM prevention)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
} satisfies NextConfig;

export default nextConfig;
