import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      manifestFilename: 'manifest.json',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Love Coupons',
        short_name: 'Love Coupons',
        description: 'A tiny PWA for love coupons.',
        start_url: '/',
        scope: '/',
        theme_color: '#f24e6b',
        background_color: '#fff4f6',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    // https: {
    //   key: fs.readFileSync('/Users/papaya/192.168.0.240-key.pem'),
    //   cert: fs.readFileSync('/Users/papaya/192.168.0.240.pem'),
    // },
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
