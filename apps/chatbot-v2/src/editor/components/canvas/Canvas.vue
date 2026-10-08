<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { VueFlow, useVueFlow, MarkerType, type Connection, type NodeDragEvent } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { useProjectStore } from '../../../shared/stores/projectStore';
import CustomNode from './nodes/CustomNode.vue';
import CustomEdge from './edges/CustomEdge.vue';
import GhostPath from './edges/GhostPath.vue';
import ClickConnectionLine from './edges/ClickConnectionLine.vue';
import ContextMenu from './ContextMenu.vue';
import EdgeContextMenu from './edges/EdgeContextMenu.vue';
import type { ChatEdge, NodeType } from '../../../shared/types/chatbot';
import { assignBackEdgeLanes, type EdgeEmphasis, type FlowEdgeData } from '../../utils/edgePath';

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
      projectStore.disconnect(projectStore.selectedEdgeId);
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
// O Vue Flow recebe só geometria e IDs; cada nó lê seu conteúdo direto do store.
const flowNodes = computed(() => {
  return Object.values(projectStore.project.nodes).map(n => ({
    id: n.id,
    type: 'custom',
    position: n.position
  }));
});

// Voltas (laços) ganham faixas próprias; com um bloco selecionado, as conexões dele
// se destacam e são desenhadas por último (por cima das outras)
const flowEdges = computed(() => {
  const edges = Object.values(projectStore.project.edges);
  const positions = Object.fromEntries(Object.values(projectStore.project.nodes).map(n => [n.id, n.position]));
  const lanes = assignBackEdgeLanes(edges, positions);
  const selectedNode = projectStore.selectedNodeId;

  const emphasisOf = (e: ChatEdge): EdgeEmphasis => {
    if (!selectedNode) return 'normal';
    return e.sourceNode === selectedNode || e.targetNode === selectedNode ? 'highlight' : 'dim';
  };

  return edges
    .map(e => {
      const data: FlowEdgeData = { color: e.color, lane: lanes[e.id] ?? 0, emphasis: emphasisOf(e) };
      return {
        id: e.id,
        type: 'custom',
        source: e.sourceNode,
        sourceHandle: e.sourceHandle,
        target: e.targetNode,
        targetHandle: 'in', // Todo nó tem uma única entrada
        data,
        markerEnd: { type: MarkerType.ArrowClosed, color: e.color || '#9ca3af' }
      };
    })
    .sort((a, b) => Number(a.data.emphasis === 'highlight') - Number(b.data.emphasis === 'highlight'));
});

// Bloqueia visualmente (durante o arraste) o que o domínio recusaria
function isValidConnection(connection: Connection) {
  const target = projectStore.project.nodes[connection.target];
  return connection.source !== connection.target && !!target && target.type !== 'start';
}

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

function handleAddNode(type: NodeType) {
  projectStore.addNode(type, menu.value.flowPosition);
  menu.value.show = false;
}

function closeMenu() {
  menu.value.show = false;
  edgeMenu.value.show = false;
}

// --- EVENTOS DO VUE FLOW ---
function onNodeDragStart(event: NodeDragEvent) {
  projectStore.selectNode(event.node.id);
}

// Um arraste (mesmo com vários nós selecionados) = uma única mutação
function onNodeDragStop(event: NodeDragEvent) {
  projectStore.moveNodes(event.nodes.map(node => ({ id: node.id, position: node.position })));
}

// Reconectar uma saída já ligada substitui a conexão anterior (regra do domínio)
function onConnect(connection: Connection) {
  if (!connection.sourceHandle) return;
  projectStore.connect(connection.source, connection.sourceHandle, connection.target);
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
      :is-valid-connection="isValidConnection"
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
        <CustomNode :id="props.id" />
      </template>

      <template #edge-custom="props">
        <CustomEdge v-bind="props" :selected="props.id === projectStore.selectedEdgeId" />
      </template>

      <!-- Modo drag: só renderiza se NÃO estiver no modo click -->
      <template #connection-line="props">
        <GhostPath
          v-if="!connectionClickStartHandle"
          :source-x="props.sourceX" :source-y="props.sourceY"
          :target-x="props.targetX" :target-y="props.targetY"
          :source-node="props.sourceNode" :target-node="props.targetNode"
        />
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