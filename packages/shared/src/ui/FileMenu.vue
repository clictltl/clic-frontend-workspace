<template>
  <div class="filemenu-container" ref="fileMenuContainer">

    <!-- Grupo: Botão + Nome do Projeto -->
    <div class="trigger-group">
      
      <!-- Botão Gatilho -->
      <button class="menu-trigger" :class="{ 'active': open }" @click="toggleMenu">
        <span class="label">Arquivo</span>
        <ChevronDown :size="16" class="chevron" />
      </button>

      <!-- Nome do Projeto -->
      <div v-if="currentProjectId" class="project-info">
        <div class="separator-vertical"></div>
        <FileText :size="16" class="icon" />
        <span class="name" :title="currentProjectName">{{ currentProjectName }}</span>
        <span v-if="hasUnsavedChanges" class="unsaved-dot" title="Alterações não salvas"></span>
      </div>

    </div>

    <!-- Dropdown Menu -->
    <transition name="fade-slide">
      <div v-if="open" class="dropdown-menu" :class="{ 'align-right': !isWordPress }">
        
        <!-- Grupo: Novo -->
        <div class="menu-group">
          <div class="menu-item" @click="handleMenuClick(() => withGuard(newProject))">
            <FilePlus :size="16" class="icon" /> Novo projeto
          </div>
        </div>
        
        <div class="divider" v-if="showWordPressItems"></div>

        <!-- Grupo: WordPress -->
        <div class="menu-group" v-if="showWordPressItems">
          <div class="menu-label">Nuvem</div>
          <div class="menu-item" @click="handleMenuClick(saveProject)">
            <Save :size="16" class="icon" /> Salvar
          </div>
          <div class="menu-item" @click="handleMenuClick(openSaveAs)">
            <Bookmark :size="16" class="icon" /> Salvar como...
          </div>
          <div class="menu-item" @click="handleMenuClick(() => withGuard(openList))">
            <FolderOpen :size="16" class="icon" /> Abrir...
          </div>
          <div class="menu-item danger" @click="handleMenuClick(openDeleteModal)">
            <Trash2 :size="16" class="icon" /> Excluir...
          </div>
        </div>
        
        <div class="divider" v-if="showWordPressItems"></div>

        <!-- Grupo: Publicação -->
         <div class="menu-group" v-if="showWordPressItems">
          <div class="menu-item" @click="handleMenuClick(openShare)">
            <Link :size="16" class="icon" /> Compartilhar...
          </div>
          <div class="menu-item highlight" @click="handleMenuClick(openPublish)">
            <Rocket :size="16" class="icon" /> Publicar
          </div>
        </div>

        <div class="divider"></div>

        <!-- Grupo: Local -->
        <div class="menu-group">
          <div class="menu-label">Local (PC)</div>
          <div class="menu-item" @click="handleMenuClick(() => withGuard(openFromComputer))">
            <FolderInput :size="16" class="icon" /> Importar Projeto
          </div>
          <div class="menu-item" @click="handleMenuClick(saveToComputer)">
            <Download :size="16" class="icon" /> Exportar Projeto
          </div>
        </div>

      </div>
    </transition>

    <!-- Input invisível de Upload (Fora do v-if do dropdown para não ser destruído) -->
    <input 
      type="file" 
      ref="fileInput" 
      :accept="fileAccept"
      style="display: none" 
      @change="handleImport"
    />

    <!-- Modais -->
    <SaveAsModal v-if="showSaveAs" :mode="saveAsMode" :projectsStore="projectsStore" :item-name="itemName" @close="handleSaveAsClose"  @success="handleSaveAsSuccess"/>
    <OpenProjectModal v-if="showOpen" :projectsStore="projectsStore" :item-name="itemName" @close="showOpen = false" />
    <DeleteProjectModal v-if="showDelete" :projectsStore="projectsStore" :item-name="itemName" @close="showDelete = false" @deleted="handleDeleted"/>
    <ShareModal v-if="showShare" :projectsStore="projectsStore" :item-name="itemName" @close="showShare = false"/>
    <PublishModal v-if="showPublish" :projectsStore="projectsStore" :item-name="itemName" @close="showPublish = false"/>
    <UnsavedChangesModal v-if="showUnsavedChanges" :is-offline="!showWordPressItems" @cancel="handleUnsavedCancel" @discard="handleUnsavedDiscard" @save="handleUnsavedSave"/>
    <NeedSaveModal v-if="showNeedSave" :item-name="itemName" @close="showNeedSave = false" @save="handleNeedSaveConfirm" />

  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuth } from '../auth/auth';
import { useToast } from './useToast';
import { exportClicFile, importClicFile } from '../utils/projectIO'
import SaveAsModal from './modals/SaveAsModal.vue'
import OpenProjectModal from './modals/OpenProjectModal.vue'
import DeleteProjectModal from './modals/DeleteProjectModal.vue'
import ShareModal from './modals/ShareModal.vue'
import PublishModal from './modals/PublishModal.vue'
import UnsavedChangesModal from './modals/UnsavedChangesModal.vue'
import NeedSaveModal from './modals/NeedSaveModal.vue'
import {
  ChevronDown,
  FileText,
  FilePlus,
  Save,
  Bookmark,
  FolderOpen,
  Trash2,
  Link,
  Rocket,
  FolderInput,
  Download
} from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  itemName?: string;
  fileExtension?: string;
  fileAccept?: string;
  projectsStore: any;
  assetStore: any;
  hasUnsavedChanges?: boolean;
  getProjectData: () => any;
}>(), {
  itemName: 'Projeto',
  fileExtension: '.clic',
  fileAccept: '.clic,.zip,.json',
  hasUnsavedChanges: false
});

const emit = defineEmits(['new-project', 'import-project']);

const { currentProjectId, currentProjectName } = toRefs(props.projectsStore);
const auth = useAuth();
const toast = useToast();
const fileInput = ref<HTMLInputElement | null>(null);

const open = ref(false);
const showSaveAs = ref(false);
const saveAsMode = ref<'create' | 'copy'>('create');
const showOpen = ref(false);
const showDelete = ref(false);
const showShare = ref(false);
const showPublish = ref(false);
const showNeedSave = ref(false);
const pendingNextModal = ref<'share' | 'publish' | null>(null);

// Estados para Unsaved Changes
const showUnsavedChanges = ref(false);
const pendingAction = ref<Function | null>(null);

// Referência ao container principal para detectar cliques fora
const fileMenuContainer = ref<HTMLElement | null>(null);

// Detecta WordPress
const isWordPress =
  typeof window !== 'undefined' &&
  !!window.CLIC_AUTH && !!window.CLIC_CORE;

// Detecta usuário logado
const showWordPressItems = computed(() => {
  return auth.state.ready && auth.state.loggedIn;
});

// abre/fecha dropdown
function toggleMenu() {
  open.value = !open.value;
}

function handleMenuClick(action: Function) {
  open.value = false;
  props.projectsStore.error.value = null;
  action();
}

// Lógica de fechar ao clicar fora
const handleClickOutside = (event: MouseEvent) => {
  // Se o menu estiver aberto E o clique for fora do container
  if (
    open.value &&
    fileMenuContainer.value &&
    !fileMenuContainer.value.contains(event.target as Node)
  ) {
    open.value = false;
  }
};

// Lifecycle Hooks para adicionar/remover o listener global
onMounted(() => { document.addEventListener('click', handleClickOutside); });
onUnmounted(() => { document.removeEventListener('click', handleClickOutside); });

// Captura o nome da ferramenta que estava na aba (ex: "Novelo", "Graph.it")
const baseTitle = typeof document !== 'undefined' ? document.title.split(' - ').pop() : 'CLIC';

// Sincroniza o título da aba do navegador
watch(
  () =>[props.hasUnsavedChanges, currentProjectName?.value],
  ([unsaved, name]) => {
    const prefix = unsaved ? '* ' : '';
    if (name) {
      document.title = `${prefix}${name} - ${baseTitle}`;
    } else {
      document.title = `${prefix}${baseTitle}`;
    }
  },
  { immediate: true }
);

// --- Lógica de Proteção (Guard) ---

function withGuard(action: Function) {
  if (props.hasUnsavedChanges) {
    pendingAction.value = action;
    showUnsavedChanges.value = true;
  } else {
    action();
  }
}

function handleUnsavedCancel() {
  showUnsavedChanges.value = false;
  pendingAction.value = null;
}

function handleUnsavedDiscard() {
  showUnsavedChanges.value = false;
  if (pendingAction.value) {
    pendingAction.value(); // Executa a ação (ex: newProject) sem salvar
  }
  pendingAction.value = null;
  // O resetProjectData ou loadProject chamados pela ação vão resetar a flag props.hasUnsavedChanges
}

async function handleUnsavedSave() {
  showUnsavedChanges.value = false;
  
  // --- 1. FLUXO OFFLINE: "Salvar" significa "Exportar" ---
  if (!showWordPressItems.value) {
    await saveToComputer(); 
    if (pendingAction.value) {
      pendingAction.value();
      pendingAction.value = null;
    }
    return;
  }

  // --- 2. FLUXO ONLINE: Salvar na Nuvem ---
  // Cenário A: Projeto nunca salvo
  if (!props.projectsStore.currentProjectId.value) {
    // Configura o modal de Salvar Como
    saveAsMode.value = 'create';
    showSaveAs.value = true;
    
    // IMPORTANTE: Não limpamos pendingAction.value aqui!
    // Ele fica guardado esperando o sucesso do modal.
    return; 
  } 

  // Cenário B: Projeto já existe (Salvamento direto)
  const saved = await props.projectsStore.saveProject();

 if (saved) {
    toast.success("Salvo com sucesso!");

    // Se tinha algo pendente (ex: abrir novo projeto), executa agora
    if (pendingAction.value) {
      pendingAction.value();
      pendingAction.value = null;
    }
  } else {
    toast.error("Erro ao salvar.");
  }
}

// Novo
function newProject() {
  emit('new-project');

  // novo projeto SEMPRE rompe vínculo
  props.projectsStore.currentProjectId.value = null;
  props.projectsStore.currentProjectName.value = '';
}

// Salvar
async function saveProject() {
  // Se é um novo projeto, forçar "Salvar como..."
  if (!props.projectsStore.currentProjectId.value) {
    saveAsMode.value = 'create';
    showSaveAs.value = true;
    return;
  }

  // Senão salva normalmente
  try {
    const success = await props.projectsStore.saveProject();

    if (success) {
      toast.success('Projeto salvo com sucesso!');
    } else {
      toast.error(props.projectsStore.error.value || 'Erro ao salvar projeto.');
    }
  } catch (err) {
    console.error(err);
    toast.error('Ocorreu um erro inesperado.');
  }
}

// Salvar como...
function openSaveAs() {
  saveAsMode.value = 'copy';
  showSaveAs.value = true;
}

// Sucesso do modal Salvar Como
function handleSaveAsSuccess() {
  // Feedback visual sempre
  toast.success('Projeto salvo com sucesso!'); 
  
  // Prioridade 1: Havia uma ação pendente (vinda do Guard de "Não Salvo")?
  // Ex: Usuário clicou em "Novo Projeto" -> "Salvar" -> "Digitou Nome" -> Sucesso
  if (pendingAction.value) {
    pendingAction.value(); // Executa (ex: newProject())
    pendingAction.value = null; // Limpa
    return;
  }

  // Prioridade 2: Se veio do fluxo de Share/Publish
  if (pendingNextModal.value === 'share') { showShare.value = true; }
  if (pendingNextModal.value === 'publish') { showPublish.value = true; }
  pendingNextModal.value = null;
}

function handleSaveAsClose() {
  showSaveAs.value = false;
  pendingNextModal.value = null;
  pendingAction.value = null; 
}

// Abrir...
async function openList() {
  await props.projectsStore.listProjects();
  showOpen.value = true;
}

// Excluir...
function openDeleteModal() {
  showDelete.value = true;
}

function handleDeleted() {
  newProject();
  showDelete.value = false;
}

// Compartilhar...
function openShare() {
  if (!props.projectsStore.currentProjectId.value) {
    pendingNextModal.value = 'share';
    showNeedSave.value = true;
    return;
  }
  showShare.value = true;
}

// Publicar
function openPublish() {
  if (!props.projectsStore.currentProjectId.value) {
    pendingNextModal.value = 'publish';
    showNeedSave.value = true;
    return;
  }
  showPublish.value = true;
}

function handleNeedSaveConfirm() {
  showNeedSave.value = false;
  // Abre o modal de Salvar Como (Create)
  saveAsMode.value = 'create';
  showSaveAs.value = true;
}

// Ações locais (computador)
function openFromComputer() {
  if (fileInput.value) fileInput.value.value = ''; // Reseta input
  fileInput.value?.click();
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const project = await importClicFile(file, props.assetStore);
    emit('import-project', project);
    
    // Rompe vínculo com projeto salvo na nuvem
    props.projectsStore.currentProjectId.value = null;
    props.projectsStore.currentProjectName.value = '';
    toast.success('Projeto carregado com sucesso!');
  } catch (err: any) {
    console.error(err);
    toast.error('Erro ao carregar o projeto.');
  }
}

async function saveToComputer() {
  try {
    await exportClicFile(props.getProjectData(), props.assetStore, {
      filename: props.projectsStore.currentProjectName.value || `meu-${props.itemName.toLowerCase()}`,
      extension: props.fileExtension
    });
    toast.success(`${props.itemName} exportado com sucesso!`);
    if (!showWordPressItems.value) {
      if (typeof props.projectsStore.markAsSaved === 'function') {
        props.projectsStore.markAsSaved();
      }
    }
  } catch (err) {
    console.error(err);
    toast.error(`Erro ao exportar ${props.itemName.toLowerCase()}.`);
  }
}
</script>

<style scoped>
.filemenu-container {
  position: relative;
  display: inline-block;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.trigger-group { display: flex; align-items: center; gap: 8px; }

.menu-trigger {
  display: flex; align-items: center; gap: 6px;
  background: transparent; border: 1px solid transparent;
  padding: 6px 12px; border-radius: 6px; cursor: pointer;
  color: #374151; font-weight: 500; font-size: 14px;
  transition: all 0.2s ease;
}
.menu-trigger:hover, .menu-trigger.active { background-color: #f3f4f6; color: #111827; }
.menu-trigger.active .chevron { transform: rotate(180deg); }
.chevron { transition: transform 0.2s ease; opacity: 0.6; }

.project-info {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #6b7280; white-space: nowrap;
}
.separator-vertical { width: 1px; height: 16px; background-color: #e5e7eb; }
.project-info .name { font-weight: 500; max-width: 150px; overflow: hidden; text-overflow: ellipsis; display: inline-block; }
.unsaved-dot { width: 8px; height: 8px; background-color: #f59e0b; border-radius: 50%; flex-shrink: 0; }

.dropdown-menu {
  position: absolute; top: calc(100% + 6px); left: 0; right: auto;
  transform-origin: top left; min-width: 240px;
  background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 6px; z-index: 9999;
}
.dropdown-menu.align-right { left: auto; right: 0; transform-origin: top right; }

.menu-group { display: flex; flex-direction: column; }
.menu-label { font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; padding: 8px 10px 4px; letter-spacing: 0.05em; }
.menu-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 14px; color: #4b5563; transition: background-color 0.15s; }
.menu-item:hover { background-color: #f3f4f6; color: #1f2937; }
.menu-item.danger { color: #dc2626; }
.menu-item.danger:hover { background-color: #fef2f2; }
.menu-item.highlight { color: #2563eb; font-weight: 500; }
.menu-item.highlight:hover { background-color: #eff6ff; }
.divider { height: 1px; background-color: #e5e7eb; margin: 6px 0; }
.menu-item .icon { font-size: 16px; min-width: 20px; text-align: center; }

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
