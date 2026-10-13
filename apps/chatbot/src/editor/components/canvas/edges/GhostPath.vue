<script setup lang="ts">
import { computed } from 'vue';
import type { GraphNode } from '@vue-flow/core';
import { edgePath, nodeBox, type Box } from '../../../utils/edgePath';

/**
 * Linha tracejada enquanto se cria uma conexão (arrastando ou no modo clique).
 * Usa o mesmo traçado das conexões: para trás, já mostra a volta contornando o bloco.
 */
const props = defineProps<{
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourceNode?: GraphNode | null; // Vem do Vue Flow no modo arrastar
  targetNode?: GraphNode | null;
  sourceBox?: Box | null;        // Vem do modo clique
}>();

const d = computed(() => edgePath({
  sourceX: props.sourceX, sourceY: props.sourceY,
  targetX: props.targetX, targetY: props.targetY,
  sourceBox: props.sourceBox ?? nodeBox(props.sourceNode),
  targetBox: nodeBox(props.targetNode)
}));
</script>

<template>
  <g>
    <path :d="d" class="ghost-path" fill="none" />
    <circle :cx="targetX" :cy="targetY" fill="#3b82f6" r="5" stroke="white" stroke-width="2" />
  </g>
</template>

<style>
.ghost-path {
  stroke: #3b82f6;
  stroke-width: 3;
  stroke-dasharray: 5, 5;
  animation: ghost-dash 0.5s linear infinite;
  pointer-events: none;
}
@keyframes ghost-dash {
  to { stroke-dashoffset: -10; }
}
@media (prefers-reduced-motion: reduce) {
  .ghost-path { animation: none; }
}
</style>
