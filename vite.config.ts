import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/rep-red/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'REP-RED',
        short_name: 'REP-RED',
        description: 'Rep Redistribution calisthenics workout tracker',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        start_url: '/rep-red/',
        icons: [
          {
            src: '/rep-red/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/rep-red/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/rep-red/icons/icon-512.png',
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
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
