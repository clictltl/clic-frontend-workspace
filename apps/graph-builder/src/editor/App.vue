<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Board from '@/editor/components/board/Board.vue';
import ReaderLayout from '@/runtime/layouts/ReaderLayout.vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useProjects } from '@/editor/utils/useProjects';
import { assetStore } from '@/shared/stores/assetStore';
import { AppHeader, AuthMenu, FileMenu, InvalidShareLinkModal, ToastContainer } from '@clic/shared';
import { Pencil, Eye } from 'lucide-vue-next';

const props = defineProps<{
  shareLoadError?: boolean;
}>();

const store = useProjectStore();
const projects = useProjects();

const showInvalidShareModal = ref(props.shareLoadError || false);
const isPreview = ref(false);

async function handleLoginSuccess() {
  await assetStore.persistToDisk(); 
  
  const backup = {
    id: projects.currentProjectId.value,
    name: projects.currentProjectName.value,
    data: store.project,
    wasDirty: store.hasUnsavedChanges
  };

  sessionStorage.setItem('clic-graph-builder:login-backup', JSON.stringify(backup));

  // Evita o aviso que vai perder tudo se atualizar
  store.markAsSaved();

  window.location.reload();
}

// --- PROTEÇÃO CONTRA FECHAMENTO DE ABA (F5 / Fechar Aba) ---
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (store.hasUnsavedChanges) {
    // Cancela o evento (Padrão moderno)
    e.preventDefault();
    
    // Define o valor de retorno (Exigido pelo Chrome/Chromium para mostrar o alerta)
    // @ts-ignore: Propriedade depreciada, mas necessária para compatibilidade
    e.returnValue = ''; 
    
    return '';
  }
};

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <div class="app-root">
    
    <!-- HEADER -->
    <AppHeader title="Graph.it">
      <FileMenu 
        item-name="Grafo"
        file-extension=".clic-graph"
        file-accept=".clic-graph,.zip,.json"
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
    <InvalidShareLinkModal v-if="showInvalidShareModal" item-name="Grafo" @close="showInvalidShareModal = false" />
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