<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppHeader, AuthMenu, FileMenu, InvalidShareLinkModal, ToastContainer, telemetryService } from '@clic/shared';
import { Turtle, BookOpen, Play, Compass, LayoutGrid, Rocket } from '@lucide/vue';
import appLogo from '@/assets/logo_caramelo.svg';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useProjects } from '@/editor/utils/useProjects';
import { assetStore } from '@/shared/stores/assetStore';

import BlockWorkspace from './components/BlockWorkspace.vue';

const { t } = useI18n();
const store = useProjectStore();
const projects = useProjects();

const showInvalidShareModal = ref(false);
const isPreview = ref(false);

// Controle de tamanho da grade exclusivo para o nível Avançado
const gridSizeAbs = ref(8);
const gridSizeRel = ref(8);
const gridSizeBoth = ref(8);

// --- MINI ROUTER (VANILLA JS HASH) ---
let isRevertingHash = false;
let lastHash = window.location.hash;

const handleHashChange = () => {
  // 1. Se fomos nós mesmos revertendo a URL, ignora o evento para não causar loop infinito
  if (isRevertingHash) {
    isRevertingHash = false;
    lastHash = window.location.hash;
    return;
  }

  const currentHash = window.location.hash;

  // 2. Proteção de Saída (Botão Voltar do Navegador)
  if (store.isConfigured && store.hasUnsavedChanges) {
    if (!window.confirm(t('emojiCoder.messages.unsaved_confirm'))) {
      isRevertingHash = true;
      window.location.hash = lastHash; // Força a URL de volta silenciosamente
      return;
    }
  }

  lastHash = currentHash;

  // 3. Roteamento: Parse do Link
  if (currentHash.startsWith('#lib=')) {
    const params = new URLSearchParams(currentHash.substring(1));
    const lib = params.get('lib');
    const grid = parseInt(params.get('grid') || '8', 10);

    if (lib) {
      store.setupEnvironment(lib, grid, grid);
      store.markAsSaved(); 
    }
  } else if (!currentHash || currentHash === '#') {
    // 4. Retornou para o Dashboard
    store.createNew();
    projects.currentProjectId.value = null;
    projects.currentProjectName.value = '';
  }
};

const handleStartProject = (libraryId: string, gridSize: number) => {
  // Ao invés de iniciar direto, apenas mudamos a URL. O listener de hash fará o resto!
  window.location.hash = `lib=${libraryId}&grid=${gridSize}`;
};

const handleHomeClick = () => {
  if (store.hasUnsavedChanges) {
    if (!window.confirm(t('emojiCoder.messages.unsaved_confirm'))) {
      return;
    }
  }
  
  store.createNew(); 
  projects.currentProjectId.value = null;
  projects.currentProjectName.value = '';

  // Limpa a URL inteira (Search Params e Hash) SEM disparar eventos
  window.history.pushState({}, document.title, window.location.pathname);
  lastHash = '';
};

// Distribui a função de navegação blindada para toda a árvore de componentes
provide('goHomeAction', handleHomeClick);

async function handleLoginSuccess() {
  await assetStore.persistToDisk(); 
  
  const backup = {
    id: projects.currentProjectId.value,
    name: projects.currentProjectName.value,
    data: store.project,
    wasDirty: store.hasUnsavedChanges,
    telemetryQueue: telemetryService.getOfflineQueue(),
    telemetrySession: telemetryService.getSessionInfo()
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
  const remixToken = params.get("remix");
  const previewId = params.get("preview");

  if (shareToken) {
    const success = await projects.loadSharedProject(shareToken);
    if (!success) showInvalidShareModal.value = true;
    window.history.replaceState({}, document.title, window.location.pathname);
    } else if (remixToken) {
    const success = await projects.loadRemixProject(remixToken);
    if (!success) showInvalidShareModal.value = true;
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (previewId) {
    const success = await projects.loadPreviewProject(previewId);
    if (!success) alert(t('global.messages.preview_denied'));
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. Restauração de backup (Pós-Login)
  const loginBackup = sessionStorage.getItem('clic-emoji-coder:login-backup');
  if (loginBackup) {
    try {
      const parsedSaved = JSON.parse(loginBackup);

      if (parsedSaved.telemetryQueue && parsedSaved.telemetrySession) {
        telemetryService.resumeSession(
          parsedSaved.telemetrySession.sessionId,
          parsedSaved.telemetrySession.projectUuid,
          parsedSaved.telemetrySession.appType,
          parsedSaved.telemetryQueue
        );
      }

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

  // 3. Inicialização Direta via Link (Hash)
  if (!shareToken && !remixToken && !previewId && !loginBackup && window.location.hash.startsWith('#lib=')) {
    handleHashChange();
  }

  window.addEventListener('hashchange', handleHashChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <div class="app-root">
    <!-- HEADER DO ECOSSISTEMA -->
    <AppHeader 
      title="Caramelo" 
      :app-logo="appLogo"
      :show-home="store.isConfigured"
      @home-click="handleHomeClick"
    >
      <template #file-menu>
        <FileMenu 
          :item-name="t('global.project')"
          file-extension=".ccr"
          file-accept=".ccr"
          :projectsStore="projects"
          :assetStore="assetStore"
          :has-unsaved-changes="store.hasUnsavedChanges"
          :getProjectData="() => store.project"
          @new-project="store.createNew(true)"
          @import-project="store.loadProject"
        />
      </template>
      <template #auth-menu>
        <AuthMenu @login-success="handleLoginSuccess" />
      </template>
    </AppHeader>

    <!-- ÁREA PRINCIPAL -->
    <main class="main-viewport">
      
      <!-- Tela 1: Hub Educacional (Dashboard) -->
      <div v-if="!store.isConfigured && !isPreview" class="dashboard-screen">
        <div class="dashboard-content">
          
          <!-- SEÇÃO 1: COMO USAR A FERRAMENTA (TUTORIAIS) -->
          <section class="grade-section">
            <div class="section-title">
              <BookOpen :size="24" class="section-icon" style="color: #16a34a" />
              <div>
                <h2>{{ t('emojiCoder.setup.tutorials.title') }}</h2>
                <p>{{ t('emojiCoder.setup.tutorials.desc') }}</p>
              </div>
            </div>

            <div class="cards-grid">
              <!-- Tutorial: Absoluto -->
              <div class="activity-card clickable" @click="handleStartProject('abs-mov-tutorial', 8)">
                <div class="card-icon highlight"><BookOpen :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.tutorials.abs_title') }}</h3>
                <p>{{ t('emojiCoder.setup.tutorials.abs_desc') }}</p>
                <div class="start-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>

              <!-- Tutorial: Relativo -->
              <div class="activity-card clickable" @click="handleStartProject('rel-mov-tutorial', 8)">
                <div class="card-icon highlight"><BookOpen :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.tutorials.rel_title') }}</h3>
                <p>{{ t('emojiCoder.setup.tutorials.rel_desc') }}</p>
                <div class="start-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>
            </div>
          </section>

          <hr class="section-divider" />

          <!-- SEÇÃO 2: ATIVIDADES DIRIGIDAS (SD1) -->
          <section class="grade-section">
            <div class="section-title">
              <Compass :size="24" class="section-icon" style="color: #3b82f6" />
              <div>
                <h2>{{ t('emojiCoder.setup.sd1.title') }}</h2>
                <!-- Usamos v-html aqui para que o JSON de tradução possa conter a tag <a href="..."> -->
                <p v-html="t('emojiCoder.setup.sd1.desc')"></p> 
              </div>
            </div>

            <div class="cards-grid">
              <!-- Aula 1 -->
              <div class="activity-card clickable" @click="handleStartProject('sd1-class1', 8)">
                <div class="card-icon highlight-blue"><Compass :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.sd1.class1_title') }}</h3>
                <p>{{ t('emojiCoder.setup.sd1.class1_desc') }}</p>
                <div class="start-btn blue-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>

              <!-- Aula 2 -->
              <div class="activity-card clickable" @click="handleStartProject('sd1-class2', 8)">
                <div class="card-icon highlight-blue"><Compass :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.sd1.class2_title') }}</h3>
                <p>{{ t('emojiCoder.setup.sd1.class2_desc') }}</p>
                <div class="start-btn blue-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>

              <!-- Aula 3 -->
              <div class="activity-card clickable" @click="handleStartProject('sd1-class3', 8)">
                <div class="card-icon highlight-blue"><Compass :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.sd1.class3_title') }}</h3>
                <p>{{ t('emojiCoder.setup.sd1.class3_desc') }}</p>
                <div class="start-btn blue-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>
            </div>
          </section>

          <hr class="section-divider" />

          <!-- SEÇÃO 3: CRIE SEUS PROJETOS (SANDBOXES) -->
          <section class="grade-section">
            <div class="section-title">
              <LayoutGrid :size="24" class="section-icon orange" />
              <div>
                <h2>{{ t('emojiCoder.setup.sandboxes.title') }}</h2>
                <p>{{ t('emojiCoder.setup.sandboxes.desc') }}</p>
              </div>
            </div>

            <div class="cards-grid">
              <!-- Sandbox: Absoluto -->
              <div class="activity-card clickable" @click="handleStartProject('abs-mov-sandbox', gridSizeAbs)">
                <div class="card-icon highlight-orange"><Turtle :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.sandboxes.abs_title') }}</h3>
                <p>{{ t('emojiCoder.setup.sandboxes.abs_desc') }}</p>
                <div class="card-options">
                  <label class="grid-select-label">
                    <LayoutGrid :size="16"/> {{ t('emojiCoder.setup.grid_size') }}
                  </label>
                  <select v-model="gridSizeAbs" class="grid-select" @click.stop>
                    <option :value="6">{{ t('emojiCoder.setup.grid_small') }}</option>
                    <option :value="8">{{ t('emojiCoder.setup.grid_medium') }}</option>
                    <option :value="12">{{ t('emojiCoder.setup.grid_large') }}</option>
                    <option :value="16">{{ t('emojiCoder.setup.grid_max') }}</option>
                  </select>
                </div>
                <div class="start-btn orange-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>

              <!-- Sandbox: Relativo -->
              <div class="activity-card clickable" @click="handleStartProject('rel-mov-sandbox', gridSizeRel)">
                <div class="card-icon highlight-orange"><Turtle :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.sandboxes.rel_title') }}</h3>
                <p>{{ t('emojiCoder.setup.sandboxes.rel_desc') }}</p>
                <div class="card-options">
                  <label class="grid-select-label">
                    <LayoutGrid :size="16"/> {{ t('emojiCoder.setup.grid_size') }}
                  </label>
                  <select v-model="gridSizeRel" class="grid-select" @click.stop>
                    <option :value="6">{{ t('emojiCoder.setup.grid_small') }}</option>
                    <option :value="8">{{ t('emojiCoder.setup.grid_medium') }}</option>
                    <option :value="12">{{ t('emojiCoder.setup.grid_large') }}</option>
                    <option :value="16">{{ t('emojiCoder.setup.grid_max') }}</option>
                  </select>
                </div>
                <div class="start-btn orange-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>

              <!-- Sandbox: Ambos -->
              <div class="activity-card clickable" @click="handleStartProject('abs-rel-mov-sandbox', gridSizeBoth)">
                <div class="card-icon highlight-red" style="background-color: #fee2e2; color: #ef4444;"><Rocket :size="32" /></div>
                <h3>{{ t('emojiCoder.setup.sandboxes.both_title') }}</h3>
                <p>{{ t('emojiCoder.setup.sandboxes.both_desc') }}</p>
                <div class="card-options">
                  <label class="grid-select-label">
                    <LayoutGrid :size="16"/> {{ t('emojiCoder.setup.grid_size') }}
                  </label>
                  <select v-model="gridSizeBoth" class="grid-select" @click.stop>
                    <option :value="6">{{ t('emojiCoder.setup.grid_small') }}</option>
                    <option :value="8">{{ t('emojiCoder.setup.grid_medium') }}</option>
                    <option :value="12">{{ t('emojiCoder.setup.grid_large') }}</option>
                    <option :value="16">{{ t('emojiCoder.setup.grid_max') }}</option>
                  </select>
                </div>
                <div class="start-btn red-btn">
                  <Play :size="18" /> {{ t('emojiCoder.setup.start_btn') }}
                </div>
              </div>
            </div>
          </section>

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
    <InvalidShareLinkModal v-if="showInvalidShareModal" :item-name="t('global.project')" @close="showInvalidShareModal = false" />
  </div>
</template>

<!-- ESTILOS GLOBAIS -->
<style>
/* CSS Global Reset */
* {
  box-sizing: border-box;
}

html, body, #app {
  margin: 0; padding: 0; width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f9fafb;
  color: #1f2937;
  overscroll-behavior-y: none; 
}
.app-root { display: flex; flex-direction: column; height: 100vh; height: 100dvh; position: relative; }
.main-viewport { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* FAB (Floating Action Button) */
.fab-preview { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; align-items: center; gap: 8px; background-color: #2563eb; color: white; border: none; padding: 12px 20px; border-radius: 30px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.fab-preview:hover { background-color: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4); }
.fab-preview.active { background-color: #4b5563; box-shadow: 0 4px 12px rgba(75, 85, 99, 0.3); }
.fab-preview.active:hover { background-color: #374151; }
.icon-fab { width: 18px; height: 18px; }
</style>

<!-- ESTILOS LOCAIS DA TELA HUB -->
<style scoped>
.dashboard-screen {
  height: 100%;
  overflow-y: auto;
  background-color: #f1f5f9;
  padding: 3rem 1rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}
.dashboard-header .text-icon {
  color: #22c55e;
  margin-bottom: 0.5rem;
}
.dashboard-header h1 {
  margin: 0;
  font-size: 2.5rem;
  color: #0f172a;
}
.dashboard-header p {
  color: #64748b;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.dashboard-content {
  max-width: 1150px;
  margin: 0 auto;
}

.section-divider {
  border: 0;
  height: 1px;
  background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0));
  margin: 3rem 0;
}

.grade-section {
  margin-bottom: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.section-icon {
  color: #3b82f6; /* Azul base */
}
.section-icon.orange { color: #f97316; }
.section-title h2 { margin: 0; font-size: 1.5rem; color: #1e293b; }
.section-title p { margin: 0; color: #64748b; font-size: 0.95rem; }

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 340px));
  justify-content: start;
  gap: 1.5rem;
}

/* Adiciona o efeito visual de clique no card inteiro */
.activity-card.clickable {
  cursor: pointer;
}
.activity-card.clickable:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* O Card de Atividade */
.activity-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e2e8f0;
}
.activity-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}
.activity-card.disabled {
  opacity: 0.7;
  background-color: #f8fafc;
  cursor: not-allowed;
}

.card-icon {
  width: 56px; height: 56px;
  border-radius: 12px;
  background-color: #f1f5f9;
  color: #64748b;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1rem;
}
.card-icon.highlight { background-color: #dcfce7; color: #22c55e; }
.card-icon.highlight-purple { background-color: #f3e8ff; color: #a855f7; }
.card-icon.highlight-orange { background-color: #ffedd5; color: #f97316; }

.activity-card h3 { margin: 0 0 0.5rem 0; font-size: 1.15rem; color: #0f172a; }
.activity-card p { margin: 0 0 1.5rem 0; color: #64748b; font-size: 0.9rem; line-height: 1.4; flex-grow: 1; }

.card-options {
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 8px;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.fixed-grid-label, .grid-select-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; font-weight: 600; color: #475569;
}
.grid-select {
  padding: 0.5rem; border-radius: 6px; border: 1px solid #cbd5e1;
  background: white; color: #1e293b; font-size: 0.9rem; outline: none; cursor: pointer;
}
.grid-select:focus { border-color: #3b82f6; }

.card-footer { display: flex; align-items: center; margin-top: auto; }
.badge { display: flex; align-items: center; gap: 4px; background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }

.start-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.75rem; border: none; border-radius: 8px;
  font-size: 1rem; font-weight: bold; cursor: pointer;
  background-color: #22c55e; color: white; transition: background-color 0.2s;
  margin-top: auto;
}
.start-btn:hover { background-color: #16a34a; }

.purple-btn { background-color: #a855f7; }
.purple-btn:hover { background-color: #9333ea; }

.orange-btn { background-color: #f97316; }
.orange-btn:hover { background-color: #ea580c; }

.card-icon.highlight-blue { background-color: #dbeafe; color: #3b82f6; }
.blue-btn { background-color: #3b82f6; }
.blue-btn:hover { background-color: #2563eb; }

.card-icon.highlight-red { background-color: #fee2e2; color: #ef4444; }
.red-btn { background-color: #ef4444; }
.red-btn:hover { background-color: #dc2626; }

.start-btn { pointer-events: none; }
</style>