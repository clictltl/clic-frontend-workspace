<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { NODE_CONFIG, CREATABLE_NODES } from '../../utils/nodeConfig';
import type { NodeType } from '../../../shared/types/chatbot';

const props = defineProps<{
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: 'select', type: NodeType): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();

// Fecha se clicar fora ou rolar a tela
function onGlobalEvent() {
  emit('close');
}

onMounted(() => {
  // Pequeno delay para não capturar o próprio clique direito que abriu
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
    <div 
      class="context-menu" 
      :style="{ top: `${y}px`, left: `${x}px` }"
      @click.stop
      @contextmenu.stop.prevent
    >
      <div class="menu-header">{{ t('chatbot.editor.add_node') }}</div>
      <button 
        v-for="type in CREATABLE_NODES" 
        :key="type"
        class="menu-item"
        @click="emit('select', type)"
      >
        <component :is="NODE_CONFIG[type].icon" :size="16" :color="NODE_CONFIG[type].color" />
        <span>{{ t(NODE_CONFIG[type].titleKey) }}</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 999999;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  width: 200px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.menu-header {
  font-size: 12px;
  color: #9ca3af;
  padding: 4px 8px;
  font-weight: 600;
  text-transform: uppercase;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.15s;
}
.menu-item:hover {
  background: #f3f4f6;
}
</style>