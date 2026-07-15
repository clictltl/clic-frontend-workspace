<template>
  <div 
    class="workspace-layout" 
    :class="{ 'is-preview': isPreview }"
    :style="{ '--logic-w': logicWidth + '%' }"
  >
    
    <!-- Painel Esquerdo: Lógica -->
    <div class="panel-logic" v-show="!isPreview">
      <BlockEditor />
    </div>

    <!-- O Divisor Arrastável -->
    <div 
      class="resizer" 
      v-show="!isPreview" 
      @mousedown="startDrag"
      :title="t('emojiCoder.workspace.drag_resize')"
    ></div>

    <!-- Painel Direito: Execução -->
    <div class="panel-execution">
      <ExecutionPanel 
        :is-preview="isPreview" 
        @toggle-preview="$emit('toggle-preview')" 
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BlockEditor from './BlockEditor.vue';
import ExecutionPanel from './ExecutionPanel.vue';

const { t } = useI18n();

defineProps<{ isPreview?: boolean }>();
defineEmits(['toggle-preview']);

// Controle da largura dos painéis (60% para blocos por padrão)
const logicWidth = ref(60);
let isDragging = false;

const startDrag = () => {
  isDragging = true;
  document.body.style.cursor = 'col-resize';
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging) return;
  const newWidth = (e.clientX / window.innerWidth) * 100;
  if (newWidth > 20 && newWidth < 80) {
    logicWidth.value = newWidth;
    
    // Avisa o Blockly (e outros componentes na tela) que a área disponível mudou!
    window.dispatchEvent(new Event('resize'));
  }
};

const stopDrag = () => {
  isDragging = false;
  document.body.style.cursor = '';
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};
</script>

<style scoped>
.workspace-layout {
  display: flex; width: 100%; height: 100%; overflow: hidden; background-color: #f9fafb;
}

/* No Desktop, a largura é controlada pela variável reativa do Vue */
.panel-logic { width: var(--logic-w); height: 100%; min-width: 0; }
.panel-execution { width: calc(100% - var(--logic-w) - 6px); height: 100%; min-width: 0; }

/* Modo Visualização esconde a lógica e o Canvas toma 100% */
.workspace-layout.is-preview .panel-execution { width: 100%; }

/* A Barra Arrastável */
.resizer {
  width: 6px;
  background-color: #e5e7eb;
  cursor: col-resize;
  transition: background-color 0.2s;
  z-index: 10;
}
.resizer:hover, .resizer:active { background-color: #3b82f6; }

.workspace-layout.is-preview { justify-content: center; }

/* --- SUPORTE A MOBILE E TABLET (APENAS TELA EM PÉ) --- */
@media (max-width: 768px) and (orientation: portrait) {
  .workspace-layout { flex-direction: column; }
  
  /* Anulamos a largura do Desktop com !important e dividimos o espaço na ALTURA */
  .panel-logic, .panel-execution { width: 100% !important; }
  
  .panel-execution { height: 45%; border-bottom: 2px solid #e5e7eb; order: -1; }
  .panel-logic { height: 55%; }
  
  /* Esconde o resizer no celular em pé */
  .resizer { display: none; }
}
</style>