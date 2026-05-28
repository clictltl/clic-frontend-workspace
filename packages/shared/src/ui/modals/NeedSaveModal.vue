<template>
  <div class="modal-backdrop">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="modal-card">
      <div class="icon-container">
        <Save :size="24" color="#2563eb" />
      </div>
      
      <h3>{{ $t('modals.need_save.title', { itemName }) }}</h3>
      
      <p>
        {{ $t('modals.need_save.description', { itemName }) }}
      </p>

      <div class="modal-actions">
        <button class="btn-cancel" @click="$emit('close')">{{ $t('global.cancel') }}</button>
        <button class="btn-confirm" @click="$emit('save')">{{ $t('modals.need_save.btn_save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Save } from '@lucide/vue';
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

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); }
.modal-card { position: relative; background: white; width: 100%; max-width: 380px; padding: 1.5rem; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s ease-out; text-align: center; }

.icon-container { background: #eff6ff; color: #2563eb; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; }
.icon { font-size: 24px; }

h3 { margin: 0 0 0.5rem 0; color: #111827; font-size: 1.2rem; }
p { margin: 0 0 1.5rem 0; color: #6b7280; font-size: 0.95rem; line-height: 1.5; }

.modal-actions { display: flex; justify-content: center; gap: 10px; }

.btn-cancel { background: white; border: 1px solid #d1d5db; color: #374151; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; }
.btn-cancel:hover { background: #f9fafb; }

.btn-confirm { background: #2563eb; border: none; color: white; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; }
.btn-confirm:hover { background: #1d4ed8; }

@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>