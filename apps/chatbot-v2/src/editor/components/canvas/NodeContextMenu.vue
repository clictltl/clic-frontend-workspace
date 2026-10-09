<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Copy, CopyPlus, Trash2 } from '@lucide/vue';

/** Menu do clique direito num bloco: duplicar, copiar e excluir. */
defineProps<{ x: number; y: number }>();

const emit = defineEmits<{
  (e: 'duplicate'): void;
  (e: 'copy'): void;
  (e: 'delete'): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();

function onGlobalEvent() {
  emit('close');
}

onMounted(() => {
  // Pequeno atraso para não capturar o próprio clique direito que abriu o menu
  setTimeout(() => {
    window.addEventListener('click', onGlobalEvent);
    window.addEventListener('contextmenu', onGlobalEvent);
    window.addEventListener('wheel', onGlobalEvent);
  }, 10);
});

onUnmounted(() => {
  window.removeEventListener('click', onGlobalEvent);
  window.removeEventListener('contextmenu', onGlobalEvent);
  window.removeEventListener('wheel', onGlobalEvent);
});
</script>

<template>
  <Teleport to="body">
    <div class="context-menu" :style="{ top: `${y}px`, left: `${x}px` }" @click.stop @contextmenu.stop.prevent>
      <button class="menu-item" @click="emit('duplicate')">
        <CopyPlus :size="16" /> <span>{{ t('chatbot.editor.duplicate_block') }}</span>
      </button>
      <button class="menu-item" @click="emit('copy')">
        <Copy :size="16" /> <span>{{ t('chatbot.editor.copy_block') }}</span>
      </button>
      <button class="menu-item danger" @click="emit('delete')">
        <Trash2 :size="16" /> <span>{{ t('chatbot.editor.delete_block') }}</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed; z-index: 999999; width: 180px; padding: 6px;
  background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  display: flex; flex-direction: column; gap: 2px;
}
.menu-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px;
  border: none; background: transparent; border-radius: 4px; cursor: pointer;
  font-size: 14px; color: #374151; text-align: left;
}
.menu-item:hover { background: #f3f4f6; }
.menu-item.danger { color: #b91c1c; }
.menu-item.danger:hover { background: #fee2e2; }
</style>
