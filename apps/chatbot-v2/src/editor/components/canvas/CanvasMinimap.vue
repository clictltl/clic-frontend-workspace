<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useVueFlow, type GraphNode } from '@vue-flow/core';
import { MiniMap } from '@vue-flow/minimap';
import '@vue-flow/minimap/dist/style.css';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { NODE_CONFIG } from '../../utils/nodeConfig';
import { testActiveNodeId } from '../../utils/testRun';
import { highlightedNodeIds } from '../../utils/highlight';

/**
 * Minimapa do canvas. É carregado só quando alguém o abre (começa escondido): o pacote traz
 * a própria cópia do d3 (~19 KB comprimidos) e a maioria das pessoas não usa.
 * Blocos na cor do tipo; o que fala no teste e os destacados ganham contorno.
 * Arrastar move o canvas; clicar leva o canvas até o ponto clicado (mesmo zoom).
 */
const { t } = useI18n();
const projectStore = useProjectStore();
const { setCenter, viewport } = useVueFlow();

function goTo({ position }: { position: { x: number; y: number } }) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  setCenter(position.x, position.y, { zoom: viewport.value.zoom, duration: reduceMotion ? 0 : 300 });
}

function nodeColor(node: GraphNode) {
  const type = projectStore.project.nodes[node.id]?.type;
  return type ? NODE_CONFIG[type].color : '#d1d5db';
}
function nodeStroke(node: GraphNode) {
  if (testActiveNodeId.value === node.id) return '#111827';
  return highlightedNodeIds.value.includes(node.id) ? '#f59e0b' : 'transparent';
}
</script>

<template>
  <MiniMap
    class="canvas-minimap"
    position="bottom-right"
    :width="180"
    :height="120"
    pannable
    zoomable
    :node-color="nodeColor"
    :node-stroke-color="nodeStroke"
    :node-stroke-width="6"
    :node-border-radius="8"
    mask-color="rgba(17, 24, 39, 0.08)"
    :aria-label="t('chatbot.editor.minimap_label')"
    @click="goTo"
  />
</template>

<style scoped>
/* À esquerda dos botões de zoom */
/* Mãozinha de clique (diferente da mão de arrastar do canvas): clicar leva até o ponto; com o botão apertado, a mão fechada */
.canvas-minimap, .canvas-minimap :deep(.vue-flow__minimap-mask) { cursor: pointer; }
.canvas-minimap:active, .canvas-minimap:active :deep(.vue-flow__minimap-mask) { cursor: grabbing; }
.canvas-minimap { margin: 0 64px 16px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
</style>
