import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isGithub = mode === 'github'
  const isOffline = mode === 'offline'
  
  const getBasePath = () => {
    if (isGithub) return '/clic-frontend-workspace/chatbot/'
    return (mode === 'production' || isOffline) ? '' : './'
  }

  // Se o base path for vazio (WordPress), usamos o diretório atual './' para o PWA entender as rotas virtuais
  const pwaScope = getBasePath() || './'

  return {
    plugins: [
      vue(),
      ...(isOffline ? [viteSingleFile()] : [
        VitePWA({
          registerType: 'autoUpdate',
          // Diz ao Vite para não gerar o arquivo de registro inútil (pois o PHP já faz isso)
          injectRegister: false,
          manifest: {
            name: 'CLIC Novelo',
            short_name: 'Novelo',
            description: 'Crie chatbots no CLIC Novelo',
            theme_color: '#FFCC00',
            background_color: '#ffffff',
            display: 'standalone',
            id: 'clic-chatbot',
            // Pula o redirecionamento (302) do WordPress e vai direto pro HTML final (200 OK)
            start_url: pwaScope === './' ? './editor' : pwaScope, 
            scope: pwaScope,
            icons: [
              { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
              { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }
            ]
          },
          workbox: {
            navigateFallback: null,
            inlineWorkboxRuntime: true,
            // Diz ao PWA para ignorar o arquivo físico index.html, pois o HTML verdadeiro é gerado pelo PHP do WordPress!
            globIgnores: ['**/index.html'],
            runtimeCaching: [
              {
                // Em vez de adivinhar a URL, intercepta QUALQUER pedido de página HTML!
                urlPattern: ({ request }) => request.mode === 'navigate',
                handler: 'NetworkFirst', 
                options: {
                  cacheName: 'clic-html-cache',
                  expiration: {
                    maxAgeSeconds: 60 * 60 * 24 * 30
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
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
      include: ['src/runtime/engine/__tests__/**/*.test.ts'],
    }
  }
})
