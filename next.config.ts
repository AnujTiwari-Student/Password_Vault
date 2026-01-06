import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.VERCEL === "1",
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
