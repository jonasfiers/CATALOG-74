import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        injectRegister: 'script',
        manifest: {
          name: 'CATALOG-74',
          short_name: 'CATALOG-74',
          description: 'A COBOL batch reimplementation of an expense splitter',
          theme_color: '#06120A',
          background_color: '#06120A',
          display: 'standalone',
          viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
          start_url: '/',
          scope: '/',
          orientation: 'portrait',
          icons: [
            {
              src: '/icon-192.png?v=2',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-512.png?v=2',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icon-512.png?v=2',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512.png?v=2',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],

    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://api:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})