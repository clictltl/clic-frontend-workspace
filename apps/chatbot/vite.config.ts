import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detecta o target pelo argumento --mode
  const isGithub = mode === 'github'
  const isOffline = mode === 'offline'
  
  // Define o base path baseado no target
  const getBasePath = () => {
    if (isGithub) {
      return '/clic-frontend-workspace/chatbot/'
    }
    // WordPress ou Offline
    return (mode === 'production' || isOffline) ? '' : './'
  }

  return {
    plugins: [
      vue(),
      ...(isOffline ? [viteSingleFile()] : [])
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
