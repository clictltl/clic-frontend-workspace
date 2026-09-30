<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import VariableSelect from '../../common/VariableSelect.vue';
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
    <div class="form-group">
      <label>{{ t('chatbot.properties.set_variable_target') }}</label>
      <VariableSelect
        :model-value="node.data.variableId"
        @change="variableId => projectStore.setAssignment(nodeId, { variableId })"
      />
    </div>
    <div v-if="node.data.variableId" class="form-group">
      <label>{{ t('chatbot.properties.new_value') }}</label>
      <ValueInput
        :model-value="node.data.value"
        :numeric="isNumeric"
        @commit="value => projectStore.setAssignment(nodeId, { value })"
      />
    </div>
  </template>
</template>
