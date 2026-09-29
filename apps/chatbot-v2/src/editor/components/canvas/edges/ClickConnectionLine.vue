<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useVueFlow, Position } from '@vue-flow/core';
import GhostPath from './GhostPath.vue';

const { connectionClickStartHandle, findNode, screenToFlowCoordinate, viewport } = useVueFlow();

const cursor = ref({ x: 0, y: 0 });

// Ponto de origem = centro/borda do handle clicado, em coordenadas do flow
const source = computed(() => {
  const h = connectionClickStartHandle.value;
  if (!h) return null;

  const node = findNode(h.nodeId);
  const bounds = node?.handleBounds?.[h.type as 'source' | 'target'];
  if (!node || !bounds || bounds.length === 0) return null;

  // Flexibilidade de versão: pega o ID do handle dependendo de como a biblioteca chama
  const targetHandleId = (h as any).handleId || (h as any).id;
  const hb = bounds.find((b) => b.id === targetHandleId) || bounds[0];
  
  // Blindagem TypeScript
  if (!hb) return null;

  const x = node.computedPosition.x + hb.x;
  const y = node.computedPosition.y + hb.y;

  switch (hb.position) {
    case Position.Top:    return { x: x + hb.width / 2, y, position: hb.position };
    case Position.Bottom: return { x: x + hb.width / 2, y: y + hb.height, position: hb.position };
    case Position.Left:   return { x, y: y + hb.height / 2, position: hb.position };
    default:              return { x: x + hb.width, y: y + hb.height / 2, position: hb.position };
  }
});

function onPointerMove(e: PointerEvent) {
  cursor.value = screenToFlowCoordinate({ x: e.clientX, y: e.clientY });
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') connectionClickStartHandle.value = null;
}

function detach() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('keydown', onKeyDown);
}

// Só escuta o mouse enquanto o modo click está ativo
watch(
  connectionClickStartHandle,
  (handle) => {
    detach();
    if (!handle) return;
    if (source.value) cursor.value = { x: source.value.x, y: source.value.y }; // evita "pulo" inicial
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
  },
  { immediate: true }
);

onBeforeUnmount(detach);
</script>

<template>
  <svg
    v-if="source"
    class="click-connection-overlay"
  >
    <g :transform="`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`">
      <GhostPath
        :source-x="source.x"
        :source-y="source.y"
        :source-position="source.position"
        :target-x="cursor.x"
        :target-y="cursor.y"
      />
    </g>
  </svg>
</template>

<style scoped>
.click-connection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 1000;
}
</style>