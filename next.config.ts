import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.quran\.com\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'quran-api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.qurancdn\.com\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'quran-audio-cache',
          expiration: { maxEntries: 20, maxAgeSeconds: 604800 },
        },
      },
    ],
  }
});

export default pwaConfig(nextConfig);
