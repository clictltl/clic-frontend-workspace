<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { CornerDownRight, Plus, Split, Trash2, X } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import type { ComparisonOperator, Rule } from '../../../../shared/types/chatbot';
import { OPERATOR_KEYS } from '../../../utils/operators';
import VariableSelect from '../../common/VariableSelect.vue';
import ConditionValueInput from '../../common/ConditionValueInput.vue';
import PanelSection from '../../common/PanelSection.vue';

/**
 * Caminhos da condição. Cada caminho é um cartão numerado (o mesmo número da saída no bloco);
 * cada condição se lê como frase: "escolha / é igual a / pedra". Entre condições, a etiqueta
 * "e"/"ou" alterna ao clicar. "Senão" é a saída fixa quando nenhum caminho dá certo.
 */
const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'condition'));
const OPERATORS = Object.keys(OPERATOR_KEYS) as ComparisonOperator[];

function isNumericVariable(variableId: string | null) {
  return !!variableId && projectStore.project.variables[variableId]?.type === 'number';
}

function toggleMatch(rule: Rule) {
  projectStore.setRuleMatch(props.nodeId, rule.id, rule.match === 'all' ? 'any' : 'all');
}
</script>

<template>
  <template v-if="node">
    <PanelSection
      v-for="(rule, rIndex) in node.data.rules"
      :key="rule.id"
      :icon="Split"
      :badge="rIndex + 1"
      :title="t('chatbot.properties.path_n', { n: rIndex + 1 })"
    >
      <template #actions>
        <button
          class="btn-icon danger"
          :disabled="node.data.rules.length <= 1"
          :title="t('chatbot.properties.delete_path')"
          :aria-label="t('chatbot.properties.delete_path')"
          @click="projectStore.removeRule(nodeId, rule.id)"
        >
          <Trash2 :size="14" />
        </button>
      </template>

      <template v-for="(condition, cIndex) in rule.conditions" :key="condition.id">
        <!-- "e" / "ou" entre as condições: um clique alterna para o caminho inteiro -->
        <div v-if="cIndex > 0" class="match-row">
          <button
            type="button"
            class="match-chip"
            :title="t('chatbot.properties.match_toggle_hint')"
            @click="toggleMatch(rule)"
          >
            {{ rule.match === 'any' ? t('chatbot.properties.logic_or') : t('chatbot.properties.logic_and') }}
          </button>
        </div>

        <div class="condition-box">
          <button
            v-if="rule.conditions.length > 1"
            class="btn-icon danger remove-condition"
            :title="t('chatbot.properties.delete_condition')"
            :aria-label="t('chatbot.properties.delete_condition')"
            @click="projectStore.removeCondition(nodeId, rule.id, condition.id)"
          >
            <X :size="14" />
          </button>
          <VariableSelect
            :model-value="condition.variableId"
            @change="variableId => projectStore.updateCondition(nodeId, rule.id, condition.id, { variableId })"
          />
          <select
            :value="condition.operator"
            :aria-label="t('chatbot.properties.operator')"
            @change="projectStore.updateCondition(nodeId, rule.id, condition.id, { operator: ($event.target as HTMLSelectElement).value as ComparisonOperator })"
          >
            <option v-for="op in OPERATORS" :key="op" :value="op">{{ t(OPERATOR_KEYS[op]) }}</option>
          </select>
          <ConditionValueInput
            :model-value="condition.value"
            :numeric="isNumericVariable(condition.variableId)"
            @commit="value => projectStore.updateCondition(nodeId, rule.id, condition.id, { value })"
          />
        </div>
      </template>

      <button class="btn-text add-condition" @click="projectStore.addCondition(nodeId, rule.id)">
        <Plus :size="12" /> {{ t('chatbot.properties.add_condition') }}
      </button>
    </PanelSection>

    <button class="btn-outline" @click="projectStore.addRule(nodeId)">
      <Plus :size="14" /> {{ t('chatbot.properties.add_path') }}
    </button>

    <!-- Saída fixa: sempre existe, sempre por último -->
    <PanelSection :icon="CornerDownRight" :title="t('chatbot.properties.else')">
      <p class="section-hint">{{ t('chatbot.properties.else_hint') }}</p>
    </PanelSection>
  </template>
</template>

<style scoped>
.condition-box {
  position: relative; display: flex; flex-direction: column; gap: 6px;
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px;
}
/* Com mais de uma condição, o X fica no canto; o seletor de variável abre espaço para ele */
.remove-condition { position: absolute; top: -10px; right: -10px; background: white; border: 1px solid #e5e7eb; border-radius: 50%; }
.match-row { display: flex; justify-content: center; }
.match-chip {
  border: 1px solid #c4b5fd; background: #f5f3ff; color: #6d28d9;
  border-radius: 999px; padding: 2px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
}
.match-chip:hover { background: #ede9fe; }
.add-condition { align-self: flex-start; }
</style>
