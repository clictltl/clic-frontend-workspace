<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon 
} from 'lucide-vue-next';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'blur':[];
}>();

const editor = useEditor({
  content: props.modelValue || '',
  extensions:[
    StarterKit,
    Link.configure({
      openOnClick: false, // Evita abrir o link acidentalmente ao clicar no editor
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
  onBlur: () => {
    emit('blur');
  },
});

// Sincroniza mudanças externas (ex: Ctrl+Z ou troca de bloco) sem bugar o cursor
watch(
  () => props.modelValue,
  (value) => {
    const isSame = editor.value?.getHTML() === value;
    if (!isSame && editor.value) {
      editor.value.commands.setContent(value || '', { emitUpdate: false }); // evita disparar onUpdate em loop
    }
  }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function toggleLink() {
  if (!editor.value) return;
  
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run();
    return;
  }

  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL do link (inclua https://):', previousUrl);

  if (url === null) return; // Usuário cancelou

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

// Expõe a função focus para o PropertiesPanel (auto-focus)
function focus() {
  editor.value?.commands.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="rich-text-editor" v-if="editor">
    <div class="toolbar" @mousedown.prevent>
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" title="Negrito">
        <Bold :size="16" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" title="Itálico">
        <Italic :size="16" />
      </button>
      
      <div class="divider"></div>
      
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" title="Título">
        <Heading3 :size="16" />
      </button>
      
      <div class="divider"></div>
      
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" title="Lista">
        <List :size="16" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" title="Lista Numerada">
        <ListOrdered :size="16" />
      </button>
      
      <div class="divider"></div>
      
      <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }" title="Citação">
        <Quote :size="16" />
      </button>
      <button type="button" @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }" title="Código">
        <Code :size="16" />
      </button>
      
      <div class="divider"></div>
      
      <button type="button" @click="toggleLink" :class="{ 'is-active': editor.isActive('link') }" title="Link">
        <LinkIcon :size="16" />
      </button>
    </div>
    
    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<style scoped>
.rich-text-editor {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  font-weight: 600;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar button:hover {
  background: #e5e7eb;
}

.toolbar button.is-active {
  background: #dbeafe;
  color: #1e3a8a;
  border-color: #bfdbfe;
}

.divider {
  width: 1px;
  height: 16px;
  background: #d1d5db;
  margin: 0 4px;
}

/* O :deep permite estilizar o conteúdo renderizado pelo Tiptap */
:deep(.tiptap) {
  padding: 10px;
  min-height: 80px;
  max-height: 250px;
  overflow-y: auto;
  outline: none;
  font-size: 13px;
  font-family: inherit;
  color: #374151;
  line-height: 1.5;
}

:deep(.tiptap p) { margin: 0 0 0.5em 0; }
:deep(.tiptap p:last-child) { margin-bottom: 0; }
:deep(.tiptap ul), :deep(.tiptap ol) { padding-left: 20px; margin: 0 0 0.5em 0; }
:deep(.tiptap h3) { margin: 0 0 0.5em 0; font-size: 15px; }
:deep(.tiptap blockquote) { border-left: 3px solid #d1d5db; margin: 0; padding-left: 10px; color: #6b7280; }
:deep(.tiptap a) { color: #3b82f6; text-decoration: underline; cursor: pointer; }
:deep(.tiptap code) { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; }
</style>