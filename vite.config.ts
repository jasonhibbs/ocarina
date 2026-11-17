import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      // New versions take over as soon as they install; see
      // src/serviceWorker.ts for when the page switches to them.
      registerType: 'autoUpdate',
      injectRegister: false,
      // Same filenames as the old Vue CLI build, so browsers that installed
      // the old service worker pick this one up as an update rather than
      // being stranded on a worker whose script now 404s.
      filename: 'serviceWorker.js',
      manifestFilename: 'manifest.json',
      // Browsers download manifest icons themselves when installing.
      includeManifestIcons: false,
      workbox: {
        // Take over as soon as installed, without waiting for old tabs to
        // close. The page decides when to reload onto the new version.
        skipWaiting: true,
        clientsClaim: true,
        cacheId: 'ocarina',
        cleanupOutdatedCaches: true,
        // Only what the app itself shows offline: the favicons and the
        // install hint's icon. Splash screens, tiles and the Open Graph image
        // are fetched by the OS or other sites, never by the page.
        globPatterns: [
          '**/*.{js,css,html,svg}',
          'img/icons/{favicon-*,apple-touch-icon-precomposed}.png',
        ],
      },
      manifest: {
        name: 'Ocarina',
        short_name: 'Ocarina',
        description:
          'Play the ocarina with buttons, like that old game you used to play',
        theme_color: 'transparent',
        background_color: '#fff',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: './img/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: './img/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: './img/icons/android-chrome-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: './img/icons/android-chrome-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // TODO: migrate the stylesheets from @import to @use. The automated
        // migrator can't handle the cross-file @extends yet.
        silenceDeprecations: [
          'import',
          'global-builtin',
          'color-functions',
          'function-units',
        ],
      },
    },
  },
  build: {
    sourcemap: true,
  },
  server: {
    // Reachable from phones on the local network for touch testing.
    host: true,
    allowedHosts: true,
  },
})
