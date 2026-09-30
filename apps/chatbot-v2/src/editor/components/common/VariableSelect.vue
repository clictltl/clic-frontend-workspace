<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';

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

const variables = computed(() =>
  Object.values(projectStore.project.variables).filter(v => !props.numericOnly || v.type === 'number')
);
const isMissing = computed(() => !!props.modelValue && !projectStore.project.variables[props.modelValue]);
</script>

<template>
  <select :value="modelValue ?? ''" @change="emit('change', ($event.target as HTMLSelectElement).value || null)">
    <option v-if="noneLabel" value="">{{ noneLabel }}</option>
    <option v-else value="" disabled>{{ t('chatbot.properties.variable_select') }}</option>
    <option v-if="isMissing" :value="modelValue!" disabled>?</option>
    <option v-for="v in variables" :key="v.id" :value="v.id">{{ v.name }}</option>
  </select>
</template>
