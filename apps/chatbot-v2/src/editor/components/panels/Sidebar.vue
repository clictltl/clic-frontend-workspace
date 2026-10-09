<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Box, MousePointerClick, Palette, SquareMousePointer } from '@lucide/vue';
import { useProjectStore } from '../../../shared/stores/projectStore';
import VariablesPanel from './VariablesPanel.vue';
import AppearancePanel from './AppearancePanel.vue';
import NodePropertiesPanel from './NodePropertiesPanel.vue';

/**
 * Barra lateral com três abas sempre visíveis (como no Scratch): o conteúdo não "pula" a cada
 * clique no canvas. Selecionar um bloco abre a aba Bloco; trocar de aba não desmarca o bloco.
 * Conexões não têm painel: o menu flutuante delas já tem cores e excluir.
 */
type Tab = 'block' | 'variables' | 'appearance';

const { t } = useI18n();
const projectStore = useProjectStore();
const tab = ref<Tab>('block');

watch(() => projectStore.selectedNodeId, id => { if (id) tab.value = 'block'; });

const TABS: { id: Tab; icon: typeof Box; key: string }[] = [
  { id: 'block', icon: SquareMousePointer, key: 'chatbot.editor.tabs.block' },
  { id: 'variables', icon: Box, key: 'chatbot.editor.tabs.variables' },
  { id: 'appearance', icon: Palette, key: 'chatbot.editor.tabs.appearance' }
];
</script>

<template>
  <aside class="sidebar-container">
    <div class="tabs" role="tablist">
      <button
        v-for="item in TABS"
        :key="item.id"
        type="button"
        role="tab"
        :aria-selected="tab === item.id"
        :class="{ active: tab === item.id }"
        @click="tab = item.id"
      >
        <component :is="item.icon" :size="16" aria-hidden="true" /> {{ t(item.key) }}
      </button>
    </div>

    <template v-if="tab === 'block'">
      <NodePropertiesPanel v-if="projectStore.selectedNodeId" />
      <div v-else class="empty-block">
        <MousePointerClick :size="32" aria-hidden="true" />
        <p class="empty-title">{{ t('chatbot.editor.block_tab_empty') }}</p>
        <p class="empty-hint">{{ t('chatbot.editor.block_tab_hint') }}</p>
      </div>
    </template>
    <VariablesPanel v-else-if="tab === 'variables'" />
    <AppearancePanel v-else />
  </aside>
</template>

<style scoped>
.sidebar-container {
  width: 320px;
  background: #f3f4f6;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
.tabs { display: flex; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex: 0 0 auto; position: sticky; top: 0; z-index: 5; }
.tabs button {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 13px 4px; border: none; border-bottom: 3px solid transparent; background: transparent;
  font-size: 13px; font-weight: 600; color: #4b5563; cursor: pointer; white-space: nowrap;
}
.tabs button:hover { color: #1f2937; }
.tabs button.active { color: #1d4ed8; border-bottom-color: #3b82f6; background: white; }
.tabs button:focus-visible { outline: 3px solid #93c5fd; outline-offset: -3px; }

.empty-block {
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;
  margin: 12px; padding: 28px 20px; color: #6b7280;
  background: white; border: 1px dashed #d1d5db; border-radius: 10px;
}
.empty-title { margin: 0; font-size: 14px; font-weight: 600; color: #374151; line-height: 1.4; }
.empty-hint { margin: 0; font-size: 12px; line-height: 1.5; }
</style>
