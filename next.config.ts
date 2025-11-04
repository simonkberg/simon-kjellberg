import "@/lib/env";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  turbopack: {
    root: import.meta.dirname,
  },
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
