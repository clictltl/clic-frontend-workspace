<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Trash2 } from '@lucide/vue';
import { useProjectStore } from '../../../shared/stores/projectStore';
import type { AssignmentValue } from '../../../shared/types/chatbot';
import DraftInput from './DraftInput.vue';
import VariableSelect from './VariableSelect.vue';

/** Edita um valor: número/texto fixo, leitura de outra variável ou (se permitido) sorteio. */
const props = withDefaults(defineProps<{
  modelValue: AssignmentValue;
  numeric?: boolean; // Aceita só números (e só variáveis numéricas)
  allowRandom?: boolean; // Oferece "Sorteio" (só no bloco Definir variável)
}>(), {
  numeric: false,
  allowRandom: false
});

const emit = defineEmits<{ commit: [value: AssignmentValue] }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const variables = computed(() =>
  Object.values(projectStore.project.variables).filter(v => !props.numeric || v.type === 'number')
);

function setKind(kind: AssignmentValue['kind']) {
  const current = props.modelValue;
  if (kind === current.kind) return;
  if (kind === 'literal') {
    // Vindo do sorteio, aproveita a primeira opção preenchida
    const first = current.kind === 'random' ? current.options.find(o => o.trim()) : undefined;
    emit('commit', { kind: 'literal', value: first ?? (props.numeric ? 0 : '') });
  } else if (kind === 'random') {
    // O valor fixo atual vira a primeira opção
    const first = current.kind === 'literal' ? String(current.value) : '';
    emit('commit', { kind: 'random', options: first.trim() ? [first, ''] : ['', ''] });
  } else if (variables.value[0]) {
    emit('commit', { kind: 'variable', variableId: variables.value[0].id });
  }
}

function commitLiteral(raw: string) {
  const value = props.numeric && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
  emit('commit', { kind: 'literal', value });
}

// --- SORTEIO: cada gesto envia a lista inteira (uma action, um passo no desfazer) ---
const options = computed(() => (props.modelValue.kind === 'random' ? props.modelValue.options : []));

function commitOptions(next: string[]) {
  emit('commit', { kind: 'random', options: next });
}

function setOption(index: number, text: string) {
  commitOptions(options.value.map((option, i) => (i === index ? text : option)));
}
</script>

<template>
  <div class="value-input">
    <select
      class="kind-select"
      :value="modelValue.kind"
      @change="setKind(($event.target as HTMLSelectElement).value as AssignmentValue['kind'])"
    >
      <option value="literal">{{ t('chatbot.properties.value_literal') }}</option>
      <option value="variable" :disabled="variables.length === 0">{{ t('chatbot.properties.variable') }}</option>
      <option v-if="allowRandom" value="random">{{ t('chatbot.properties.value_random') }}</option>
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
      v-else-if="modelValue.kind === 'variable'"
      class="value-field"
      :model-value="modelValue.variableId"
      :numeric-only="numeric"
      @change="id => id && emit('commit', { kind: 'variable', variableId: id })"
    />

    <div v-else class="random-options">
      <span class="random-label">{{ t('chatbot.properties.random_options') }}</span>
      <div v-for="(option, index) in options" :key="index" class="random-row">
        <DraftInput
          class="value-field"
          :type="numeric ? 'number' : 'text'"
          :model-value="option"
          :placeholder="t('chatbot.properties.random_option_placeholder', { n: index + 1 })"
          @commit="text => setOption(index, text)"
        />
        <button
          class="btn-icon danger"
          :disabled="options.length <= 1"
          :title="t('chatbot.properties.remove_random_option')"
          @click="commitOptions(options.filter((_, i) => i !== index))"
        >
          <Trash2 :size="14" />
        </button>
      </div>
      <button class="btn-text" @click="commitOptions([...options, ''])">
        <Plus :size="12" /> {{ t('chatbot.properties.add_random_option') }}
      </button>
      <p class="random-hint">{{ t('chatbot.properties.random_hint') }}</p>
    </div>
  </div>
</template>

<style scoped>
.value-input { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.kind-select { flex: 0 0 auto; max-width: 45%; }
.value-field { flex: 1; min-width: 0; }
.random-options { flex: 1 0 100%; display: flex; flex-direction: column; gap: 6px; }
.random-label { font-size: 12px; color: #6b7280; }
.random-row { display: flex; align-items: center; gap: 6px; }
.random-options .btn-text { align-self: flex-start; }
.random-hint { margin: 0; font-size: 12px; color: #6b7280; }
</style>
