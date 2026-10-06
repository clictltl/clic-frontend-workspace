<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Board from '@/editor/components/board/Board.vue';
import ReaderLayout from '@/runtime/layouts/ReaderLayout.vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useProjects } from '@/editor/utils/useProjects';
import { assetStore } from '@/shared/stores/assetStore';
import { AppHeader, AuthMenu, FileMenu, InvalidShareLinkModal, ToastContainer, useEditorBootstrap, useHistoryShortcuts } from '@clic/shared';
import { Pencil, Eye } from '@lucide/vue';
import appLogo from '@/assets/logo_grafite.svg';

const { t } = useI18n();
const store = useProjectStore();
const projects = useProjects();

const isPreview = ref(false);

// Ativa os atalhos globais de Undo/Redo
useHistoryShortcuts(store);

// Links de share/remix/preview e aviso ao fechar a aba.
// Sem link, cria um projeto novo (dispara o Frame Zero da telemetria).
const { showInvalidShareModal } = useEditorBootstrap({
  projects,
  hasUnsavedChanges: () => store.hasUnsavedChanges,
  onFreshStart: () => store.createNew()
});
</script>

<template>
  <div class="app-root">
    
    <!-- HEADER -->
    <AppHeader title="Grafite" :app-logo="appLogo">
      <template #file-menu>
        <FileMenu 
          :item-name="t('global.project')"
          file-extension=".cgr"
          file-accept=".cgr"
          :projectsStore="projects"
          :assetStore="assetStore"
          :has-unsaved-changes="store.hasUnsavedChanges"
          :getProjectData="() => store.project"
          @new-project="store.createNew"
          @import-project="store.loadProject"
        />
      </template>
      <template #auth-menu>
        <AuthMenu />
      </template>
    </AppHeader>

    <!-- ÁREA PRINCIPAL -->
    <main class="main-viewport">
      <Board v-if="!isPreview" /> 
      <ReaderLayout v-else is-preview/>
    </main>

    <!-- BOTÃO FLUTUANTE (FAB) PARA VISUALIZAR -->
    <button 
      class="fab-preview" 
      :class="{ active: isPreview }" 
      @click="isPreview = !isPreview"
    >
      <component :is="isPreview ? Pencil : Eye" class="icon-fab" />
      <span class="label">{{ isPreview ? t('graphBuilder.editor.edit') : t('graphBuilder.editor.preview') }}</span>
    </button>

    <ToastContainer />
    <InvalidShareLinkModal v-if="showInvalidShareModal" :item-name="t('global.project')" @close="showInvalidShareModal = false" />
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