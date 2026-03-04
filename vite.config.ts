import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detecta se estamos buildando para o GitHub Pages
  const isGithub = mode === 'github'

  return {
    plugins: [vue()],
    
    // Define o caminho base. 
    // Se for Github -> '/nome-do-repo/'
    // Se for Local/WP -> './' (relativo)
    base: isGithub ? '/graph-builder/' : './',

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Menor tamanho final
      rollupOptions: {
        input: {
          // O Index é o Editor (padrão ao abrir o site)
          index: fileURLToPath(new URL('./index.html', import.meta.url)),
          // O Runtime é um script separado para ser embedado depois
          runtime: fileURLToPath(new URL('./src/runtime/main-runtime.ts', import.meta.url)),
        },
      },
    }
  }
})