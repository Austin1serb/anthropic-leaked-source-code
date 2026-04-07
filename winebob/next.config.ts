import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for wine labels and user avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
