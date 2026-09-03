import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['firebase', '@firebase/auth', '@firebase/app'],
};

export default nextConfig;
