import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isGithub = mode === 'github'
  const isOffline = mode === 'offline'
  
  const getBasePath = () => {
    if (isGithub) return '/clic-frontend-workspace/chatbot-v2/'
    return (mode === 'production' || isOffline) ? '' : './'
  }

  const pwaScope = getBasePath() || './'

  return {
    plugins: [
      vue(),
      ...(isOffline ? [viteSingleFile()] : [
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false,
          manifest: {
            name: 'CLIC Chatbot',
            short_name: 'Chatbot',
            description: 'Crie chatbots interativos com o CLIC',
            theme_color: '#3b82f6',
            background_color: '#ffffff',
            display: 'standalone',
            id: 'clic-chatbot-v2',
            start_url: pwaScope === './' ? './editor' : pwaScope, 
            scope: pwaScope,
            icons: [
              // Você precisará copiar as imagens do chatbot antigo para public/ depois
              { src: 'pwa-192x192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
              { src: 'pwa-512x512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
              { src: 'pwa-maskable-512x512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
            ]
          },
          workbox: {
            navigateFallback: null,
            inlineWorkboxRuntime: true,
            globIgnores: ['**/index.html'],
            runtimeCaching: [
              {
                urlPattern: ({ request }) => request.mode === 'navigate',
                handler: 'NetworkFirst', 
                options: {
                  cacheName: 'clic-html-cache',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
                  cacheableResponse: { statuses: [0, 200] }
                }
              }
            ]
          }
        })
      ])
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: getBasePath(),
    build: {
      outDir: isOffline ? 'dist-offline' : 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      manifest: !isOffline,
      chunkSizeWarningLimit: 1000,
      rolldownOptions: isOffline ? undefined : {
        input: {
          index: fileURLToPath(new URL('./index.html', import.meta.url)),
          editor: fileURLToPath(new URL('./src/editor/main-editor.ts', import.meta.url)),
          runtime: fileURLToPath(new URL('./src/runtime/main-runtime.ts', import.meta.url)),
        },
      },
    },
    test: {
      environment: 'node',
      globals: true,
      include: ['src/**/__tests__/**/*.test.ts'],
    }
  }
})