<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import type { Value } from '../../../shared/types/chatbot';
import DraftInput from './DraftInput.vue';
import VariableSelect from './VariableSelect.vue';

/** Edita um `Value`: número/texto fixo ou leitura de outra variável. */
const props = withDefaults(defineProps<{
  modelValue: Value;
  numeric?: boolean; // Aceita só números (e só variáveis numéricas)
}>(), {
  numeric: false
});

const emit = defineEmits<{ commit: [value: Value] }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const variables = computed(() =>
  Object.values(projectStore.project.variables).filter(v => !props.numeric || v.type === 'number')
);

function setKind(kind: Value['kind']) {
  if (kind === props.modelValue.kind) return;
  if (kind === 'literal') {
    emit('commit', { kind: 'literal', value: props.numeric ? 0 : '' });
  } else if (variables.value[0]) {
    emit('commit', { kind: 'variable', variableId: variables.value[0].id });
  }
}

function commitLiteral(raw: string) {
  const value = props.numeric && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
  emit('commit', { kind: 'literal', value });
}
</script>

<template>
  <div class="value-input">
    <select
      class="kind-select"
      :value="modelValue.kind"
      @change="setKind(($event.target as HTMLSelectElement).value as Value['kind'])"
    >
      <option value="literal">{{ t('chatbot.properties.value_literal') }}</option>
      <option value="variable" :disabled="variables.length === 0">{{ t('chatbot.properties.variable') }}</option>
    </select>

    <DraftInput
      v-if="modelValue.kind === 'literal'"
      class="value-field"
      :type="numeric ? 'number' : 'text'"
      :model-value="modelValue.value"
      :placeholder="t('chatbot.properties.value')"
      @commit="commitLiteral"
    />
    <VariableSelect
      v-else
      class="value-field"
      :model-value="modelValue.variableId"
      :numeric-only="numeric"
      @change="id => id && emit('commit', { kind: 'variable', variableId: id })"
    />
  </div>
</template>

<style scoped>
.value-input { display: flex; gap: 6px; min-width: 0; }
.kind-select { flex: 0 0 auto; max-width: 45%; }
.value-field { flex: 1; min-width: 0; }
</style>
