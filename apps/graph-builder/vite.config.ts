import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detecta o target pelo argumento --mode
  const isGithub = mode === 'github'
  const isOffline = mode === 'offline'
  const isPwa = mode === 'pwa'
  
  // Define o base path baseado no target
  const getBasePath = () => {
    if (isPwa) return '/grafite-pwa/'
    if (isGithub) return '/clic-frontend-workspace/graph-builder/'
    return (mode === 'production' || isOffline) ? '' : './'
  }

  return {
    plugins: [
      vue(),
      ...(isOffline ? [viteSingleFile()] : []),
      ...(isPwa ? [
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'CLIC Grafite',
            short_name: 'Grafite',
            description: 'Crie grafos com o CLIC Grafite',
            theme_color: '#FFCC00',
            background_color: '#ffffff',
            display: 'standalone',
            id: getBasePath(),
            start_url: getBasePath(),
            scope: getBasePath(),
            icons: [
              { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
              { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }
            ]
          }
        })
      ] : [])
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: getBasePath(),
    build: {
      outDir: isOffline ? 'dist-offline' : (isPwa ? 'dist-pwa' : 'dist'),
      assetsDir: 'assets',
      sourcemap: false,
      manifest: !(isOffline || isPwa),
      chunkSizeWarningLimit: 1000,
      rolldownOptions: (isOffline || isPwa) ? undefined : {
        input: {
          index: fileURLToPath(new URL('./index.html', import.meta.url)),
          editor: fileURLToPath(new URL('./src/editor/main-editor.ts', import.meta.url)),
          runtime: fileURLToPath(new URL('./src/runtime/main-runtime.ts', import.meta.url)),
        },
      },
    }
  }
})