<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Play } from '@lucide/vue';
import {
  AppHeader, AuthMenu, FileMenu, InvalidShareLinkModal, ToastContainer,
  useEditorBootstrap, useHistoryShortcuts
} from '@clic/shared';
import appLogo from '../assets/logo_novelo.svg';
import { useProjectStore } from '../shared/stores/projectStore';
import { assetStore } from '../shared/stores/assetStore';
import { provideMediaResolver } from '../shared/media/resolver';
import { tryLoadProject, useProjects } from './utils/useProjects';
import { resolveMediaSource } from './utils/mediaSource';
import Canvas from './components/canvas/Canvas.vue';
import Sidebar from './components/panels/Sidebar.vue';
import TestPanel from './components/test/TestPanel.vue';

const { t } = useI18n();
const store = useProjectStore();
const projects = useProjects();

// Mídias enviadas são resolvidas pelo assetStore (blob local ou URL pública)
provideMediaResolver(resolveMediaSource);

// Ativa o Ctrl+Z (Undo) e Ctrl+Shift+Z (Redo) de forma global para este projeto!
useHistoryShortcuts(store);

// Links de share/remix/preview e aviso ao fechar a aba.
// Sem link, cria um projeto novo (dispara o Frame Zero da telemetria).
const { showInvalidShareModal } = useEditorBootstrap({
  projects,
  hasUnsavedChanges: () => store.hasUnsavedChanges,
  onFreshStart: () => store.createNew()
});

// Painel "Testar" ao lado do canvas: editar e testar ao mesmo tempo
const isTesting = ref(false);
</script>

<template>
  <div class="editor-layout">
    <AppHeader
      title="Novelo"
      :app-logo="appLogo"
      guide-url="https://docs.google.com/presentation/d/12zqJqZYmpS43mbEpfiKqOnS-Pu9QiwUcCj9ydMrnBJ8/edit?usp=sharing"
    >
      <template #file-menu>
        <FileMenu
          :item-name="t('global.project')"
          file-extension=".cnv"
          file-accept=".cnv"
          :projects-store="projects"
          :asset-store="assetStore"
          :has-unsaved-changes="store.hasUnsavedChanges"
          :get-project-data="() => store.getProjectData()"
          :import-project="(data: unknown) => tryLoadProject(data)"
          @new-project="store.createNew()"
        />
      </template>
      <template #auth-menu>
        <AuthMenu />
      </template>
    </AppHeader>

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
    <InvalidShareLinkModal v-if="showInvalidShareModal" :item-name="t('global.project')" @close="showInvalidShareModal = false" />
  </div>
</template>

<style>
/* Reset e fonte vêm do base.css do @clic/shared (main-editor.ts) */
body { overflow: hidden; background: #f3f4f6; }
.editor-layout { display: flex; flex-direction: column; height: 100vh; }
.editor-main { display: flex; flex: 1; min-height: 0; overflow: hidden; }
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
