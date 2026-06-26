import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mongodb', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
