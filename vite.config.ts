import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // These live in public/ outside the JS/CSS build graph, so the default
      // precache glob misses them. Textures are the paper background used
      // throughout the UI — without them the offline app looks broken even
      // though it "works". og-image.jpg is excluded: it's only ever fetched
      // by social-preview crawlers, never rendered in-app.
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'textures/*.png'],
      manifest: {
        name: 'Iterative Journal',
        short_name: 'Iterative Journal',
        description:
          "Find gaps in your thinking, and iterate on your thoughts. Analyze your writing for NLP Meta-Model violations from Bandler & Grinder's The Structure of Magic.",
        start_url: '/',
        display: 'standalone',
        background_color: '#f3efe0',
        theme_color: '#c0763b',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // WebLLM's TVM runtime (`lib-*.js`) and its worker (`webllm-worker-*.js`)
        // are multi-MB and only loaded when a visitor opts into local inference —
        // precaching them on every install would force a large download on
        // everyone, including Claude-API-only users. Cache them opportunistically
        // instead, the first time they're actually requested.
        globIgnores: ['**/lib-*.js', '**/webllm-worker-*.js'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/(lib|webllm-worker)-.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'webllm-runtime',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./core/index.ts', import.meta.url)),
      '@adapters': fileURLToPath(new URL('./adapters', import.meta.url)),
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
})
