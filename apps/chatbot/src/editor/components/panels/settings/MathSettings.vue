<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import type { MathOperator } from '../../../../shared/types/chatbot';
import { Calculator, Box } from '@lucide/vue';
import VariableSelect from '../../common/VariableSelect.vue';
import PanelSection from '../../common/PanelSection.vue';
import ValueInput from '../../common/ValueInput.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'math'));
const OPERATORS: MathOperator[] = ['+', '-', '*', '/'];
</script>

<template>
  <template v-if="node">
    <PanelSection :icon="Box" :title="t('chatbot.properties.math_target')">
      <VariableSelect
        :model-value="node.data.variableId"
        numeric-only
        @change="variableId => projectStore.setMathOperation(nodeId, { variableId })"
      />
    </PanelSection>
    <PanelSection v-if="node.data.variableId" :icon="Calculator" :title="t('chatbot.properties.operation')">
      <div class="form-row">
        <select
          :value="node.data.operator"
          style="flex: 0 0 64px;"
          @change="projectStore.setMathOperation(nodeId, { operator: ($event.target as HTMLSelectElement).value as MathOperator })"
        >
          <option v-for="op in OPERATORS" :key="op" :value="op">{{ op }}</option>
        </select>
        <ValueInput
          :model-value="node.data.operand"
          numeric
          @commit="operand => operand.kind !== 'random' && projectStore.setMathOperation(nodeId, { operand })"
        />
      </div>
    </PanelSection>
  </template>
</template>
