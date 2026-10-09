<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import { Box, PenLine } from '@lucide/vue';
import VariableSelect from '../../common/VariableSelect.vue';
import PanelSection from '../../common/PanelSection.vue';
import ValueInput from '../../common/ValueInput.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'set_variable'));
const isNumeric = computed(() => {
  const id = node.value?.data.variableId;
  return !!id && projectStore.project.variables[id]?.type === 'number';
});
</script>

<template>
  <template v-if="node">
    <PanelSection :icon="Box" :title="t('chatbot.properties.section_target')">
      <VariableSelect
        :model-value="node.data.variableId"
        @change="variableId => projectStore.setAssignment(nodeId, { variableId })"
      />
    </PanelSection>
    <PanelSection v-if="node.data.variableId" :icon="PenLine" :title="t('chatbot.properties.section_new_value')">
      <ValueInput
        :model-value="node.data.value"
        :numeric="isNumeric"
        allow-random
        @commit="value => projectStore.setAssignment(nodeId, { value })"
      />
    </PanelSection>
  </template>
</template>
