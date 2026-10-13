<script setup lang="ts">
import { computed } from 'vue';
import { MessageSquareText } from '@lucide/vue';
import PanelSection from '../common/PanelSection.vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { NODE_CONFIG } from '../../utils/nodeConfig';
import NodeContentEditor from '../common/NodeContentEditor.vue';
import NodeMediaSettings from './settings/NodeMediaSettings.vue';
import MessageSettings from './settings/MessageSettings.vue';
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
      <component :is="nodeConfig.icon" :size="20" :color="nodeConfig.ink" />
      <h2>{{ t(nodeConfig.titleKey) }}</h2>
    </div>

    <!-- :key recria os editores ao trocar de nó; cada um confirma pendências no nó certo ao desmontar -->
    <div class="panel-content properties" :key="activeNode.id">
      <!-- Cada seção é um cartão. Texto e imagem juntos (aparecem juntos no balão), depois o que é de cada bloco -->
      <PanelSection v-if="'content' in activeNode.data" :icon="MessageSquareText" :title="t('chatbot.properties.section_text')">
        <div class="editor-wrapper">
          <NodeContentEditor :node-id="activeNode.id" variant="sidebar" />
        </div>
      </PanelSection>
      <NodeMediaSettings v-if="'media' in activeNode.data" :node-id="activeNode.id" />

      <OpenQuestionSettings v-if="activeNode.type === 'open_question'" :node-id="activeNode.id" />
      <ChoiceSettings v-else-if="activeNode.type === 'choice_question'" :node-id="activeNode.id" />
      <ConditionSettings v-else-if="activeNode.type === 'condition'" :node-id="activeNode.id" />
      <SetVariableSettings v-else-if="activeNode.type === 'set_variable'" :node-id="activeNode.id" />
      <MathSettings v-else-if="activeNode.type === 'math'" :node-id="activeNode.id" />
      <MessageSettings v-if="activeNode.type === 'message'" :node-id="activeNode.id" />
    </div>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }
.panel-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 3px solid #e5e7eb; background: white; color: #374151; }
.panel-header h2 { margin: 0; font-size: 16px; font-weight: 600; flex: 1; }
.panel-content { padding: 12px; gap: 12px; background: #f3f4f6; flex: 1; }
</style>
