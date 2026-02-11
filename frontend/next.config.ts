import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Tumblr media domains
    remotePatterns: [
      { protocol: "https", hostname: "64.media.tumblr.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // Cloudflare image resizing statt Next.js optimizer
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  serverExternalPackages: [],
};

export default nextConfig;
