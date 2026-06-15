import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/rebus/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Ребус · Rebus",
        short_name: "Rebus",
        description: "Soviet-style image and letter rebuses in Russian and English",
        theme_color: "#0e1116",
        background_color: "#0e1116",
        display: "standalone",
        start_url: "/rebus/",
        scope: "/rebus/",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        // Precache only the compiled app shell; puzzles and images are large
        // and numerous — serve them lazily with runtime caching instead.
        globPatterns: ["**/*.{js,css,html,woff2}"],
        runtimeCaching: [
          {
            // Puzzle JSON shards — network-first so players get fresh puzzles
            // on reload, but still work offline after first visit.
            urlPattern: /\/puzzles\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "puzzles-v1",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            // SVG emoji assets — stable forever, cache aggressively.
            urlPattern: /\/assets\/images\//,
            handler: "CacheFirst",
            options: {
              cacheName: "images-v1",
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
});
