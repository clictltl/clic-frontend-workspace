import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detecta o target pelo argumento --mode
  const isGithub = mode === 'github'
  
  // Define o base path baseado no target
  const getBasePath = () => {
    if (isGithub) {
      return '/clic-frontend-workspace/graph-builder/'
    }
    // WordPress - usa path vazio em produção
    return mode === 'production' ? '' : './'
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: getBasePath(),
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      manifest: true,
      rollupOptions: {
        input: {
          index: fileURLToPath(new URL('./index.html', import.meta.url)),
          editor: fileURLToPath(new URL('./src/editor/main-editor.ts', import.meta.url)),
          runtime: fileURLToPath(new URL('./src/runtime/main-runtime.ts', import.meta.url)),
        },
      },
    }
  }
})