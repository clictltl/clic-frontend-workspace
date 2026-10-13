<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Redo2, Undo2 } from '@lucide/vue';
import { useHistoryActions } from '@clic/shared';
import { useProjectStore } from '../../../shared/stores/projectStore';

/**
 * Barra flutuante do canto superior esquerdo: adicionar bloco (sem depender do clique
 * direito, que não aparece na tela nem existe no toque) e desfazer/refazer.
 */
const emit = defineEmits<{ add: [anchor: DOMRect] }>();

const { t } = useI18n();
const projectStore = useProjectStore();
const { undo, redo } = useHistoryActions(projectStore);

// A dica diz o que será desfeito/refeito, com os mesmos nomes do aviso do Ctrl+Z
const undoTitle = computed(() => projectStore.nextUndoLabel
  ? t('chatbot.editor.undo_action', { action: t(projectStore.nextUndoLabel) })
  : t('chatbot.editor.undo_none'));
const redoTitle = computed(() => projectStore.nextRedoLabel
  ? t('chatbot.editor.redo_action', { action: t(projectStore.nextRedoLabel) })
  : t('chatbot.editor.redo_none'));
</script>

<template>
  <div class="canvas-toolbar">
    <button
      type="button"
      class="toolbar-btn btn-add"
      :title="t('chatbot.editor.add_node')"
      @click="emit('add', ($event.currentTarget as HTMLElement).getBoundingClientRect())"
    >
      <Plus :size="18" :stroke-width="2.5" />
      <span class="add-label">{{ t('chatbot.editor.add_node') }}</span>
    </button>

    <div class="history-group">
      <button type="button" class="toolbar-btn" :disabled="!projectStore.canUndo" :title="undoTitle" :aria-label="undoTitle" @click="undo">
        <Undo2 :size="18" />
      </button>
      <button type="button" class="toolbar-btn" :disabled="!projectStore.canRedo" :title="redoTitle" :aria-label="redoTitle" @click="redo">
        <Redo2 :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.canvas-toolbar { position: absolute; top: 16px; left: 16px; z-index: 10; display: flex; gap: 8px; }

.btn-add, .history-group {
  background: white; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); border: 1px solid #e5e7eb;
}
.toolbar-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  min-width: 36px; height: 36px; padding: 0 8px; border: none; background: transparent;
  color: #374151; cursor: pointer; font-size: 14px; font-weight: 600;
}
.btn-add { padding: 0 14px 0 10px; color: #1d4ed8; }
.btn-add:hover { background: #eff6ff; }

.history-group { display: flex; overflow: hidden; }
.history-group .toolbar-btn + .toolbar-btn { border-left: 1px solid #e5e7eb; }
.history-group .toolbar-btn:hover:not(:disabled) { background: #f3f4f6; }
.toolbar-btn:disabled { color: #d1d5db; cursor: default; }
.toolbar-btn:focus-visible { outline: 3px solid #93c5fd; outline-offset: -3px; }

/* Telas estreitas (tablet em pé): só o "+" */
@media (max-width: 640px) {
  .add-label { display: none; }
  .btn-add { padding: 0 8px; }
}
</style>
