<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { findVariableByName } from '../../../shared/domain/variables';

/**
 * Seletor de variável. A primeira opção cria uma variável ali mesmo, sem trocar de aba
 * (nome repetido reaproveita a existente). Não aparece em `numericOnly`: variáveis novas são de texto.
 */
const props = withDefaults(defineProps<{
  modelValue: string | null;
  numericOnly?: boolean;
  noneLabel?: string; // Se informado, permite "nenhuma" (null) como opção válida
}>(), {
  numericOnly: false
});

const emit = defineEmits<{ change: [variableId: string | null] }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const NEW_VARIABLE = '__new__';

const variables = computed(() =>
  Object.values(projectStore.project.variables).filter(v => !props.numericOnly || v.type === 'number')
);
const isMissing = computed(() => !!props.modelValue && !projectStore.project.variables[props.modelValue]);
const canCreate = computed(() => !props.numericOnly);

// --- CRIAÇÃO NA HORA ---
const isCreating = ref(false);
const newName = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

function onSelect(event: Event) {
  const select = event.target as HTMLSelectElement;
  if (select.value !== NEW_VARIABLE) {
    emit('change', select.value || null);
    return;
  }
  select.value = props.modelValue ?? ''; // A opção "nova" nunca fica selecionada
  isCreating.value = true;
  newName.value = '';
  nextTick(() => nameInput.value?.focus());
}

function confirmCreate() {
  const name = newName.value.trim();
  newName.value = ''; // O blur que vem ao fechar o campo não repete a criação
  isCreating.value = false;
  if (!name) return;
  const id = findVariableByName(projectStore.project, name)?.id ?? projectStore.addVariable(name);
  if (id && id !== props.modelValue) emit('change', id);
}

function cancelCreate() {
  newName.value = ''; // Senão o blur do campo, ao sumir, criaria a variável
  isCreating.value = false;
}
</script>

<template>
  <div class="variable-select">
    <div v-if="isCreating" class="create-row">
      <input
        ref="nameInput"
        v-model="newName"
        type="text"
        :placeholder="t('chatbot.properties.variable_name')"
        @keydown.enter.prevent="confirmCreate"
        @keydown.esc.prevent="cancelCreate"
        @blur="confirmCreate"
      />
      <!-- mousedown.prevent: o clique não tira o foco do campo antes de criar -->
      <button type="button" class="btn-create" @mousedown.prevent @click="confirmCreate">
        {{ t('chatbot.properties.create_variable') }}
      </button>
    </div>

    <select v-else :value="modelValue ?? ''" @change="onSelect">
      <option v-if="canCreate" :value="NEW_VARIABLE">{{ t('chatbot.properties.new_variable_option') }}</option>
      <option v-if="noneLabel" value="">{{ noneLabel }}</option>
      <option v-else value="" disabled>{{ t('chatbot.properties.variable_select') }}</option>
      <option v-if="isMissing" :value="modelValue!" disabled>?</option>
      <option v-for="v in variables" :key="v.id" :value="v.id">{{ v.name }}</option>
    </select>
  </div>
</template>

<style scoped>
.variable-select { min-width: 0; }
.variable-select select { width: 100%; }
.create-row { display: flex; gap: 6px; }
.create-row input { flex: 1; min-width: 0; }
.btn-create {
  flex: 0 0 auto; padding: 0 12px; border: none; border-radius: 4px;
  background: #3b82f6; color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.btn-create:hover { background: #2563eb; }
</style>
