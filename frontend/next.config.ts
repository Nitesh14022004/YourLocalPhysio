import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack file watching scoped to the frontend app directory.
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  },
};

export default nextConfig;
