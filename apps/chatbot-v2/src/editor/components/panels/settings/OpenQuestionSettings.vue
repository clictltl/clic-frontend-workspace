<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import VariableSelect from '../../common/VariableSelect.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'open_question'));
</script>

<template>
  <div v-if="node" class="form-group">
    <label>{{ t('chatbot.properties.save_answer_var') }}</label>
    <VariableSelect
      :model-value="node.data.variableId"
      :none-label="`(${t('chatbot.properties.save_answer_none')})`"
      @change="variableId => projectStore.setAnswerVariable(nodeId, variableId)"
    />
  </div>
</template>
