<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { Plus } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import {
  VueFlow, useVueFlow, MarkerType,
  type Connection, type NodeDragEvent, type NodeMouseEvent, type OnConnectStartParams, type XYPosition
} from '@vue-flow/core';
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
import { connectTargetNodeId } from '../../utils/connectTarget';

const projectStore = useProjectStore();

// Extraímos as funções nativas e o estado de clique
const { screenToFlowCoordinate, connectionClickStartHandle, connectionStartHandle } = useVueFlow();
const { t } = useI18n();

// --- INTERCEPTADOR DE TECLADO ---
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') hidePlus();
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
  window.addEventListener('pointerdown', onWindowPointerDown, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('pointerdown', onWindowPointerDown, true);
  hidePlus();
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
const menu = ref<{ show: boolean; x: number; y: number; flowPosition: XYPosition; source: ConnectionSource | null }>({
  show: false, x: 0, y: 0, flowPosition: { x: 0, y: 0 }, source: null
});
const edgeMenu = ref({ show: false, x: 0, y: 0, edgeId: '' });

function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault();
  menu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    flowPosition: screenToFlowCoordinate({ x: event.clientX, y: event.clientY }),
    source: null
  };
}

function handleAddNode(type: NodeType) {
  const { flowPosition, source } = menu.value;
  if (source) {
    // A entrada do bloco novo fica onde a linha terminou
    const position = { x: flowPosition.x, y: flowPosition.y - NEW_NODE_INPUT_OFFSET };
    projectStore.addConnectedNode(type, position, source.nodeId, source.handleId);
  } else {
    projectStore.addNode(type, flowPosition);
  }
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
  connectedDuringDrag = true;
  if (!connection.sourceHandle) return;
  projectStore.connect(connection.source, connection.sourceHandle, connection.target);
}

// --- CONEXÃO NO BLOCO INTEIRO E "+" NO VAZIO ---
// Com uma conexão pendente (clique ou arraste), qualquer parte de um bloco é alvo: liga na
// entrada dele. No vazio, aparece um "+" discreto que cria um bloco já ligado; ignorá-lo não custa nada.
interface ConnectionSource { nodeId: string; handleId: string }

const NEW_NODE_INPUT_OFFSET = 45; // Altura aproximada da entrada a partir do topo do bloco

const pendingSource = computed<ConnectionSource | null>(() => {
  const handle = connectionClickStartHandle.value ?? connectionStartHandle.value;
  return handle?.type === 'source' && handle.id ? { nodeId: handle.nodeId, handleId: handle.id } : null;
});

function canReceive(targetId: string, source: ConnectionSource) {
  const target = projectStore.project.nodes[targetId];
  return !!target && target.type !== 'start' && targetId !== source.nodeId;
}

function onNodeMouseEnter(event: NodeMouseEvent) {
  const source = pendingSource.value;
  connectTargetNodeId.value = source && canReceive(event.node.id, source) ? event.node.id : null;
}

function onNodeMouseLeave(event: NodeMouseEvent) {
  if (connectTargetNodeId.value === event.node.id) connectTargetNodeId.value = null;
}

watch(pendingSource, source => { if (!source) connectTargetNodeId.value = null; });

// Arraste: a origem é guardada no início, porque o Vue Flow a limpa antes do fim
let dragSource: ConnectionSource | null = null;
let connectedDuringDrag = false;

function onConnectStart(params: OnConnectStartParams) {
  connectedDuringDrag = false;
  dragSource = params.handleType === 'source' && params.nodeId && params.handleId
    ? { nodeId: params.nodeId, handleId: params.handleId }
    : null;
}

function onConnectEnd(event?: MouseEvent | TouchEvent) {
  const source = dragSource;
  dragSource = null;
  connectTargetNodeId.value = null;
  if (connectedDuringDrag || !source || !event) return; // Já ligou numa bolinha de entrada

  const point = 'changedTouches' in event ? event.changedTouches[0] : event;
  if (!point) return;
  const element = document.elementFromPoint(point.clientX, point.clientY);
  const nodeId = element?.closest<HTMLElement>('.vue-flow__node')?.dataset.id;
  if (nodeId) {
    if (canReceive(nodeId, source)) projectStore.connect(source.nodeId, source.handleId, nodeId);
    return;
  }
  if (element?.closest('.vue-flow__pane')) showPlus(point.clientX, point.clientY, source);
}

function onNodeClick(event: NodeMouseEvent) {
  if ((event.event.target as HTMLElement).closest('.vue-flow__handle')) return;
  closeMenu();

  // Modo clique: o clique no bloco completa a conexão pendente
  const source = connectionClickStartHandle.value ? pendingSource.value : null;
  if (source) {
    connectionClickStartHandle.value = null;
    if (canReceive(event.node.id, source)) {
      projectStore.connect(source.nodeId, source.handleId, event.node.id);
      return;
    }
  }
  projectStore.selectNode(event.node.id);
}

// "+" no vazio: sem prazo (criança decide no seu ritmo); some no próximo clique fora, com Esc
// ou ao mover o canvas (fica fixo na tela e deixaria de marcar o ponto certo)
const plus = ref<{ x: number; y: number; source: ConnectionSource } | null>(null);

function showPlus(x: number, y: number, source: ConnectionSource) {
  plus.value = { x, y, source };
}

function hidePlus() {
  plus.value = null;
}

function openConnectedMenu() {
  if (!plus.value) return;
  const { x, y, source } = plus.value;
  hidePlus();
  menu.value = { show: true, x, y, flowPosition: screenToFlowCoordinate({ x, y }), source };
}

function onWindowPointerDown(e: PointerEvent) {
  if (plus.value && !(e.target as HTMLElement).closest('.connect-plus')) hidePlus();
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

function onPaneClick(event: MouseEvent) {
  closeMenu();
  projectStore.clearSelection();
  // Modo clique: o clique no fundo cancela a conexão, mas oferece o "+" naquele ponto
  const source = connectionClickStartHandle.value ? pendingSource.value : null;
  connectionClickStartHandle.value = null;
  if (source) showPlus(event.clientX, event.clientY, source);
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
      @move-start="hidePlus"
      @connect-start="onConnectStart"
      @connect-end="onConnectEnd"
      @node-mouse-enter="onNodeMouseEnter"
      @node-mouse-leave="onNodeMouseLeave"
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

    <!-- "+" onde a conexão terminou no vazio: cria um bloco já ligado -->
    <button
      v-if="plus"
      type="button"
      class="connect-plus"
      :style="{ top: `${plus.y}px`, left: `${plus.x}px` }"
      :title="t('chatbot.editor.add_connected_block')"
      :aria-label="t('chatbot.editor.add_connected_block')"
      @click="openConnectedMenu"
    >
      <Plus :size="18" :stroke-width="3" />
    </button>

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
.connect-plus {
  position: fixed; z-index: 1001; transform: translate(-50%, -50%);
  width: 32px; height: 32px; border-radius: 50%; border: 2px solid white;
  background: #3b82f6; color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  animation: plus-in 0.15s ease-out;
}
.connect-plus:hover { background: #2563eb; transform: translate(-50%, -50%) scale(1.1); }
@keyframes plus-in { from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); } }
:deep(.vue-flow__panel.vue-flow__attribution) { display: none; }
</style>