import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Tumblr media domains
    remotePatterns: [
      { protocol: "https", hostname: "64.media.tumblr.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev" },
    ],
    // Cloudflare image resizing statt Next.js optimizer
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  output: "standalone",
  serverExternalPackages: [],
};

export default nextConfig;
