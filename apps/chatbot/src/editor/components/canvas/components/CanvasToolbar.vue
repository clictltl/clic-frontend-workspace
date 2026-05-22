<script setup lang="ts">
/**
 * TOOLBAR DO CANVAS
 * 
 * Menu "Novo Bloco" e controles de zoom (+/-)
 */

import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { BlockType } from '@/shared/types/chatbot';
import { BLOCK_CONFIG, CREATABLE_BLOCKS } from '@/editor/utils/blockConfig';
import { Plus } from 'lucide-vue-next';

const emit = defineEmits<{
  'create-block': [type: BlockType];
  'zoom-in': [];
  'zoom-out': [];
}>();

const showMenu = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function createBlock(type: BlockType) {
  emit('create-block', type);
  showMenu.value = false;
}

function handleDocumentClick(event: MouseEvent) {
  if (!showMenu.value) return;

  const target = event.target as HTMLElement;
  if (menuRef.value && !menuRef.value.contains(target)) {
    showMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div class="canvas-toolbar" @click.stop>
    <button class="btn-newblock" @click="toggleMenu">
      <Plus :size="16" />
      Novo Bloco
    </button>

    <div v-if="showMenu" class="canvas-block-menu" ref="menuRef">
      <button 
        v-for="type in CREATABLE_BLOCKS" 
        :key="type"
        @click="createBlock(type)" 
        class="canvas-block-menu-item"
      >
        <!-- Ícone Lucide encapsulado na cor de fundo -->
        <span class="menu-icon" :style="{ background: BLOCK_CONFIG[type].color }">
          <component :is="BLOCK_CONFIG[type].icon" :size="16" color="#ffffff" />
        </span>
        <span class="menu-label">{{ BLOCK_CONFIG[type].title }}</span>
      </button>
    </div>
  </div>

  <!-- Controles de zoom no canto direito inferior -->
  <div class="canvas-zoom-controls" @click.stop>
    <button class="zoom-btn" @click="emit('zoom-in')">+</button>
    <button class="zoom-btn" @click="emit('zoom-out')">−</button>
  </div>
</template>

<style scoped>
.canvas-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1200;
  pointer-events: auto;
}

.btn-newblock {
  padding: 8px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-newblock:hover {
  background: #2563eb;
}

.canvas-block-menu {
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.12);
  padding: 8px;
  width: 200px;
  max-width: 240px;
}

.canvas-block-menu-item {
  width: 100%;
  padding: 10px 12px;
  background: white;
  border: none;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 14px;
  flex-shrink: 0;
}

.menu-label {
  line-height: 1;
}

.canvas-block-menu-item:hover {
  background: #f3f4f6;
}

.canvas-zoom-controls {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}

.zoom-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  box-shadow: 0 10px 25px rgba(0,0,0,0.12);
  line-height: 1;
}

.zoom-btn:hover {
  background: #f3f4f6;
}
</style>
