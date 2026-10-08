<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Database, Palette } from '@lucide/vue';
import { useProjectStore } from '../../../shared/stores/projectStore';
import VariablesPanel from './VariablesPanel.vue';
import AppearancePanel from './AppearancePanel.vue';
import NodePropertiesPanel from './NodePropertiesPanel.vue';
import EdgePropertiesPanel from './EdgePropertiesPanel.vue';

const { t } = useI18n();
const projectStore = useProjectStore();

// Aba aberta quando nada está selecionado (estado de interface, fora do JSON)
const tab = ref<'variables' | 'appearance'>('variables');
</script>

<template>
  <aside class="sidebar-container">
    <NodePropertiesPanel v-if="projectStore.selectedNodeId" />
    <EdgePropertiesPanel v-else-if="projectStore.selectedEdgeId" />
    <template v-else>
      <div class="tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'variables'" :class="{ active: tab === 'variables' }" @click="tab = 'variables'">
          <Database :size="16" /> {{ t('chatbot.editor.tabs.variables') }}
        </button>
        <button type="button" role="tab" :aria-selected="tab === 'appearance'" :class="{ active: tab === 'appearance' }" @click="tab = 'appearance'">
          <Palette :size="16" /> {{ t('chatbot.editor.tabs.appearance') }}
        </button>
      </div>
      <VariablesPanel v-if="tab === 'variables'" />
      <AppearancePanel v-else />
    </template>
  </aside>
</template>

<style scoped>
.sidebar-container {
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
.tabs { display: flex; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex: 0 0 auto; }
.tabs button {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 14px 8px; border: none; border-bottom: 3px solid transparent; background: transparent;
  font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer;
}
.tabs button:hover { color: #374151; }
.tabs button.active { color: #1d4ed8; border-bottom-color: #3b82f6; background: white; }
</style>
