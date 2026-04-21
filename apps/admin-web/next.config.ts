import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: ".next-admin-web",
  outputFileTracingRoot: join(rootDir, "..", ".."),
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid stale/corrupt filesystem cache chunks on Windows in long-lived dev sessions.
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
