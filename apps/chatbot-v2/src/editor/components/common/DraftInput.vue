<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

/**
 * Input com rascunho local: o valor só é confirmado (`commit`) no blur ou no Enter.
 * Evita uma action (e um evento de telemetria) por tecla digitada. Esc descarta o rascunho.
 */
const props = withDefaults(defineProps<{
  modelValue: string | number;
  type?: 'text' | 'number';
  placeholder?: string;
}>(), {
  type: 'text',
  placeholder: ''
});

const emit = defineEmits<{ commit: [value: string] }>();

const draft = ref(String(props.modelValue));
const isFocused = ref(false);

// Mudança externa (undo, outro painel) só substitui o rascunho se o campo não estiver em uso
watch(() => props.modelValue, value => {
  if (!isFocused.value) draft.value = String(value);
});

function commit() {
  isFocused.value = false;
  // Em type="number" o v-model do Vue converte para número: normaliza para string
  const value = String(draft.value);
  if (value !== String(props.modelValue)) emit('commit', value);
}

// Remover um elemento focado não dispara blur em todos os navegadores
onBeforeUnmount(() => {
  if (isFocused.value) commit();
});

function cancel(event: KeyboardEvent) {
  draft.value = String(props.modelValue);
  (event.target as HTMLInputElement).blur();
}
</script>

<template>
  <input
    v-model="draft"
    :type="type"
    :placeholder="placeholder"
    @focus="isFocused = true"
    @blur="commit"
    @keydown.enter="($event.target as HTMLInputElement).blur()"
    @keydown.esc="cancel"
  />
</template>
