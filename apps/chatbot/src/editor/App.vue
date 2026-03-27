<script setup lang="ts">
/**
 * EDITOR DE CHATBOT PEDAGÓGICO
 *
 * Este é o componente principal que gerencia todo o editor de chatbot.
 * Ele mantém o estado de:
 * - blocks: Array com todos os blocos do fluxo
 * - connections: Array com as conexões visuais entre blocos
 * - variables: Objeto com as variáveis disponíveis no chatbot
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import type { Block, BlockType } from '@/shared/types/chatbot';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useProjects } from '@/editor/utils/useProjects';
import { useAssetStore } from '@/editor/utils/useAssetStore';
import Canvas from '@/editor/components/canvas/Canvas.vue';
import PropertiesPanel from '@/editor/components/panels/PropertiesPanel.vue';
import VariablesPanel from '@/editor/components/panels/VariablesPanel.vue';
import PreviewPanel from '@/editor/components/panels/PreviewPanel.vue';
import { AppHeader, AuthMenu, FileMenu, ToastContainer, InvalidShareLinkModal } from '@clic/shared';

const props = defineProps<{
  shareLoadError?: boolean
}>();

const store = useProjectStore();
const projects = useProjects();
const assetStore = useAssetStore();

const showInvalidShareModal = ref(false);

const zoom = ref(100);
const activeTab = ref<'properties' | 'variables' | 'preview'>('properties');
const showNewBlockMenu = ref(false);
const showContextMenu = ref(false);
const contextMenuPosition = ref<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
const isPreviewFullscreen = ref(false);
const sidePanelWidth = ref(350);
const isResizing = ref(false);
const showBlockContextMenu = ref(false);
const blockContextMenuPosition = ref<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
const contextMenuBlockId = ref<string | null>(null);
const hasCopiedBlock = ref(false);
const propertiesPanelRef = ref<InstanceType<typeof PropertiesPanel> | null>(null);

// Retorna o bloco atualmente selecionado
const selectedBlock = computed(() => {
  if (!store.ui.selectedBlockId) return null;
  return store.document.blocks.find(b => b.id === store.ui.selectedBlockId) || null;
});

// Intercepta o fechamento da aba ou F5
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
  // 1. Verifica se houve erro no carregamento do share (via prop do main-editor)
  if (props.shareLoadError) {
    showInvalidShareModal.value = true;
  }

  // 2. Lógica local da UI do Chatbot
  hasCopiedBlock.value = !!localStorage.getItem('copiedBlock');
  document.addEventListener('click', handleDocumentClick);
  
  // 3. Proteção contra fechar a aba sem salvar
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// Remove listener ao desmontar
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

function handleCloseInvalidShareModal() {
  showInvalidShareModal.value = false;
  
  // Reseta para um projeto novo limpo
  store.resetProjectData();
  
  // Remove query params da URL (caso ainda tenha sobrado algo)
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

// Cria um novo bloco no canvas
function createBlock(type: BlockType, position?: { x: number; y: number }) {
  if (type === 'start') return; // ✅ start não é criado pelo menu

  const newBlock: Block = {
    id: `block_${Date.now()}`,
    type,
    position: position
      ? position
      : contextMenuPosition.value
        ? { x: contextMenuPosition.value.x, y: contextMenuPosition.value.y }
        : { x: 100 + store.document.blocks.length * 50, y: 100 + store.document.blocks.length * 30 },
    content: getDefaultContent(type),
    choices: type === 'choiceQuestion' ? [] : undefined,
    conditions: type === 'condition' ? [] : undefined,
    nextBlockId: undefined
  };

  store.document.blocks.push(newBlock);
  store.ui.selectedBlockId = newBlock.id;

  // fecha menus antigos do pai (se existirem)
  showNewBlockMenu.value = false;
  showContextMenu.value = false;
  contextMenuPosition.value = null;
}

function handleCreateBlockFromCanvas(payload: { type: BlockType; position?: { x: number; y: number } }) {
  createBlock(payload.type, payload.position);
}

// Handler de clique no documento para fechar menus
function handleDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // Verifica se o clique foi fora do menu de novo bloco
  if (!target.closest('.new-block-wrapper')) {
    showNewBlockMenu.value = false;
  }
}

// Retorna o conteúdo padrão baseado no tipo do bloco
function getDefaultContent(type: BlockType): string {
  switch (type) {
    case 'start':
      return '';
    case 'message':
      return 'Olá! Bem-vindo ao chatbot.';
    case 'openQuestion':
      return 'Qual é o seu nome?';
    case 'choiceQuestion':
      return 'Escolha uma opção:';
    case 'condition':
      return 'Verificando condição...';
    case 'setVariable':
      return 'Definindo variável...';
    case 'math':
      return 'Operação matemática';
    case 'image':
      return 'Imagem';
    case 'end':
      return 'Obrigado por usar o chatbot!';
    default:
      return '';
  }
}

// Atualiza um bloco existente
function updateBlock(updatedBlock: Block) {
  const index = store.document.blocks.findIndex(b => b.id === updatedBlock.id);
  if (index !== -1) {
    store.document.blocks[index] = updatedBlock;
  }
}

// Adiciona uma nova variável ao chatbot
function addVariable(name: string, type: 'string' | 'number') {
  store.document.variables[name] = {
    name,
    type,
    value: type === 'number' ? 0 : ''
  };
}

async function handleFocusBlockEditor() {
  activeTab.value = 'properties';

  // espera a aba renderizar + textarea existir
  await nextTick();
  await nextTick();

  propertiesPanelRef.value?.focusContent?.();
}


// Remove uma variável do chatbot
function removeVariable(name: string) {
  delete store.document.variables[name];
}

// Alterna o modo tela cheia do preview
function togglePreviewFullscreen() {
  isPreviewFullscreen.value = !isPreviewFullscreen.value;
  if (isPreviewFullscreen.value) {
    activeTab.value = 'preview';
  }
}

// Abre o menu de contexto com botão direito
function handleCanvasContextMenu(position: { x: number; y: number; screenX: number; screenY: number }) {
  contextMenuPosition.value = position;
  showContextMenu.value = true;
}

// Fecha o menu de contexto
function closeContextMenu() {
  showContextMenu.value = false;
  contextMenuPosition.value = null;
  showBlockContextMenu.value = false;
  blockContextMenuPosition.value = null;
  contextMenuBlockId.value = null;
}

// Abre o menu de contexto do bloco
function handleBlockContextMenu(blockId: string, position: { x: number; y: number; screenX: number; screenY: number }) {
  showContextMenu.value = false;
  contextMenuBlockId.value = blockId;
  blockContextMenuPosition.value = position;
  showBlockContextMenu.value = true;
}

// Duplica um bloco
function duplicateBlock() {
  if (!contextMenuBlockId.value) return;

  // ✅ nunca duplicar o start
  if (contextMenuBlockId.value === 'start') {
    closeContextMenu();
    return;
  }

  const blockToDuplicate = store.document.blocks.find(b => b.id === contextMenuBlockId.value);
  if (!blockToDuplicate) return;
  const newBlock: Block = {
    ...JSON.parse(JSON.stringify(blockToDuplicate)),
    id: Date.now().toString(),
    position: {
      x: blockToDuplicate.position.x + 50,
      y: blockToDuplicate.position.y + 50
    }
  };

  store.document.blocks = [...store.document.blocks, newBlock];
  closeContextMenu();
}

// Copia um bloco (salva no localStorage)
function copyBlock() {
   if (!contextMenuBlockId.value) return;

  // ✅ nunca copiar o start
  if (contextMenuBlockId.value === 'start') {
    closeContextMenu();
    return;
  }

  const blockToCopy = store.document.blocks.find(b => b.id === contextMenuBlockId.value);
  if (!blockToCopy) return;

  localStorage.setItem('copiedBlock', JSON.stringify(blockToCopy));
  hasCopiedBlock.value = true;
  closeContextMenu();
}

// Cola um bloco copiado
function pasteBlock() {
  const copiedBlockJson = localStorage.getItem('copiedBlock');
  if (!copiedBlockJson) return;

  const copiedBlock = JSON.parse(copiedBlockJson);
  const newBlock: Block = {
    ...copiedBlock,
    id: Date.now().toString(),
    position: contextMenuPosition.value
      ? { x: contextMenuPosition.value.x, y: contextMenuPosition.value.y }
      : { x: copiedBlock.position.x + 50, y: copiedBlock.position.y + 50 }
  };

  store.document.blocks = [...store.document.blocks, newBlock];
  closeContextMenu();
}

// Deleta um bloco do menu de contexto
function deleteBlockFromMenu() {
  if (!contextMenuBlockId.value) return;

  // ✅ nunca deletar o start
  if (contextMenuBlockId.value === 'start') {
    closeContextMenu();
    return;
  }

  store.document.blocks = store.document.blocks.filter(b => b.id !== contextMenuBlockId.value);
  store.document.connections = store.document.connections.filter(
    c => c.fromBlockId !== contextMenuBlockId.value && c.toBlockId !== contextMenuBlockId.value
  );

  if (store.ui.selectedBlockId === contextMenuBlockId.value) {
    store.ui.selectedBlockId = null;
  }

  closeContextMenu();
}

// Inicia o redimensionamento do painel lateral
function startResize(event: MouseEvent) {
  isResizing.value = true;
  event.preventDefault();

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return;
    const newWidth = window.innerWidth - e.clientX;
    sidePanelWidth.value = Math.max(300, Math.min(800, newWidth));
  };

  const handleMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

async function handleLoginSuccess() {
  await assetStore.persistToDisk(); 
  
  const backup = {
    id: projects.currentProjectId.value,
    name: projects.currentProjectName.value,
    data: store.getProjectData(),
    wasDirty: store.hasUnsavedChanges
  };

  sessionStorage.setItem('clic-chatbot:login-backup', JSON.stringify(backup));

  // Evita o aviso que vai perder tudo se atualizar
  store.markAsSaved();
  
  window.location.reload();
}

</script>

<template>
  <div class="app">
    <!-- Toolbar superior com controles principais -->
    <AppHeader title="Novelo">
    <FileMenu 
      item-name="Chatbot"
      file-extension=".clic-chat"
      file-accept=".clic-chat,.clic,.zip,.json"
      :projectsStore="projects"
      :assetStore="assetStore"
      :hasUnsavedChanges="store.hasUnsavedChanges"
      :getProjectData="store.getProjectData"
      @new-project="store.resetProjectData"
      @import-project="store.setProjectData"
    />
    <AuthMenu @login-success="handleLoginSuccess" />
  </AppHeader>

    <!-- Área principal com canvas e painel lateral -->
    <div class="main-content">
      <!-- Canvas onde os blocos são desenhados e conectados -->
      <div class="canvas-area" v-show="!isPreviewFullscreen" @click="closeContextMenu">
        <Canvas
          :blocks="store.document.blocks"
          :connections="store.document.connections"
          :selected-block-id="store.ui.selectedBlockId"
          :zoom="zoom"
          @update:selected-block-id="store.ui.selectedBlockId = $event"
          @update:blocks="store.document.blocks = $event"
          @focus-block-editor="handleFocusBlockEditor"
          @update:connections="store.document.connections = $event"
          @update:zoom="zoom = $event"
          @context-menu="handleCanvasContextMenu"
          @block-context-menu="handleBlockContextMenu"
          @create-block="handleCreateBlockFromCanvas"
        />

        <!-- Menu de contexto (botão direito) -->
        <div
          v-if="showContextMenu && contextMenuPosition"
          class="context-menu"
          :style="{
            left: contextMenuPosition.screenX + 'px',
            top: contextMenuPosition.screenY + 'px'
          }"
          @click.stop
        >
          <button @click="createBlock('message')" class="block-menu-item">
            <span class="block-icon" style="background: #3b82f6;">💬</span>
            Mensagem
          </button>
          <button @click="createBlock('openQuestion')" class="block-menu-item">
            <span class="block-icon" style="background: #10b981;">❓</span>
            Pergunta Aberta
          </button>
          <button @click="createBlock('choiceQuestion')" class="block-menu-item">
            <span class="block-icon" style="background: #f59e0b;">📊</span>
            Múltipla Escolha
          </button>
          <button @click="createBlock('condition')" class="block-menu-item">
            <span class="block-icon" style="background: #8b5cf6;">⚙️</span>
            Condicional
          </button>
          <button @click="createBlock('setVariable')" class="block-menu-item">
            <span class="block-icon" style="background: #06b6d4;">📝</span>
            Definir Variável
          </button>
          <button @click="createBlock('math')" class="block-menu-item">
            <span class="block-icon" style="background: #f97316;">🔢</span>
            Operação Matemática
          </button>
          <button @click="createBlock('image')" class="block-menu-item">
            <span class="block-icon" style="background: #ec4899;">🖼️</span>
            Imagem
          </button>
          <button @click="createBlock('end')" class="block-menu-item">
            <span class="block-icon" style="background: #ef4444;">✅</span>
            Fim da Conversa
          </button>
          <button v-if="hasCopiedBlock" @click="pasteBlock" class="block-menu-item paste-item">
            <span class="block-icon" style="background: #6366f1;">📋</span>
            Colar Bloco
          </button>
        </div>
      </div>

      <!-- Menu de contexto do bloco (botão direito no bloco) -->
    <div
      v-if="showBlockContextMenu && blockContextMenuPosition"
      class="context-menu block-context-menu"
      :style="{
        left: blockContextMenuPosition.screenX + 'px',
        top: blockContextMenuPosition.screenY + 'px'
      }"
      @click.stop
    >
      <template v-if="contextMenuBlockId !== 'start'">
        <button @click="duplicateBlock" class="context-menu-item">
          <span>⚡</span>
          Duplicar
        </button>
        <button @click="copyBlock" class="context-menu-item">
          <span>📋</span>
          Copiar
        </button>
        <button @click="deleteBlockFromMenu" class="context-menu-item delete">
          <span>🗑️</span>
          Deletar
        </button>
      </template>

      <div v-else class="context-menu-empty">
        Sem ações disponíveis
      </div>
    </div>

      <!-- Painel lateral com propriedades, variáveis e preview -->
      <aside class="side-panel" :class="{ 'fullscreen': isPreviewFullscreen }" :style="{ width: isPreviewFullscreen ? '100%' : `${sidePanelWidth}px` }">
        <!-- Resize handle -->
        <div v-if="!isPreviewFullscreen" class="resize-handle" @mousedown="startResize"></div>

        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'properties' }]"
            @click="activeTab = 'properties'"
          >
            🔧 Bloco
          </button>
          <button
            :class="['tab', { active: activeTab === 'variables' }]"
            @click="activeTab = 'variables'"
          >
            🔢 Variáveis
          </button>
          <button
            :class="['tab', { active: activeTab === 'preview' }]"
            @click="activeTab = 'preview'"
          >
            👁️ Preview
          </button>
        </div>

        <div class="tab-content">
          <PropertiesPanel
            ref="propertiesPanelRef"
            v-show="activeTab === 'properties'"
            :block="selectedBlock"
            :variables="store.document.variables"
            @update:block="updateBlock"
          />

          <VariablesPanel
            v-show="activeTab === 'variables'"
            :variables="store.document.variables"
            @update:variables="store.document.variables = $event"
            @add-variable="addVariable"
            @remove-variable="removeVariable"
          />

          <PreviewPanel
            v-show="activeTab === 'preview'"
            :blocks="store.document.blocks"
            :variables="store.document.variables"
            @update:variables="store.document.variables = $event"
            @toggle-fullscreen="togglePreviewFullscreen"
          />
        </div>
      </aside>
    </div>

    <ToastContainer />

    <InvalidShareLinkModal v-if="showInvalidShareModal" item-name="Chatbot" @close="handleCloseInvalidShareModal" />

  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f3f4f6;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.new-block-wrapper {
  position: relative;
}

.btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  padding: 8px 16px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Menu de novos blocos */
.block-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 220px;
  padding: 8px;
}

.block-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: white;
  border: none;
  border-radius: 6px;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.block-menu-item:hover {
  background: #f3f4f6;
}

.block-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 14px;
}

/* Menu de contexto do bloco */
.block-context-menu {
  min-width: 160px;
}

.context-menu-item {
  width: 100%;
  padding: 10px 16px;
  background: white;
  border: none;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item.delete {
  color: #ef4444;
}

.context-menu-item.delete:hover {
  background: #fee2e2;
}

.context-menu-item span {
  font-size: 16px;
}

.paste-item {
  border-top: 1px solid #e5e7eb;
  margin-top: 4px;
  padding-top: 12px;
}

/* Layout principal */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Painel lateral */
.side-panel {
  min-width: 300px;
  max-width: 800px;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
}

.side-panel.fullscreen {
  width: 100%;
  border-left: none;
}

/* Handle de redimensionamento */
.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: ew-resize;
  z-index: 1000;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: #3b82f6;
}

.resize-handle:active {
  background: #2563eb;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #374151;
  background: #f9fafb;
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

/* Menu de contexto */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 220px;
  padding: 8px;
}

.context-menu-empty {
  padding: 12px 14px;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
  user-select: none;
}

</style>
