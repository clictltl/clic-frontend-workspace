<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppHeader, AuthMenu, FileMenu, InvalidShareLinkModal, ToastContainer } from '@clic/shared';
import { Turtle } from '@lucide/vue';
import appLogo from '@/assets/emojer_logo.svg';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useProjects } from '@/editor/utils/useProjects';
import { assetStore } from '@/shared/stores/assetStore';

import BlockWorkspace from './components/BlockWorkspace.vue';

const { t } = useI18n();
const store = useProjectStore();
const projects = useProjects();

const showInvalidShareModal = ref(false);
const isPreview = ref(false);

// Formulário temporário da tela de setup
const form = ref({ libraryId: 'turtle-grade-4', gridSize: 8 });

const handleStart = () => {
  store.setupEnvironment(form.value.libraryId, form.value.gridSize, form.value.gridSize);
};

async function handleLoginSuccess() {
  await assetStore.persistToDisk(); 
  
  const backup = {
    id: projects.currentProjectId.value,
    name: projects.currentProjectName.value,
    data: store.project,
    wasDirty: store.hasUnsavedChanges
  };

  sessionStorage.setItem('clic-emoji-coder:login-backup', JSON.stringify(backup));
  store.markAsSaved();
  window.location.reload();
}

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (store.hasUnsavedChanges) {
    e.preventDefault();
    // @ts-ignore
    e.returnValue = ''; 
    return '';
  }
};

onMounted(async () => {
  // 1. Carregamento via link compartilhado ou Visualização
  const params = new URLSearchParams(window.location.search);
  const shareToken = params.get("share");
  const previewId = params.get("preview");

  if (shareToken) {
    const success = await projects.loadSharedProject(shareToken);
    if (!success) showInvalidShareModal.value = true;
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (previewId) {
    const success = await projects.loadPreviewProject(previewId);
    if (!success) alert("Acesso negado ou falha ao carregar projeto.");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. Restauração de backup (Pós-Login)
  const loginBackup = sessionStorage.getItem('clic-emoji-coder:login-backup');
  if (loginBackup) {
    try {
      const parsedSaved = JSON.parse(loginBackup);
      store.loadProject(parsedSaved.data, !!parsedSaved.wasDirty);
      projects.currentProjectId.value = parsedSaved.id;
      projects.currentProjectName.value = parsedSaved.name || '';
      await assetStore.restoreFromDisk();
      sessionStorage.removeItem('clic-emoji-coder:login-backup');
      await assetStore.clearDisk();
    } catch (e) {
      console.error("Erro ao restaurar backup local:", e);
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <div class="app-root">
    <!-- HEADER DO ECOSSISTEMA -->
    <AppHeader :title="t('emojiCoder.setup.app_title')" :app-logo="appLogo">
      <FileMenu 
        item-name="Emoji Coder"
        file-extension=".emjc"
        file-accept=".emjc"
        :projectsStore="projects"
        :assetStore="assetStore"
        :has-unsaved-changes="store.hasUnsavedChanges"
        :getProjectData="() => store.project"
        @new-project="store.createNew"
        @import-project="store.loadProject"
      />
      <AuthMenu @login-success="handleLoginSuccess" />
    </AppHeader>

    <!-- ÁREA PRINCIPAL -->
    <main class="main-viewport">
      
      <!-- Tela 1: Setup Inicial -->
      <div v-if="!store.isConfigured && !isPreview" class="setup-screen">
        <div class="setup-card">
          <h1 class="title-with-icon">
            <Turtle :size="32" class="text-icon" />
            {{ t('emojiCoder.setup.app_title') }}
          </h1>
          <p>{{ t('emojiCoder.setup.prepare_env') }}</p>
          
          <div class="form-group">
            <label>{{ t('emojiCoder.setup.lib_level') }}</label>
            <select v-model="form.libraryId">
              <option value="turtle-grade-4">{{ t('emojiCoder.setup.grade_4') }}</option>
              <option value="turtle-grade-4-advanced">{{ t('emojiCoder.setup.grade_4_advanced') }}</option>
              <option value="turtle-grade-5">{{ t('emojiCoder.setup.grade_5') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('emojiCoder.setup.grid_size') }}</label>
            <div class="grid-inputs">
              <input type="number" v-model="form.gridSize" min="4" max="20" />
              <span>x</span>
              <input type="number" :value="form.gridSize" disabled />
            </div>
          </div>

          <button class="start-btn" @click="handleStart">{{ t('emojiCoder.setup.start_btn') }}</button>
        </div>
      </div>

      <!-- Tela 2 e 3: O Ambiente do Blockly e Visualização -->
      <BlockWorkspace 
        v-else 
        :is-preview="isPreview" 
        @toggle-preview="isPreview = !isPreview" 
      />

    </main>

    <ToastContainer />
    <InvalidShareLinkModal v-if="showInvalidShareModal" item-name="Projeto" @close="showInvalidShareModal = false" />
  </div>
</template>

<!-- ESTILOS GLOBAIS (Iguais ao Graph Builder) -->
<style>
/* CSS Global Reset */
html, body, #app {
  margin: 0; padding: 0; width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f9fafb;
  color: #1f2937;
  /* Essencial para Mobile: Impede pull-to-refresh e gestos nativos atrapalharem o Blockly */
  overscroll-behavior-y: none; 
}
.app-root { display: flex; flex-direction: column; height: 100vh; position: relative; }
.main-viewport { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* FAB (Floating Action Button) */
.fab-preview { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; align-items: center; gap: 8px; background-color: #2563eb; color: white; border: none; padding: 12px 20px; border-radius: 30px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.fab-preview:hover { background-color: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4); }
.fab-preview.active { background-color: #4b5563; box-shadow: 0 4px 12px rgba(75, 85, 99, 0.3); }
.fab-preview.active:hover { background-color: #374151; }
.icon-fab { width: 18px; height: 18px; }
</style>

<!-- ESTILOS LOCAIS DA TELA DE SETUP EMOJI CODER -->
<style scoped>
.setup-screen { display: flex; align-items: center; justify-content: center; height: 100%; }
.setup-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
.title-with-icon { display: flex; align-items: center; gap: 0.5rem; margin-top: 0; }
.text-icon { color: #4CAF50; }
.form-group { margin: 1.5rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
.grid-inputs { display: flex; align-items: center; gap: 0.5rem; }
.grid-inputs input { width: 80px; padding: 0.5rem; }
select, input { padding: 0.5rem; border-radius: 6px; border: 1px solid #ccc; }
.start-btn { width: 100%; padding: 0.75rem; background-color: #4CAF50; color: white; border: none; border-radius: 6px; font-size: 1.1rem; cursor: pointer; font-weight: bold; }
.start-btn:hover { background-color: #45a049; }
.preview-mode { padding: 2rem; text-align: center; }
</style>