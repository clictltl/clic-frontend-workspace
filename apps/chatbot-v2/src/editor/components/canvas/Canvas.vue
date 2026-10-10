<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, onBeforeUnmount } from 'vue';
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
import { assignBackEdgeLanes, NODE_WIDTH, type EdgeEmphasis, type FlowEdgeData } from '../../utils/edgePath';
import { connectTargetNodeId } from '../../utils/connectTarget';
import { clearHighlight, highlightedNodeIds } from '../../utils/highlight';
import { copyNode, hasCopiedNode, readCopiedNode } from '../../utils/nodeClipboard';
import { useToast } from '@clic/shared';
import NodeContextMenu from './NodeContextMenu.vue';
import CanvasToolbar from './CanvasToolbar.vue';
import ZoomControls from './ZoomControls.vue';
import { FIT_VIEW_OPTIONS, OPEN_MIN_ZOOM, OPEN_SUBSET_MAX_ZOOM, nodesToFrameOnOpen } from '../../utils/viewport';

const projectStore = useProjectStore();

// Extraímos as funções nativas e o estado de clique
const { screenToFlowCoordinate, connectionClickStartHandle, connectionStartHandle, fitView, getNodes, viewport, setViewport } = useVueFlow();
const { t } = useI18n();
const toast = useToast();

// --- ENQUADRAMENTO AO ABRIR ---
// Projeto aberto, importado ou novo (uuid diferente): enquadra todos os blocos assim que o
// Vue Flow tiver medido cada um. Editar o projeto não muda o uuid, então não reenquadra.
// (O evento nodesInitialized não basta: blocos com os mesmos IDs do projeto anterior já
// estão medidos e o evento não se repete.)
const FIT_MAX_FRAMES = 30;

function fitWhenMeasured(frame = 0) {
  const nodes = getNodes.value;
  const measured = nodes.length > 0 && nodes.every(n => n.dimensions.width > 0 && n.dimensions.height > 0);
  if (measured || frame >= FIT_MAX_FRAMES) {
    fitOnOpen();
    return;
  }
  requestAnimationFrame(() => fitWhenMeasured(frame + 1));
}

watch(() => projectStore.project.uuid, () => nextTick(() => fitWhenMeasured()));

// Fluxo grande: em vez de abrir minúsculo, abre no começo da conversa com zoom legível.
// O botão "Ajustar à tela" continua mostrando tudo quando a criança pede.
function fitOnOpen() {
  const view = wrapper.value?.getBoundingClientRect();
  const rects = Object.fromEntries(getNodes.value.map(n => [n.id, { ...n.computedPosition, ...n.dimensions }]));
  const subset = view ? nodesToFrameOnOpen(projectStore.project, rects, view) : null;
  if (subset) fitView({ nodes: subset, padding: FIT_VIEW_OPTIONS.padding, minZoom: OPEN_MIN_ZOOM, maxZoom: OPEN_SUBSET_MAX_ZOOM });
  else fitView(FIT_VIEW_OPTIONS);
}

// Painel de variáveis destacou blocos: enquadra só eles para a criança achar onde estão
watch(highlightedNodeIds, ids => {
  if (ids.length) fitView({ nodes: ids, padding: 0.3, maxZoom: 1, duration: 300 });
});

// --- ZOOM COM A RODA E A PINÇA ---
// A roda dá zoom mantendo o ponto sob o cursor, também em cima dos blocos (mover o canvas é
// arrastando o fundo). A pinça do trackpad chega como roda + ctrlKey e cai no mesmo caminho.
// Exceção: o texto em edição no bloco (.nowheel) rola o próprio conteúdo.
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

function onWheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey && (event.target as HTMLElement | null)?.closest('.nowheel')) return;
  event.preventDefault();
  event.stopPropagation();
  const rect = wrapper.value?.getBoundingClientRect();
  if (!rect) return;
  // Pinça do trackpad manda passos pequenos e frequentes; a roda do mouse, passos de ~100px.
  // Cada passo da roda vale ~15% (perto dos botões); a pinça fica suave e proporcional.
  const delta = event.deltaMode === 1 ? event.deltaY * 20 : event.deltaY;
  const step = -delta * (Math.abs(delta) < 50 ? 0.01 : 0.002);
  const { x, y, zoom } = viewport.value;
  const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * 2 ** step));
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  setViewport({ x: px - ((px - x) / zoom) * nextZoom, y: py - ((py - y) / zoom) * nextZoom, zoom: nextZoom });
}
onMounted(() => {
  nextTick(() => fitWhenMeasured());
  wrapper.value?.addEventListener('wheel', onWheel, { capture: true, passive: false });
  wrapper.value?.addEventListener('pointerdown', onTouchPointerDown, true);
  window.addEventListener('pointermove', onTouchPointerMove, true);
  for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, cancelLongPress, true);
  window.addEventListener('click', onCaptureClick, true);
});
onBeforeUnmount(() => {
  wrapper.value?.removeEventListener('wheel', onWheel, { capture: true });
  wrapper.value?.removeEventListener('pointerdown', onTouchPointerDown, true);
  window.removeEventListener('pointermove', onTouchPointerMove, true);
  for (const type of ['pointerup', 'pointercancel']) window.removeEventListener(type, cancelLongPress, true);
  window.removeEventListener('click', onCaptureClick, true);
  cancelLongPress();
});

// --- INTERCEPTADOR DE TECLADO ---
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') { hidePlus(); clearHighlight(); }
  const target = e.target as HTMLElement;
  const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  if (isTyping) return; // Atalhos não atrapalham quem está digitando (Ctrl+C/V do texto continuam normais)

  // Esc desmarca o bloco ou a conexão (substitui a antiga seta "voltar" do painel)
  if (e.key === 'Escape') {
    projectStore.clearSelection();
    closeMenu();
    return;
  }

  // Copiar, colar e duplicar blocos
  if (e.ctrlKey || e.metaKey) {
    const key = e.key.toLowerCase();
    const selected = projectStore.selectedNodeId;
    if (key === 'c' && selected) copySelected(selected);
    else if (key === 'v' && hasCopiedNode.value) pasteAt(pointerPosition());
    else if (key === 'd' && selected) projectStore.duplicateNode(selected);
    else return;
    e.preventDefault(); // Ctrl+D do navegador é "adicionar favorito"
    return;
  }

  if (e.key === 'Backspace' || e.key === 'Delete') {
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
  if (justLongPressed()) return;
  menu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    flowPosition: screenToFlowCoordinate({ x: event.clientX, y: event.clientY }),
    source: null
  };
}

// --- COPIAR, COLAR E DUPLICAR ---
const nodeMenu = ref({ show: false, x: 0, y: 0, nodeId: '' });
const wrapper = ref<HTMLElement | null>(null);
let lastPointer: { x: number; y: number } | null = null;

function trackPointer(event: PointerEvent | null) {
  lastPointer = event ? { x: event.clientX, y: event.clientY } : null;
}

function copySelected(nodeId: string) {
  const node = projectStore.project.nodes[nodeId];
  if (node && copyNode(node)) toast.info(t('chatbot.editor.block_copied'));
}

/** Onde colar com Ctrl+V: sob o mouse, ou no meio do canvas se o mouse não passou por ele. */
function pointerPosition(): XYPosition {
  if (lastPointer) return screenToFlowCoordinate(lastPointer);
  const rect = wrapper.value?.getBoundingClientRect();
  return screenToFlowCoordinate(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 });
}

function pasteAt(position: XYPosition) {
  const copied = readCopiedNode();
  if (copied) projectStore.pasteNode(copied, position);
}

function onNodeContextMenu(event: NodeMouseEvent) {
  const mouse = event.event as MouseEvent;
  mouse.preventDefault();
  if (justLongPressed()) return; // O Android também dispara o contextmenu ao segurar o dedo
  openNodeMenu(event.node.id, mouse.clientX, mouse.clientY);
}

function openNodeMenu(nodeId: string, x: number, y: number) {
  closeMenu();
  if (projectStore.project.nodes[nodeId]?.type === 'start') return;
  projectStore.selectNode(nodeId);
  nodeMenu.value = { show: true, x, y, nodeId };
}

function openPaneMenu(x: number, y: number) {
  closeMenu();
  menu.value = { show: true, x, y, flowPosition: screenToFlowCoordinate({ x, y }), source: null };
}

// --- TOQUE LONGO (tablet) ---
// Dedo parado por meio segundo abre o mesmo menu do clique direito (o Safari do iPad não
// dispara o contextmenu). Se o dedo se mexer antes, o gesto continua sendo arrastar.
const LONG_PRESS_MS = 500;
const LONG_PRESS_TOLERANCE = 10; // px que o dedo pode tremer sem cancelar
let longPress: { timer: ReturnType<typeof setTimeout>; x: number; y: number } | null = null;
let longPressFiredAt = 0;
let suppressNextClick = false;

function justLongPressed() {
  return Date.now() - longPressFiredAt < 1000;
}

function cancelLongPress() {
  if (longPress) clearTimeout(longPress.timer);
  longPress = null;
}

function onTouchPointerDown(event: PointerEvent) {
  cancelLongPress();
  suppressNextClick = false; // Toque novo: o clique dele vale normalmente
  if (event.pointerType !== 'touch' || !event.isPrimary) return;
  const target = event.target as HTMLElement;
  // Campos de texto, editor e bolinhas de conexão mantêm o comportamento próprio
  if (target.closest('input, textarea, select, [contenteditable="true"], .vue-flow__handle, .context-menu, .canvas-toolbar, .zoom-controls')) return;

  const { clientX: x, clientY: y } = event;
  longPress = {
    x, y,
    timer: setTimeout(() => {
      longPress = null;
      longPressFiredAt = Date.now();
      suppressNextClick = true;
      const nodeId = target.closest<HTMLElement>('.vue-flow__node')?.dataset.id;
      if (nodeId) openNodeMenu(nodeId, x, y);
      else if (target.closest('.vue-flow__pane')) openPaneMenu(x, y);
    }, LONG_PRESS_MS)
  };
}

function onTouchPointerMove(event: PointerEvent) {
  if (longPress && Math.hypot(event.clientX - longPress.x, event.clientY - longPress.y) > LONG_PRESS_TOLERANCE) cancelLongPress();
}

// O toque que abriu o menu não pode, ao soltar, virar um clique que o fecha ou seleciona algo.
// Só esse primeiro clique é bloqueado: o toque seguinte (numa opção do menu) funciona.
function onCaptureClick(event: MouseEvent) {
  if (!suppressNextClick) return;
  suppressNextClick = false;
  event.preventDefault();
  event.stopPropagation();
}

function onNodeMenu(action: 'duplicate' | 'copy' | 'delete') {
  const id = nodeMenu.value.nodeId;
  nodeMenu.value.show = false;
  if (action === 'duplicate') projectStore.duplicateNode(id);
  else if (action === 'copy') copySelected(id);
  else projectStore.deleteNode(id);
}

function handlePaste() {
  pasteAt(menu.value.flowPosition);
  menu.value.show = false;
}

// Botão "Adicionar bloco": abre o menu abaixo do botão; o bloco nasce no centro da área
// visível, deslocado a cada vez para não empilhar exatamente no mesmo lugar
const TOOLBAR_STAGGER = 30;
let toolbarAdds = 0;

function openAddFromToolbar(anchor: DOMRect) {
  closeMenu();
  const rect = wrapper.value?.getBoundingClientRect();
  const offset = (toolbarAdds++ % 5) * TOOLBAR_STAGGER;
  const center = rect
    ? { x: rect.left + rect.width / 2 - NODE_WIDTH / 2 + offset, y: rect.top + rect.height / 3 + offset }
    : { x: 0, y: 0 };
  menu.value = { show: true, x: anchor.left, y: anchor.bottom + 8, flowPosition: screenToFlowCoordinate(center), source: null };
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
  nodeMenu.value.show = false;
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
  clearHighlight();
  projectStore.clearSelection();
  // Modo clique: o clique no fundo cancela a conexão, mas oferece o "+" naquele ponto
  const source = connectionClickStartHandle.value ? pendingSource.value : null;
  connectionClickStartHandle.value = null;
  if (source) showPlus(event.clientX, event.clientY, source);
}
</script>

<template>
  <div ref="wrapper" class="canvas-wrapper" @pointermove="trackPointer" @pointerleave="trackPointer(null)">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="MIN_ZOOM"
      :max-zoom="MAX_ZOOM"
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
      @node-context-menu="onNodeContextMenu"
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
      :can-paste="hasCopiedNode && !menu.source"
      @select="handleAddNode"
      @paste="handlePaste"
      @close="closeMenu"
    />

    <CanvasToolbar @add="openAddFromToolbar" />
    <ZoomControls />

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

    <NodeContextMenu
      v-if="nodeMenu.show"
      :x="nodeMenu.x"
      :y="nodeMenu.y"
      @duplicate="onNodeMenu('duplicate')"
      @copy="onNodeMenu('copy')"
      @delete="onNodeMenu('delete')"
      @close="nodeMenu.show = false"
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
/* Segurar o dedo no fundo não seleciona texto nem abre o menu nativo do iPad */
:deep(.vue-flow__pane) { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
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
@media (prefers-reduced-motion: reduce) {
  .connect-plus { animation: none; }
}
:deep(.vue-flow__panel.vue-flow__attribution) { display: none; }
</style>