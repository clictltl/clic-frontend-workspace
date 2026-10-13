<template>
  <!-- Fechar (Esc, clique fora) = Cancelar: volta ao editor sem perder nada -->
  <BaseModal
    :title="isOffline ? $t('modals.unsaved.title_export') : $t('modals.unsaved.title_save')"
    :icon="AlertTriangle"
    tone="amber"
    :description="isOffline ? $t('modals.unsaved.desc_export') : $t('modals.unsaved.desc_discard')"
    @close="$emit('cancel')"
  >
    <!-- Descartar isolado à esquerda, longe do Salvar: um toque errado não apaga o trabalho -->
    <template #footer-start>
      <button class="modal-btn danger-outline" @click="$emit('discard')">{{ $t('modals.unsaved.btn_discard') }}</button>
    </template>

    <template #footer>
      <button class="modal-btn secondary" @click="$emit('cancel')">{{ $t('global.cancel') }}</button>
      <button class="modal-btn primary" @click="$emit('save')">
        {{ isOffline ? $t('modals.unsaved.btn_export') : $t('global.save') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { AlertTriangle } from '@lucide/vue';
import BaseModal from './BaseModal.vue';

defineProps<{
  isOffline?: boolean;
}>();

defineEmits(['cancel', 'discard', 'save']);
</script>
