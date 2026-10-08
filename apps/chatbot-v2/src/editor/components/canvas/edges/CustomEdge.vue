<script setup lang="ts">
import { computed, ref } from 'vue';
import type { GraphNode } from '@vue-flow/core';
import { edgePath, nodeBox, type FlowEdgeData } from '../../../utils/edgePath';

const props = defineProps<{
  id: string;
  sourceX: number; sourceY: number;
  targetX: number; targetY: number;
  sourceNode: GraphNode; targetNode: GraphNode;
  data: FlowEdgeData;
  selected?: boolean;
  markerEnd?: string; // Seta nativa do Vue Flow
}>();

const isHovered = ref(false);

const pathStr = computed(() => edgePath({
  sourceX: props.sourceX, sourceY: props.sourceY,
  targetX: props.targetX, targetY: props.targetY,
  sourceBox: nodeBox(props.sourceNode),
  targetBox: nodeBox(props.targetNode),
  lane: props.data.lane
}));

const edgeColor = computed(() => props.data.color || '#9ca3af');
const isActive = computed(() => props.selected || isHovered.value);
const strokeWidth = computed(() => {
  if (props.selected) return 4;
  if (isHovered.value || props.data.emphasis === 'highlight') return 3;
  return 2;
});
</script>

<template>
  <g class="custom-edge" :class="`is-${data.emphasis}`">
    <!-- Linha visível com a seta nativa -->
    <path
      :d="pathStr"
      class="edge-path"
      :class="{ 'is-animated': isActive }"
      :stroke="edgeColor"
      :stroke-width="strokeWidth"
      :stroke-dasharray="isActive ? '5,5' : 'none'"
      fill="none"
      stroke-linejoin="round"
      :marker-end="markerEnd"
    />

    <!-- Linha invisível grossa (só para clique e hover) -->
    <path
      :d="pathStr"
      class="edge-interaction"
      stroke="transparent"
      stroke-width="20"
      fill="none"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    />
  </g>
</template>

<style scoped>
.custom-edge { transition: opacity 0.2s; }
/* Com um bloco selecionado, as conexões que não são dele ficam em segundo plano */
.custom-edge.is-dim { opacity: 0.3; }

.edge-path {
  transition: stroke-width 0.2s, stroke-dasharray 0.2s;
  pointer-events: none;
}

/* Animação dos tracinhos andando */
.edge-path.is-animated {
  animation: edge-dash 0.5s linear infinite;
}

@keyframes edge-dash {
  to { stroke-dashoffset: -10; }
}

.edge-interaction {
  cursor: pointer;
  pointer-events: stroke;
}
</style>
