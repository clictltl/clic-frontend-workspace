<script setup lang="ts">
import { ref } from 'vue';
import Board from '@/editor/components/board/Board.vue';
import ReaderLayout from '@/runtime/layouts/ReaderLayout.vue';
import FileMenu from '@/editor/components/layout/FileMenu.vue';
import { AppHeader, AuthMenu, ToastContainer } from '@clic/shared';
import { Pencil, Eye } from 'lucide-vue-next';

const isPreview = ref(false);

function handleLoginSuccess() {
  // Mais tarde vamos colocar a lógica de recarregar a página aqui!
}
</script>

<template>
  <div class="app-root">
    
    <!-- HEADER -->
    <AppHeader title="Graph Builder">
      <FileMenu />
      <AuthMenu @login-success="handleLoginSuccess" />
    </AppHeader>

    <!-- ÁREA PRINCIPAL -->
    <main class="main-viewport">
      <Board v-if="!isPreview" /> 
      <ReaderLayout v-else />
    </main>

    <!-- BOTÃO FLUTUANTE (FAB) PARA VISUALIZAR -->
    <button 
      class="fab-preview" 
      :class="{ active: isPreview }" 
      @click="isPreview = !isPreview"
    >
      <component :is="isPreview ? Pencil : Eye" class="icon-fab" />
      <span class="label">{{ isPreview ? 'Editar' : 'Visualizar' }}</span>
    </button>

    <ToastContainer />
  </div>
</template>

<style>
/* CSS Global Reset */
html, body, #app {
  margin: 0; padding: 0; width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f9fafb;
  color: #1f2937;
}

.app-root { display: flex; flex-direction: column; height: 100vh; position: relative; }

.main-viewport {
  flex: 1; overflow: hidden; display: flex; flex-direction: column;
}

/* FAB (Floating Action Button) */
.fab-preview {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  
  display: flex;
  align-items: center;
  gap: 8px;
  
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fab-preview:hover {
  background-color: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.fab-preview.active {
  background-color: #4b5563;
  box-shadow: 0 4px 12px rgba(75, 85, 99, 0.3);
}

.fab-preview.active:hover {
  background-color: #374151;
}

.icon-fab {
  width: 18px;
  height: 18px;
}
</style>