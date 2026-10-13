<template>
  <BaseModal :title="titleText" :icon="Save" :description="descriptionText" @close="$emit('close')">
    <label class="modal-label" :for="inputId">{{ $t('modals.save_as.label_name', { itemName: itemLabel.toLowerCase() }) }}</label>
    <input
      :id="inputId"
      ref="inputRef"
      v-model="projectName"
      @keyup.enter="handleConfirm"
      :placeholder="placeholderText"
      class="modal-input"
    />

    <p v-if="error" class="modal-error">
      <AlertTriangle :size="16" /> {{ error }}
    </p>

    <template #footer>
      <button class="modal-btn secondary" @click="$emit('close')">{{ $t('global.cancel') }}</button>
      <button class="modal-btn primary" @click="handleConfirm" :disabled="loading">
        {{ loading ? $t('global.saving') : confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { ref, onMounted, computed, useId } from 'vue';
import { AlertTriangle, Save } from '@lucide/vue';
import BaseModal from './BaseModal.vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(defineProps<{
  mode?: 'create' | 'copy';
  itemName?: string;
  projectsStore: any;
}>(), {
  mode: 'create'
});

const emit = defineEmits(['close', 'success']);

const { t } = useI18n();

const projectName = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const inputId = useId();

// Lógica de Texto Dinâmico Genérica
const itemLabel = computed(() => props.itemName ?? t('global.project'));
const isCreateMode = computed(() => props.mode === 'create');

const titleText = computed(() => 
  isCreateMode.value ? t('modals.save_as.title_new', { itemName: itemLabel.value.toLowerCase() }) : t('modals.save_as.title_copy')
);

const descriptionText = computed(() => 
  isCreateMode.value 
    ? t('modals.save_as.desc_new', { itemName: itemLabel.value.toLowerCase() })
    : t('modals.save_as.desc_copy', { itemName: itemLabel.value.toLowerCase() })
);

const placeholderText = computed(() => 
  isCreateMode.value ? t('modals.save_as.placeholder_new', { itemName: itemLabel.value.toLowerCase() }) : t('modals.save_as.placeholder_copy', { itemName: itemLabel.value })
);

const confirmText = computed(() => 
  isCreateMode.value ? t('global.save') : t('modals.save_as.btn_copy')
);

onMounted(() => {
  // Pré-preenche com o nome atual se for um projeto novo/fantasma
  if (isCreateMode.value && props.projectsStore?.currentProjectName) {
    // Garante compatibilidade caso currentProjectName seja passado como Ref bruto ou valor reativo
    const name = props.projectsStore.currentProjectName.value ?? props.projectsStore.currentProjectName;
    if (typeof name === 'string' && name.trim() !== '') {
      projectName.value = name;
    }
  }

  inputRef.value?.focus();
});

async function handleConfirm() {
  if (!projectName.value.trim()) {
    error.value = t('modals.save_as.error_empty');
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // O modal chama o método pela prop injetada
    const result = await props.projectsStore.saveProjectAs(projectName.value);
    
    if (result) {
      emit('success');
      emit('close');
    } else {
      error.value = props.projectsStore.error?.value || t('global.error_saving');
    }
  } catch (e: any) {
    error.value = e.message || t('global.unexpected_error');
  } finally {
    loading.value = false;
  }
}
</script>
