<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { useProjectStore } from '../../../shared/stores/projectStore';
import CustomNode from './CustomNode.vue';
import ContextMenu from './ContextMenu.vue';
import type { ChatEdge, ChatNode } from '../../../shared/types/project';

const projectStore = useProjectStore();

// Interceptador Global de Teclado (Para Backspace / Delete)
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    const target = e.target as HTMLElement;
    // Se o aluno estiver digitando num input ou no RichText, NÃO deleta o bloco!
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isTyping) return;

    if (projectStore.selectedNodeId) {
      projectStore.deleteNode(projectStore.selectedNodeId);
    } else if (projectStore.selectedEdgeId) {
      projectStore.removeEdge(projectStore.selectedEdgeId);
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));

// Mapeia Dicionário de Nós (Store) -> Array (Vue Flow)
const flowNodes = computed(() => {
  return Object.values(projectStore.project.nodes).map(n => ({
    id: n.id,
    type: 'custom',
    position: n.position,
    data: {
      nodeType: n.type,
      nodeData: n.data,
      isSelected: projectStore.selectedNodeId === n.id
    }
  }));
});

// Mapeia Dicionário de Conexões (Store) -> Array (Vue Flow)
const flowEdges = computed(() => {
  return Object.values(projectStore.project.edges).map((e: ChatEdge) => ({
    id: e.id,
    source: e.sourceNode,
    sourceHandle: e.sourceHandle,
    target: e.targetNode,
    targetHandle: e.targetHandle,
    style: { 
      stroke: e.color || '#9ca3af', 
      strokeWidth: projectStore.selectedEdgeId === e.id ? 4 : 2 
    },
    animated: projectStore.selectedEdgeId === e.id
  }));
});

const { screenToFlowCoordinate } = useVueFlow();

// --- ESTADO DO MENU CONTEXTUAL ---
const menu = ref({
  show: false,
  x: 0,
  y: 0,
  flowPosition: { x: 0, y: 0 }
});

function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault();
  menu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    // A Mágica: Converte o pixel do mouse para a coordenada virtual do Canvas (considerando pan e zoom)
    flowPosition: screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  };
}

function handleAddNode(type: ChatNode['type']) {
  projectStore.addNode(type, menu.value.flowPosition);
  menu.value.show = false;
}

function closeMenu() {
  menu.value.show = false;
}

function onNodeDragStart(event: any) {
  // Sincroniza a seleção instantaneamente ao começar a puxar o nó
  projectStore.selectNode(event.node.id);
}

// Interceptadores de Ação (Escrevendo na Store)
function onNodeDragStop(event: any) {
  event.nodes.forEach((node: any) => {
    projectStore.updateNodePosition(node.id, node.position);
  });
}

function onConnect(connection: any) {
  projectStore.addEdge(
    connection.source, 
    connection.sourceHandle || 'out_default', 
    connection.target, 
    connection.targetHandle || 'in_default'
  );
}

function onNodeClick(event: any) {
  // Ignora o clique se o alvo for uma bolinha de conexão (Handle)
  if (event.event.target.closest('.vue-flow__handle')) return;
  
  closeMenu();
  projectStore.selectNode(event.node.id);
}

function onEdgeClick(event: any) {
  closeMenu();
  projectStore.selectEdge(event.edge.id);
}

function onPaneClick() {
  closeMenu();
  projectStore.clearSelection();
}
</script>

<template>
  <div class="canvas-wrapper">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :delete-key-code="null"
      @node-drag-start="onNodeDragStart"
      @node-drag-stop="onNodeDragStop"
      @connect="onConnect"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @pane-click="onPaneClick"
      @pane-context-menu="onPaneContextMenu"
    >
      <!-- Background com pontilhados clássicos de Editor -->
      <Background pattern-color="#aaa" :gap="16" />
      
      <!-- Injeta o nosso componente visual -->
      <template #node-custom="props">
        <CustomNode :id="props.id" :data="props.data" />
      </template>
    </VueFlow>

    <!-- Menu Flutuante -->
    <ContextMenu 
      v-if="menu.show"
      :x="menu.x"
      :y="menu.y"
      @select="handleAddNode"
      @close="closeMenu"
    />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
}
/* Esconde a marca d'água free do Vue Flow (opcional/educacional) */
:deep(.vue-flow__panel.vue-flow__attribution) {
  display: none;
}
</style>