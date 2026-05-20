import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
