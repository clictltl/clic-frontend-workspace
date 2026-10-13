<template>
  <!--
    Confirmação de uma ação destrutiva, no lugar do confirm() do navegador.
    Abre por cima do modal de origem; Esc e clique fora = Cancelar (só o modal de cima responde).
    O foco começa no Cancelar: um Enter sem querer não confirma a ação.
  -->
  <BaseModal :title="title" :icon="icon" tone="red" :description="description" @close="$emit('cancel')">
    <template #footer>
      <button ref="cancelRef" class="modal-btn secondary" @click="$emit('cancel')">{{ $t('global.cancel') }}</button>
      <button class="modal-btn danger" @click="$emit('confirm')">{{ confirmLabel }}</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, onMounted, type Component } from 'vue';
import BaseModal from './BaseModal.vue';

defineProps<{
  title: string;
  description?: string;
  confirmLabel: string;
  icon?: Component;
}>();

defineEmits<{ confirm: []; cancel: [] }>();

const cancelRef = ref<HTMLButtonElement | null>(null);
onMounted(() => cancelRef.value?.focus());
</script>
