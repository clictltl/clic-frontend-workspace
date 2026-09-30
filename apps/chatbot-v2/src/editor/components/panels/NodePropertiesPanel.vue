<script setup lang="ts">
import { computed } from 'vue';
import { ArrowLeft } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { NODE_CONFIG } from '../../utils/nodeConfig';
import NodeContentEditor from '../common/NodeContentEditor.vue';
import ChoiceSettings from './settings/ChoiceSettings.vue';
import ConditionSettings from './settings/ConditionSettings.vue';
import SetVariableSettings from './settings/SetVariableSettings.vue';
import MathSettings from './settings/MathSettings.vue';
import OpenQuestionSettings from './settings/OpenQuestionSettings.vue';

const { t } = useI18n();
const projectStore = useProjectStore();

const activeNode = computed(() => projectStore.activeNode);
const nodeConfig = computed(() => (activeNode.value ? NODE_CONFIG[activeNode.value.type] : null));
</script>

<template>
  <div class="panel" v-if="activeNode && nodeConfig">
    <div class="panel-header" :style="{ borderBottomColor: nodeConfig.color }">
      <button class="btn-back" @click="projectStore.clearSelection()" :title="t('chatbot.editor.back')"><ArrowLeft :size="18" /></button>
      <component :is="nodeConfig.icon" :size="20" :color="nodeConfig.color" />
      <h2>{{ t(nodeConfig.titleKey) }}</h2>
    </div>

    <!-- :key recria os editores ao trocar de nó; cada um confirma pendências no nó certo ao desmontar -->
    <div class="panel-content properties" :key="activeNode.id">
      <div v-if="'content' in activeNode.data" class="form-group">
        <label>{{ t('chatbot.properties.bubble_text') }}</label>
        <div class="editor-wrapper">
          <NodeContentEditor :node-id="activeNode.id" variant="sidebar" />
        </div>
      </div>

      <template v-if="activeNode.type === 'choice_question'">
        <hr class="divider" />
        <ChoiceSettings :node-id="activeNode.id" />
      </template>
      <ConditionSettings v-else-if="activeNode.type === 'condition'" :node-id="activeNode.id" />
      <SetVariableSettings v-else-if="activeNode.type === 'set_variable'" :node-id="activeNode.id" />
      <MathSettings v-else-if="activeNode.type === 'math'" :node-id="activeNode.id" />
      <template v-else-if="activeNode.type === 'open_question'">
        <hr class="divider" />
        <OpenQuestionSettings :node-id="activeNode.id" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }
.panel-header { display: flex; align-items: center; gap: 8px; padding: 16px; border-bottom: 2px solid #e5e7eb; background: #f9fafb; color: #374151; }
.panel-header h2 { margin: 0; font-size: 16px; font-weight: 600; flex: 1; }
.btn-back { background: transparent; border: none; cursor: pointer; color: #6b7280; display: flex; align-items: center; padding: 4px; border-radius: 4px; }
.btn-back:hover { background: #e5e7eb; color: #374151; }
.panel-content { padding: 16px; }
</style>
