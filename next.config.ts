import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
