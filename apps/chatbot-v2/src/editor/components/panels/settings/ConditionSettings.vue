<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Trash2 } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import type { ComparisonOperator, Rule } from '../../../../shared/types/chatbot';
import VariableSelect from '../../common/VariableSelect.vue';
import ValueInput from '../../common/ValueInput.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'condition'));

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: '==', label: '=' }, { value: '!=', label: '≠' },
  { value: '>', label: '>' }, { value: '<', label: '<' },
  { value: '>=', label: '≥' }, { value: '<=', label: '≤' }
];

function isNumericVariable(variableId: string | null) {
  return !!variableId && projectStore.project.variables[variableId]?.type === 'number';
}
</script>

<template>
  <div v-if="node" class="form-group">
    <label>{{ t('chatbot.properties.rules_label') }}</label>

    <div class="rules-container">
      <div v-for="(rule, rIndex) in node.data.rules" :key="rule.id" class="rule-card">
        <div class="rule-header">
          <span>{{ t('chatbot.properties.rule_n', { n: rIndex + 1 }) }}</span>
          <button
            class="btn-icon danger"
            :disabled="node.data.rules.length <= 1"
            :title="t('chatbot.properties.delete_rule')"
            @click="projectStore.removeRule(nodeId, rule.id)"
          >
            <Trash2 :size="14" />
          </button>
        </div>

        <div class="rule-body">
          <div v-if="rule.conditions.length > 1" class="rule-match">
            <span>{{ t('chatbot.properties.match_label') }}</span>
            <select
              :value="rule.match"
              @change="projectStore.setRuleMatch(nodeId, rule.id, ($event.target as HTMLSelectElement).value as Rule['match'])"
            >
              <option value="all">{{ t('chatbot.properties.match_all') }}</option>
              <option value="any">{{ t('chatbot.properties.match_any') }}</option>
            </select>
          </div>

          <div v-for="condition in rule.conditions" :key="condition.id" class="sub-condition-box">
            <div class="form-row">
              <VariableSelect
                :model-value="condition.variableId"
                @change="variableId => projectStore.updateCondition(nodeId, rule.id, condition.id, { variableId })"
              />
              <button
                class="btn-icon danger"
                :disabled="rule.conditions.length <= 1"
                :title="t('chatbot.properties.delete_condition')"
                @click="projectStore.removeCondition(nodeId, rule.id, condition.id)"
              >
                <Trash2 :size="14" />
              </button>
            </div>
            <div class="form-row">
              <select
                :value="condition.operator"
                style="flex: 0 0 64px;"
                @change="projectStore.updateCondition(nodeId, rule.id, condition.id, { operator: ($event.target as HTMLSelectElement).value as ComparisonOperator })"
              >
                <option v-for="op in OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
              </select>
              <ValueInput
                :model-value="condition.value"
                :numeric="isNumericVariable(condition.variableId)"
                @commit="value => value.kind !== 'random' && projectStore.updateCondition(nodeId, rule.id, condition.id, { value })"
              />
            </div>
          </div>

          <button class="btn-text" @click="projectStore.addCondition(nodeId, rule.id)">
            <Plus :size="12" /> {{ t('chatbot.properties.add_condition') }}
          </button>
        </div>
      </div>

      <button class="btn-outline" @click="projectStore.addRule(nodeId)">
        <Plus :size="14" /> {{ t('chatbot.properties.add_rule') }}
      </button>

      <!-- "Caso contrário" é fixo: sempre existe como última saída -->
      <div class="rule-card else-card">
        <div class="rule-header">{{ t('chatbot.properties.else') }}</div>
        <div class="rule-body">{{ t('chatbot.properties.else_hint') }}</div>
      </div>
    </div>
  </div>
</template>
