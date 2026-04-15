import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Allow server actions from localhost and any deployed domain.
      // Without a wildcard pattern, production deployments (e.g. Vercel preview URLs)
      // get a 403 "Failed to fetch" when invoking server actions.
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'ayah-in-action.vercel.app',
      ],
    },
  },
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  // Force enable PWA (production mode) unconditionally per user request
  disable: false,
  workboxOptions: {
    skipWaiting: true,
    // Prevent the service worker from causing crashes by intercepting
    // server action requests (POST to /) — these must always go to the network
    navigateFallback: null,
    runtimeCaching: [
      {
        // Public Quran text API — cache with network-first for freshness
        urlPattern: /^https:\/\/api\.quran\.com\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'quran-api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Quran audio CDN — cache-first since audio files never change
        urlPattern: /^https:\/\/.*\.(qurancdn|verses\.quran)\.com\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'quran-audio-cache',
          expiration: { maxEntries: 20, maxAgeSeconds: 604800 },
        },
      },
    ],
  },
});

export default pwaConfig(nextConfig);
