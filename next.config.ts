import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for a slim Docker runtime image
  output: "standalone",
  // Disable Next.js fetch cache globally — we handle our own polling intervals
  experimental: {
    // Next 16.4+ stops `next build` when an AI agent runs it on a version with a known advisory; opted out 2026-11-17 (npm audit + Dependabot already report advisories).
    agentUpgrade: false,
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
