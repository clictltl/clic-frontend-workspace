<script setup lang="ts">
import { computed } from 'vue';
import { getSmoothStepPath, Position } from '@vue-flow/core';

const props = defineProps<{
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition?: Position;
}>();

const opposite: Record<Position, Position> = {
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
};

const d = computed(() => {
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition ?? opposite[props.sourcePosition],
    borderRadius: 16,
  });
  return path;
});
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
</style>