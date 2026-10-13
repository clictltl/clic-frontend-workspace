<template>
  <BaseModal :title="$t('modals.delete.title', { itemName: itemName.toLowerCase() })" :icon="Trash2" tone="red" @close="close">
    <template #description>
      <p
        v-if="currentProjectName"
        v-html="$t('modals.delete.confirm_named', { itemName: itemName.toLowerCase(), projectName: currentProjectName })"
      />
      <p v-else>
        {{ $t('modals.delete.confirm_generic', { itemName: itemName.toLowerCase() }) }}
      </p>
    </template>

    <p class="modal-warning">{{ $t('modals.delete.warning') }}</p>

    <p v-if="error" class="modal-error">
      <AlertTriangle :size="16" /> {{ error }}
    </p>

    <template #footer>
      <button class="modal-btn secondary" @click="close">{{ $t('global.cancel') }}</button>
      <button class="modal-btn danger" @click="confirmDelete" :disabled="loading">
        {{ loading ? $t('global.deleting') : $t('modals.delete.btn_confirm') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { ref, computed } from 'vue';
import { Trash2, AlertTriangle } from '@lucide/vue';
import BaseModal from './BaseModal.vue';
import { useToast } from '../../ui/useToast';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  projectsStore: any;
  itemName?: string;
}>();

const emit = defineEmits(["close", "deleted"]);

const toast = useToast();
const { t } = useI18n();
const currentProjectId = props.projectsStore.currentProjectId;
const currentProjectName = props.projectsStore.currentProjectName;
const error = props.projectsStore.error;
const itemName = computed(
  () => props.itemName || t('global.project')
);

const loading = ref(false);

function close() {
  emit("close");
}

async function confirmDelete() {
  if (!currentProjectId.value) {
    error.value = t('modals.delete.no_selection');
    return;
  }

  loading.value = true;
  error.value = null; // Limpa erros anteriores

  try {
    const success = await props.projectsStore.deleteProject(currentProjectId.value);

    if (success) {
      toast.success(t('modals.delete.success'));
      emit("deleted");
      emit("close");
    } else {
      // Se a função deleteProject não setou o error ref, definimos um padrão
      if (!error.value) error.value = t('modals.delete.error');
    }
  } catch (e: any) {
    error.value = e.message || t('global.unexpected_error');
  } finally {
    loading.value = false;
  }
}
</script>
