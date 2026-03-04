<script setup lang="ts">
import { ref } from 'vue';
import Board from '@/editor/components/board/Board.vue';
import ReaderLayout from '@/runtime/layouts/ReaderLayout.vue';
import FileMenu from '@/editor/components/layout/FileMenu.vue';
import ToastContainer from '@/shared/components/layout/ToastContainer.vue';
import clicLogo from '@/assets/logo-clic.svg';
import { Pencil, Eye } from 'lucide-vue-next';

const isPreview = ref(false);
</script>

<template>
  <div class="app-root">
    
    <!-- HEADER -->
    <header class="toolbar">
      <div class="toolbar-left">
        <a href="https://clic.tltlab.org" class="toolbar-logo-link">
          <img v-if="clicLogo" :src="clicLogo" alt="CLIC" class="toolbar-logo" />
          <span v-else>🔷</span>
        </a>
        <h1 class="toolbar-title">Graph Builder</h1>
      </div>

      <div class="toolbar-right">
        <FileMenu />
      </div>
    </header>

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

/* HEADER */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  gap: 24px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.toolbar-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.toolbar-logo {
  height: 42px;
  width: auto;
}

.toolbar-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  white-space: nowrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

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