import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack file watching scoped to the frontend app directory.
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://yourlocalphysio-api.railway.app",
  },
};

export default nextConfig;
