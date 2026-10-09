<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Maximize, Minus, Plus } from '@lucide/vue';
import { useVueFlow } from '@vue-flow/core';
import { FIT_VIEW_OPTIONS } from '../../utils/viewport';

/** Zoom no canto inferior direito, como no Scratch: aproximar, afastar e enquadrar todos os blocos. */
const { t } = useI18n();
const { zoomIn, zoomOut, fitView } = useVueFlow();
const DURATION = { duration: 200 };
</script>

<template>
  <div class="zoom-controls">
    <button type="button" :title="t('chatbot.editor.zoom_in')" :aria-label="t('chatbot.editor.zoom_in')" @click="zoomIn(DURATION)">
      <Plus :size="18" />
    </button>
    <button type="button" :title="t('chatbot.editor.zoom_out')" :aria-label="t('chatbot.editor.zoom_out')" @click="zoomOut(DURATION)">
      <Minus :size="18" />
    </button>
    <button type="button" :title="t('chatbot.editor.fit_view')" :aria-label="t('chatbot.editor.fit_view')" @click="fitView({ ...FIT_VIEW_OPTIONS, ...DURATION })">
      <Maximize :size="16" />
    </button>
  </div>
</template>

<style scoped>
.zoom-controls {
  position: absolute; right: 16px; bottom: 16px; z-index: 10;
  display: flex; flex-direction: column; overflow: hidden;
  background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.zoom-controls button {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #374151; cursor: pointer;
}
.zoom-controls button + button { border-top: 1px solid #e5e7eb; }
.zoom-controls button:hover { background: #f3f4f6; }
.zoom-controls button:focus-visible { outline: 3px solid #93c5fd; outline-offset: -3px; }
</style>
