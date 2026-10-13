<template>
  <!-- Fechar (Esc, clique fora) faz o mesmo que o botão: segue com um projeto novo -->
  <BaseModal :title="$t('modals.invalid_link.title')" :icon="Unlink" tone="red" @close="$emit('close')">
    <template #description>
      <p v-html="$t('modals.invalid_link.description', { itemName: itemName.toLowerCase() })" />
    </template>

    <template #footer>
      <button class="modal-btn primary" @click="$emit('close')">
        {{ $t('modals.invalid_link.btn_create', { itemName: itemName.toLowerCase() }) }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { computed } from 'vue';
import { Unlink } from '@lucide/vue';
import BaseModal from './BaseModal.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  itemName?: string;
}>();

const { t } = useI18n();

const itemName = computed(
  () => props.itemName ?? t('global.project').toLowerCase()
);

defineEmits(['close']);
</script>
