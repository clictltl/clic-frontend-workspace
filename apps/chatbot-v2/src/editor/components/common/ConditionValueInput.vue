<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Braces } from '@lucide/vue';
import type { Value } from '../../../shared/types/chatbot';
import DraftInput from './DraftInput.vue';
import VariableSelect from './VariableSelect.vue';

/**
 * Valor comparado numa condição. O caso comum (digitar um valor) vem por padrão; o botão {x}
 * troca para "usar o valor de uma variável" sem precisar entender "valor fixo" antes.
 */
const props = withDefaults(defineProps<{
  modelValue: Value;
  numeric?: boolean; // Variável antiga do tipo número: campo numérico e só variáveis numéricas
}>(), {
  numeric: false
});

const emit = defineEmits<{ commit: [value: Value] }>();
const { t } = useI18n();

// Escolhendo a variável (ainda sem nenhuma escolhida): o seletor aparece antes de gravar algo
const picking = ref(false);
const usesVariable = computed(() => picking.value || props.modelValue.kind === 'variable');

function toggle() {
  if (usesVariable.value) {
    picking.value = false;
    if (props.modelValue.kind === 'variable') emit('commit', { kind: 'literal', value: props.numeric ? 0 : '' });
  } else {
    picking.value = true;
  }
}

function pickVariable(id: string | null) {
  if (!id) return;
  picking.value = false;
  emit('commit', { kind: 'variable', variableId: id });
}

function commitLiteral(raw: string) {
  const value = props.numeric && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
  emit('commit', { kind: 'literal', value });
}

const toggleTitle = computed(() => t(usesVariable.value ? 'chatbot.properties.value_use_literal' : 'chatbot.properties.value_use_variable'));
</script>

<template>
  <div class="condition-value">
    <VariableSelect
      v-if="usesVariable"
      class="value-field"
      :model-value="modelValue.kind === 'variable' ? modelValue.variableId : null"
      :numeric-only="numeric"
      @change="pickVariable"
    />
    <DraftInput
      v-else
      class="value-field"
      :type="numeric ? 'number' : 'text'"
      :model-value="modelValue.kind === 'literal' ? modelValue.value : ''"
      :placeholder="t('chatbot.properties.value')"
      @commit="commitLiteral"
    />
    <button
      type="button"
      class="btn-toggle"
      :class="{ active: usesVariable }"
      :aria-pressed="usesVariable"
      :title="toggleTitle"
      :aria-label="toggleTitle"
      @click="toggle"
    >
      <Braces :size="16" />
    </button>
  </div>
</template>

<style scoped>
.condition-value { display: flex; gap: 6px; min-width: 0; }
.value-field { flex: 1; min-width: 0; }
.btn-toggle {
  flex: 0 0 auto; width: 36px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #d1d5db; border-radius: 4px; background: white; color: #6b7280; cursor: pointer;
}
.btn-toggle:hover { background: #f3f4f6; }
.btn-toggle.active { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; }
</style>
