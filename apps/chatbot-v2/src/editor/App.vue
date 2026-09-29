<script setup lang="ts">
import { onMounted } from 'vue';
import { useProjectStore } from '../shared/stores/projectStore';
import { useHistoryShortcuts } from '@clic/shared';
import Canvas from './components/canvas/Canvas.vue';
import Sidebar from './components/panels/Sidebar.vue';

const projectStore = useProjectStore();

// Ativa o Ctrl+Z (Undo) e Ctrl+Shift+Z (Redo) de forma global para este projeto!
useHistoryShortcuts(projectStore);

onMounted(() => {
  // Apenas para inicialização inicial segura
  if (!projectStore.project.uuid) {
    projectStore.createNew();
  }
});
</script>

<template>
  <div class="editor-layout">
    <!-- O AppHeader (Salvar/Testar) entrará aqui na próxima fase -->
    <header style="background: #1e3a8a; color: white; padding: 1rem;">
      <h1 style="margin: 0; font-size: 18px;">CLIC Chatbot Editor v2</h1>
    </header>
    
    <main class="editor-main">
      <div class="canvas-area">
        <Canvas />
      </div>
      <Sidebar />
    </main>
  </div>
</template>

<style>
body { margin: 0; font-family: sans-serif; overflow: hidden; background: #f3f4f6; }
.editor-layout { display: flex; flex-direction: column; height: 100vh; }
.editor-main { display: flex; flex: 1; height: calc(100vh - 56px); overflow: hidden; }
.canvas-area { flex: 1; position: relative; }
</style>