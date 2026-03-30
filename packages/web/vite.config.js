import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        swar: resolve(__dirname, 'swar-tuner/index.html'),
        instrument: resolve(__dirname, 'instrument-tuner/index.html'),
        metronome: resolve(__dirname, 'metronome/index.html'),
        instructions: resolve(__dirname, 'instructions/index.html'),
        tanpura: resolve(__dirname, 'tanpura/index.html'),
      },
    },
  },
  plugins: [
    ViteEjsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Dhwani - Musical Toolkit',
        short_name: 'Dhwani',
        description: 'A comprehensive toolkit for musicians: Hindustani Classical Tuner, Chromatic tuner, Metronome, and more.',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: '/images/favicon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
});