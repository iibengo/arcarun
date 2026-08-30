// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@vite-pwa/nuxt',
  ],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  css: ["~/assets/css/tailwind.css"],
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
    manifest: {
      name: 'RUN·ARCADE',
      short_name: 'RUN·ARCADE',
      description: 'Consola de entrenamiento retro/arcade para corredores: elige misión, ajusta tu marca de 10K y energía, y obtén tu plan de vuelo al instante.',
      lang: 'es',
      theme_color: '#050608',
      background_color: '#050608',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
      cleanupOutdatedCaches: true,
      navigateFallback: '/',
      runtimeCaching: [
        {
          // HTML de navegación: NetworkFirst cachea la primera visita online
          // y lo sirve offline (crítico en SSR donde "/" no es un asset estático).
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'run-arcade-html',
            networkTimeoutSeconds: 5,
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
