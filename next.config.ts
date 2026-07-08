import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for a slim Docker runtime image
  output: "standalone",
  // Disable Next.js fetch cache globally — we handle our own polling intervals
  experimental: {
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
