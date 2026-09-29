<script setup lang="ts">
import { computed } from 'vue';
import { getSmoothStepPath } from '@vue-flow/core';

const props = defineProps<{
  id: string;
  sourceX: number; sourceY: number;
  targetX: number; targetY: number;
  sourcePosition: any; targetPosition: any;
  data: any; selected?: boolean;
  markerEnd?: string; // O Vue Flow injetará a seta nativa aqui
}>();

const pathStr = computed(() => {
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX, sourceY: props.sourceY,
    targetX: props.targetX, targetY: props.targetY,
    sourcePosition: props.sourcePosition, targetPosition: props.targetPosition,
    borderRadius: 16
  });
  return path;
});

const edgeColor = computed(() => props.data?.edgeData?.color || '#9ca3af');
</script>

<template>
  <g class="custom-edge">
    <!-- Linha Visível com Seta Nativa -->
    <path 
      :d="pathStr" 
      class="edge-path" 
      :stroke="edgeColor" 
      :stroke-width="selected ? 4 : 2"
      :stroke-dasharray="selected ? '5,5' : 'none'"
      fill="none" 
      stroke-linejoin="round"
      :marker-end="markerEnd" 
    />
    
    <!-- Linha Invisível Grossa (Só para Clique) -->
    <path 
      :d="pathStr" 
      class="edge-interaction" 
      stroke="transparent" 
      stroke-width="20" 
      fill="none" 
    />
  </g>
</template>

<style scoped>
.edge-path { transition: stroke-width 0.2s, stroke-dasharray 0.2s; pointer-events: none; }
.edge-interaction { cursor: pointer; pointer-events: stroke; }
</style>