import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import { appBuildInfo } from '../../packages/shared/build/appBuildInfo.ts'

export default defineConfig(({ mode }) => {
  const isGithub = mode === 'github'
  const isOffline = mode === 'offline'
  
  const getBasePath = () => {
    if (isGithub) return '/clic-frontend-workspace/chatbot/'
    return (mode === 'production' || isOffline) ? '' : './'
  }

  const pwaScope = getBasePath() || './'
  // Versão, commit e data do build: modal de Info, telemetria e dist/version.json
  const buildInfo = appBuildInfo(new URL('./package.json', import.meta.url))

  return {
    define: buildInfo.define,
    plugins: [
      vue(),
      buildInfo.plugin,
      ...(isOffline ? [viteSingleFile()] : [
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false,
          manifest: {
            name: 'CLIC Novelo',
            short_name: 'Novelo',
            description: 'Crie chatbots no CLIC Novelo',
            theme_color: '#FFCC00',
            background_color: '#ffffff',
            display: 'standalone',
            id: 'clic-chatbot', // O mesmo da v1: o app já instalado se atualiza, em vez de virar outro app
            start_url: pwaScope === './' ? './editor' : pwaScope, 
            scope: pwaScope,
            icons: [
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