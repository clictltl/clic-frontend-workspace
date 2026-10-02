<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Play } from '@lucide/vue';
import { useProjectStore } from '../shared/stores/projectStore';
import { useHistoryShortcuts, ToastContainer } from '@clic/shared';
import Canvas from './components/canvas/Canvas.vue';
import Sidebar from './components/panels/Sidebar.vue';
import TestPanel from './components/test/TestPanel.vue';
import { provideMediaResolver } from '../shared/media/resolver';
import { resolveMediaSource } from './utils/mediaSource';

const { t } = useI18n();
const projectStore = useProjectStore();

// Mídias enviadas são resolvidas pelo assetStore (blob local ou URL pública)
provideMediaResolver(resolveMediaSource);

// Ativa o Ctrl+Z (Undo) e Ctrl+Shift+Z (Redo) de forma global para este projeto!
useHistoryShortcuts(projectStore);

// Painel "Testar" ao lado do canvas: editar e testar ao mesmo tempo
const isTesting = ref(false);

onMounted(() => {
  // Chamada explícita (mesmo com o state já inicializado) para disparar o Frame Zero da telemetria.
  // Na etapa do shell, aqui entram também share/remix/preview e o backup pós-login.
  projectStore.createNew();
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
        <button v-if="!isTesting" class="btn-test" @click="isTesting = true">
          <Play :size="16" fill="currentColor" /> {{ t('chatbot.editor.test.button') }}
        </button>
      </div>
      <TestPanel v-if="isTesting" @close="isTesting = false" />
      <Sidebar />
    </main>

    <ToastContainer />
  </div>
</template>

<style>
body { margin: 0; font-family: sans-serif; overflow: hidden; background: #f3f4f6; }
.editor-layout { display: flex; flex-direction: column; height: 100vh; }
.editor-main { display: flex; flex: 1; height: calc(100vh - 56px); overflow: hidden; }
.canvas-area { flex: 1; position: relative; min-width: 0; }
.btn-test {
  position: absolute; top: 16px; right: 16px; z-index: 10;
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer;
  background: #10b981; color: white; font-size: 14px; font-weight: 600;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}
.btn-test:hover { background: #059669; }
</style>
