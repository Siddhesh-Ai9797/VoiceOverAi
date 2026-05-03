import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2gb",
    },
  },
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],
};

export default nextConfig;
