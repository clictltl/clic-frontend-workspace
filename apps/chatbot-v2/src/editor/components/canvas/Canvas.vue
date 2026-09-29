<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { useProjectStore } from '../../../shared/stores/projectStore';
import CustomNode from './nodes/CustomNode.vue';
import CustomEdge from './edges/CustomEdge.vue';
import GhostPath from './edges/GhostPath.vue';
import ClickConnectionLine from './edges/ClickConnectionLine.vue';
import ContextMenu from './ContextMenu.vue';
import EdgeContextMenu from './edges/EdgeContextMenu.vue';
import type { ChatEdge, ChatNode } from '../../../shared/types/project';

const projectStore = useProjectStore();

// Extraímos as funções nativas e o estado de clique
const { screenToFlowCoordinate, connectionClickStartHandle } = useVueFlow();

// --- INTERCEPTADOR DE TECLADO ---
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    const target = e.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isTyping) return;

    if (projectStore.selectedNodeId) {
      projectStore.deleteNode(projectStore.selectedNodeId);
    } else if (projectStore.selectedEdgeId) {
      projectStore.removeEdge(projectStore.selectedEdgeId);
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});

// --- MAPEAMENTO DO GRAFO ---
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

const flowEdges = computed(() => {
  return Object.values(projectStore.project.edges).map((e: ChatEdge) => ({
    id: e.id,
    type: 'custom',
    source: e.sourceNode,
    sourceHandle: e.sourceHandle,
    target: e.targetNode,
    targetHandle: e.targetHandle,
    data: { edgeData: e },
    animated: projectStore.selectedEdgeId === e.id,
    markerEnd: { type: MarkerType.ArrowClosed, color: e.color || '#9ca3af' }
  }));
});

// --- CONTROLE DE MENUS ---
const menu = ref({ show: false, x: 0, y: 0, flowPosition: { x: 0, y: 0 } });
const edgeMenu = ref({ show: false, x: 0, y: 0, edgeId: '' });

function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault();
  menu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    flowPosition: screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  };
}

function handleAddNode(type: ChatNode['type']) {
  projectStore.addNode(type, menu.value.flowPosition);
  menu.value.show = false;
}

function closeMenu() {
  menu.value.show = false;
  edgeMenu.value.show = false;
}

// --- EVENTOS DO VUE FLOW ---
function onNodeDragStart(event: any) {
  projectStore.selectNode(event.node.id);
}

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
  if (event.event.target.closest('.vue-flow__handle')) return;
  closeMenu();
  projectStore.selectNode(event.node.id);
}

function onEdgeClick(event: any) {
  closeMenu();
  projectStore.selectEdge(event.edge.id);
  edgeMenu.value = {
    show: true,
    x: event.event.clientX,
    y: event.event.clientY,
    edgeId: event.edge.id
  };
}

function onPaneClick() {
  closeMenu();
  projectStore.clearSelection();
  // Limpa também o modo click se clicar no fundo
  connectionClickStartHandle.value = null; 
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
      :connect-on-click="true"
      @node-drag-start="onNodeDragStart"
      @node-drag-stop="onNodeDragStop"
      @connect="onConnect"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @pane-click="onPaneClick"
      @pane-context-menu="onPaneContextMenu"
    >
      <Background pattern-color="#aaa" :gap="16" />
      
      <template #node-custom="props">
        <CustomNode :id="props.id" :data="props.data" />
      </template>

      <template #edge-custom="props">
        <CustomEdge v-bind="props" :selected="props.id === projectStore.selectedEdgeId" />
      </template>

      <!-- Modo drag: só renderiza se NÃO estiver no modo click -->
      <template #connection-line="props">
        <GhostPath v-if="!connectionClickStartHandle" v-bind="props" />
      </template>

      <!-- Modo click (ViewportPortal garante que renderiza sempre atualizado com pan/zoom) -->
      <ClickConnectionLine />
    </VueFlow>

    <ContextMenu 
      v-if="menu.show"
      :x="menu.x"
      :y="menu.y"
      @select="handleAddNode"
      @close="closeMenu"
    />

    <EdgeContextMenu
      v-if="edgeMenu.show"
      :x="edgeMenu.x"
      :y="edgeMenu.y"
      :edge-id="edgeMenu.edgeId"
      @close="closeMenu"
    />
  </div>
</template>

<style scoped>
.canvas-wrapper { width: 100%; height: 100%; position: relative; }
:deep(.vue-flow__panel.vue-flow__attribution) { display: none; }
</style>