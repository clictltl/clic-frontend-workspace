<script setup lang="ts">
import { computed } from 'vue';
import { ArrowLeft, Palette } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';

const { t } = useI18n();
const projectStore = useProjectStore();
const activeEdge = computed(() => projectStore.activeEdge);

const COLORS = ['#9ca3af', '#3b82f6', '#10b981', '#facc15', '#ef4444', '#a855f7'];

function closePanel() {
  projectStore.clearSelection();
}

function updateColor(color: string) {
  if (activeEdge.value) {
    projectStore.updateEdgeColor(activeEdge.value.id, color);
  }
}
</script>

<template>
  <div class="panel" v-if="activeEdge">
    <div class="panel-header">
      <button class="btn-back" @click="closePanel" :title="t('chatbot.editor.back')">
        <ArrowLeft :size="18" />
      </button>
      <Palette :size="20" />
      <h2>{{ t('chatbot.editor.edge_color') }}</h2>
    </div>

    <div class="panel-content">
      <div class="color-grid">
        <button 
          v-for="c in COLORS" 
          :key="c"
          class="color-btn"
          :class="{ 'is-active': activeEdge.color === c || (!activeEdge.color && c === '#9ca3af') }"
          :style="{ backgroundColor: c }"
          @click="updateColor(c)"
        ></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }
.panel-header {
  display: flex; align-items: center; gap: 8px;
  padding: 16px; border-bottom: 1px solid #e5e7eb;
  background: #f9fafb; color: #374151;
}
.panel-header h2 { margin: 0; font-size: 16px; font-weight: 600; flex: 1; }
.btn-back {
  background: transparent; border: none; cursor: pointer; color: #6b7280; padding: 4px; border-radius: 4px;
}
.btn-back:hover { background: #e5e7eb; color: #374151; }
.panel-content { padding: 16px; }
.color-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.color-btn {
  width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer;
  transition: transform 0.1s;
}
.color-btn:hover { transform: scale(1.1); }
.color-btn.is-active { border-color: #374151; box-shadow: 0 0 0 2px white inset; }
</style>