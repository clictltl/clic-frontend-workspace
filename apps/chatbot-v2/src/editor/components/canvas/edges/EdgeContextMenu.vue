<script setup lang="ts">
import { computed } from 'vue';
import { Palette, Trash2 } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';

const props = defineProps<{ edgeId: string; x: number; y: number; }>();
const emit = defineEmits(['close']);
const projectStore = useProjectStore();
const COLORS = ['#9ca3af', '#3b82f6', '#10b981', '#facc15', '#ef4444', '#a855f7'];

const edge = computed(() => projectStore.project.edges[props.edgeId]);

function updateColor(color: string) {
  projectStore.updateEdgeColor(props.edgeId, color);
}

function deleteEdge() {
  projectStore.removeEdge(props.edgeId);
  emit('close');
}
</script>

<template>
  <div class="edge-menu" :style="{ top: `${y}px`, left: `${x}px` }" v-if="edge">
    <div class="menu-section">
      <div class="menu-header"><Palette :size="12" /> Cores</div>
      <div class="color-grid">
        <button v-for="c in COLORS" :key="c" class="color-btn"
          :class="{ 'is-active': edge.color === c || (!edge.color && c === '#9ca3af') }"
          :style="{ backgroundColor: c }" @click="updateColor(c)"></button>
      </div>
    </div>
    <div class="divider"></div>
    <button class="menu-action text-danger" @click="deleteEdge">
      <Trash2 :size="14" /> Excluir
    </button>
  </div>
</template>

<style scoped>
.edge-menu { position: fixed; z-index: 999999; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 8px; width: 160px; display: flex; flex-direction: column; gap: 4px; transform: translate(-50%, -100%); margin-top: -10px; }
.menu-header { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #9ca3af; margin-bottom: 6px; text-transform: uppercase; }
.color-grid { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.color-btn { width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.color-btn.is-active { border-color: #374151; box-shadow: 0 0 0 1px white inset; }
.divider { height: 1px; background: #e5e7eb; margin: 4px 0; }
.menu-action { display: flex; align-items: center; gap: 8px; background: transparent; border: none; padding: 6px; border-radius: 4px; cursor: pointer; text-align: left; font-size: 13px; color: #374151; }
.menu-action:hover { background: #f3f4f6; }
.text-danger { color: #ef4444; }
.text-danger:hover { background: #fee2e2 !important; }
</style>