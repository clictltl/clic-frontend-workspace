<template>
  <BaseModal
    :title="$t('modals.need_save.title', { itemName: itemName.toLowerCase() })"
    :icon="Save"
    :description="$t('modals.need_save.description', { itemName: itemName.toLowerCase() })"
    @close="$emit('close')"
  >
    <template #footer>
      <button class="modal-btn secondary" @click="$emit('close')">{{ $t('global.cancel') }}</button>
      <button class="modal-btn primary" @click="$emit('save')">{{ $t('modals.need_save.btn_save') }}</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { computed } from 'vue';
import { Save } from '@lucide/vue';
import BaseModal from './BaseModal.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  itemName?: string;
}>();

const { t } = useI18n();

const itemName = computed(
  () => props.itemName ?? t('global.project').toLowerCase()
);

defineEmits(['close', 'save']);
</script>
