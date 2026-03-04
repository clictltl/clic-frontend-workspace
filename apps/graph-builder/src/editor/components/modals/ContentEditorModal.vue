<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import MarkdownRenderer from '@/shared/components/ui/MarkdownRenderer.vue';
import { 
  Save, X, 
  Bold, Italic, Heading, List, ListOrdered, Link, Image, Quote, 
  Columns, PanelLeft 
} from 'lucide-vue-next';

const props = defineProps<{
  nodeId: string;
  nodeTitle: string;
}>();

const emit = defineEmits(['close']);
const store = useProjectStore();

const content = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const showPreview = ref(true); // Controla se o preview aparece

onMounted(() => {
  content.value = store.getNodeContent(props.nodeId);
  nextTick(() => textareaRef.value?.focus());
});

const handleSave = () => {
  store.saveNodeContent(props.nodeId, content.value);
  emit('close');
};

// --- Lógica de Inserção de Markdown ---
const insertMarkdown = (prefix: string, suffix: string = '') => {
  const el = textareaRef.value;
  if (!el) return;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = content.value;
  const selection = text.substring(start, end);

  // Insere o texto envolvendo a seleção
  const replacement = prefix + selection + suffix;
  content.value = text.substring(0, start) + replacement + text.substring(end);

  // Recupera o foco e ajusta o cursor
  nextTick(() => {
    el.focus();
    el.selectionStart = start + prefix.length;
    el.selectionEnd = start + prefix.length + selection.length;
  });
};

// Ações da Toolbar
const actions = [
  { icon: Bold, label: 'Negrito', action: () => insertMarkdown('**', '**') },
  { icon: Italic, label: 'Itálico', action: () => insertMarkdown('*', '*') },
  { icon: Heading, label: 'Título', action: () => insertMarkdown('## ') }, // Título nível 2 padrão
  { type: 'separator' },
  { icon: List, label: 'Lista', action: () => insertMarkdown('- ') },
  { icon: ListOrdered, label: 'Numérica', action: () => insertMarkdown('1. ') },
  { type: 'separator' },
  { icon: Link, label: 'Link', action: () => insertMarkdown('[', '](url)') },
  { icon: Image, label: 'Imagem', action: () => insertMarkdown('![alt](', ')') },
  { icon: Quote, label: 'Citação', action: () => insertMarkdown('> ') },
];
</script>

<template>
  <div class="editor-backdrop">
    <div class="editor-window">
      
      <!-- HEADER & TOOLBAR -->
      <header class="editor-header">
        <div class="header-left">
          <div class="title-group">
            <span class="label">Editando:</span>
            <h2>{{ nodeTitle }}</h2>
          </div>
          
          <div class="toolbar-separator"></div>

          <!-- Toolbar de Formatação -->
          <div class="formatting-toolbar">
            <template v-for="(btn, index) in actions" :key="index">
              <div v-if="btn.type === 'separator'" class="btn-separator"></div>
              <button 
                v-else 
                class="btn-format" 
                :title="btn.label" 
                @click="btn.action"
              >
                <component :is="btn.icon" class="icon-sm" />
              </button>
            </template>
          </div>
        </div>
        
        <div class="header-right">
          <!-- Toggle Preview -->
          <button 
            class="btn-icon-only" 
            @click="showPreview = !showPreview"
            :title="showPreview ? 'Esconder Preview' : 'Mostrar Preview'"
          >
            <component :is="showPreview ? PanelLeft : Columns" class="icon-sm" />
          </button>

          <div class="toolbar-separator"></div>

          <button class="btn-save" @click="handleSave">
            <Save class="icon-sm" /> Salvar
          </button>
          <button class="btn-close" @click="emit('close')" title="Cancelar e Fechar">
            <X class="icon-sm" />
          </button>
        </div>
      </header>

      <!-- CORPO (SPLIT VIEW) -->
      <div class="editor-body">
        
        <!-- Área de Escrita -->
        <div class="pane editor-pane" :class="{ 'full-width': !showPreview }">
          <textarea 
            ref="textareaRef"
            v-model="content" 
            placeholder="# Comece a escrever aqui..."
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Área de Preview (StackEdit Style) -->
        <div v-if="showPreview" class="pane preview-pane">
          <div class="preview-content">
            <MarkdownRenderer :source="content" />
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.editor-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}

.editor-window {
  background: white;
  width: 95%; max-width: 1400px; height: 90vh;
  border-radius: 8px;
  display: flex; flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* HEADER */
.editor-header {
  height: 56px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.header-left, .header-right { display: flex; align-items: center; gap: 8px; }

.title-group { display: flex; flex-direction: column; justify-content: center; margin-right: 8px; }
.label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; line-height: 1; }
.editor-header h2 { margin: 0; font-size: 1rem; color: #334155; font-weight: 600; }

.toolbar-separator { width: 1px; height: 24px; background: #e2e8f0; margin: 0 8px; }
.btn-separator { width: 1px; height: 16px; background: #cbd5e1; margin: 0 4px; }

/* BOTÕES DA TOOLBAR */
.formatting-toolbar { display: flex; align-items: center; gap: 2px; }

.btn-format, .btn-icon-only, .btn-close {
  background: transparent; border: none; padding: 6px; border-radius: 4px;
  color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-format:hover, .btn-icon-only:hover { background: #e2e8f0; color: #1e293b; }
.btn-close:hover { background: #fee2e2; color: #ef4444; }

.btn-save {
  display: flex; align-items: center; gap: 6px;
  background: #2563eb; color: white; border: none;
  padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 500;
  cursor: pointer; transition: background 0.2s;
}
.btn-save:hover { background: #1d4ed8; }

.icon-sm { width: 18px; height: 18px; }

/* LAYOUT SPLIT */
.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden; /* Impede scroll no body, o scroll é nos panes */
}

.pane {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  display: flex; flex-direction: column;
}

/* EDITOR PANE */
.editor-pane {
  background-color: #ffffff;
  border-right: 1px solid #e2e8f0;
}
.editor-pane.full-width { border-right: none; max-width: 800px; margin: 0 auto; border-left: 1px solid #e2e8f0; }

textarea {
  flex: 1; width: 100%; height: 100%; padding: 24px;
  border: none; resize: none; outline: none;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace; /* Fonte Mono */
  font-size: 15px; line-height: 1.6; color: #334155;
}

/* PREVIEW PANE */
.preview-pane {
  background-color: #fcfcfc; /* Ligeiramente diferente para contraste */
}

.preview-content {
  padding: 24px 32px;
  max-width: 800px; /* Largura de leitura ideal */
  width: 100%;
  margin: 0 auto;
}

/* Scrollbars finas */
.pane::-webkit-scrollbar { width: 8px; }
.pane::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
.pane::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>