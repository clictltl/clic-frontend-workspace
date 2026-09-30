<script setup lang="ts">
import { watch, onBeforeUnmount, ref, nextTick, onMounted } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Heading3, List, ListOrdered, Quote, Code, Link as LinkIcon, Smile, Braces, Plus, Type, Hash
} from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import type { VariableType } from '../../../../shared/types/project';

const props = withDefaults(defineProps<{
  modelValue?: string;
  variant?: 'canvas' | 'sidebar';
}>(), {
  variant: 'canvas'
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'blur': [];
}>();

const { t, locale } = useI18n();
const projectStore = useProjectStore();

// Blindagem da Variável (Nó Atômico)
const ClicVariableNode = Node.create({
  name: 'clicVariable',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      id: { default: '', parseHTML: el => el.getAttribute('data-variable') },
      name: { default: 'var', parseHTML: el => el.getAttribute('data-name') }
    };
  },
  parseHTML() { return [{ tag: 'span[data-variable]' }]; },
  renderHTML({ HTMLAttributes }) {
    // Renderiza uma pílula visual limpa no HTML
    return ['span', { 'data-variable': HTMLAttributes.id, 'data-name': HTMLAttributes.name, class: 'clic-variable' }, `{ ${HTMLAttributes.name} }`];
  },
});

// Blindagem do Emoji (Nó Atômico)
const ClicEmojiNode = Node.create({
  name: 'clicEmoji',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      emoji: {
        default: '',
        parseHTML: element => element.getAttribute('data-emoji'),
      }
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-emoji]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { 'data-emoji': HTMLAttributes.emoji, class: 'clic-emoji' }, HTMLAttributes.emoji];
  },
});

// Lógica dos Popovers (Emoji e Variáveis)
const showEmojiPicker = ref(false);
const pickerContainer = ref<HTMLElement | null>(null);
const emojiBtnRef = ref<HTMLButtonElement | null>(null);
const popoverStyle = ref({ top: '0px', right: '0px' });
let pickerInstance: any = null;

const showVarPicker = ref(false);
const varPickerContainer = ref<HTMLElement | null>(null);
const varBtnRef = ref<HTMLButtonElement | null>(null);
const varPopoverStyle = ref({ top: '0px', left: '0px' });

function updatePositions() {
  if (showEmojiPicker.value && emojiBtnRef.value) {
    const rect = emojiBtnRef.value.getBoundingClientRect();
    const rightOffset = window.innerWidth - rect.right;
    popoverStyle.value = { top: `${rect.bottom + 8}px`, right: `${rightOffset}px` };
  }
  if (showVarPicker.value && varBtnRef.value) {
    const rect = varBtnRef.value.getBoundingClientRect();
    varPopoverStyle.value = { top: `${rect.bottom + 8}px`, left: `${rect.left}px` };
  }
}

function closePopover(e: Event) {
  const target = e.target as HTMLElement;
  let didCloseSomething = false;
  
  if (showEmojiPicker.value && !pickerContainer.value?.contains(target) && !emojiBtnRef.value?.contains(target)) {
    showEmojiPicker.value = false;
    didCloseSomething = true;
  }
  
  if (showVarPicker.value && !varPickerContainer.value?.contains(target) && !varBtnRef.value?.contains(target)) {
    showVarPicker.value = false;
    didCloseSomething = true;
  }

  // Só checa se precisa fechar o editor inteiro caso o usuário tenha acabado de sair de um popover
  if (didCloseSomething) {
    setTimeout(() => {
      if (editor.value && !editor.value.isFocused) emit('blur');
    }, 0);
  }
}

function insertVariable(id: string, name: string) {
  if (!editor.value) return;
  editor.value.chain().focus().insertContent({ type: 'clicVariable', attrs: { id, name } }).run();
  emit('update:modelValue', editor.value.getHTML());
  showVarPicker.value = false;
}

const isCreatingVar = ref(false);
const newVarName = ref('');
const newVarType = ref<VariableType>('text');

function startCreateVariable() {
  isCreatingVar.value = true;
  newVarName.value = '';
  newVarType.value = 'text';
}

function confirmCreateVariable() {
  const name = newVarName.value.trim();
  if (!name) return;
  
  const existing = Object.values(projectStore.project.variables).find(v => v.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    insertVariable(existing.id, existing.name);
    isCreatingVar.value = false;
    return;
  }

  projectStore.addVariable(name, newVarType.value);
  const newVar = Object.values(projectStore.project.variables).find(v => v.name === name);
  if (newVar) insertVariable(newVar.id, newVar.name);
  isCreatingVar.value = false;
}

onMounted(() => {
  window.addEventListener('mousedown', closePopover);
  window.addEventListener('resize', updatePositions);
  window.addEventListener('scroll', closePopover, true); 
});

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', closePopover);
  window.removeEventListener('resize', updatePositions);
  window.removeEventListener('scroll', closePopover, true);
});

async function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
  if (showEmojiPicker.value) {
    updatePositions();
    if (!pickerInstance) {
      await nextTick();
      const { Picker } = await import('emoji-mart');
      const data = await import('@emoji-mart/data');
      pickerInstance = new Picker({
        data: data.default || data,
        locale: locale.value.split('-')[0], // emoji-mart usa códigos curtos ('pt', 'en')
        theme: 'light',
        onEmojiSelect: (emoji: any) => {
          if (!editor.value || editor.value.isDestroyed) return;
          editor.value.chain().focus().insertContent({
            type: 'clicEmoji',
            attrs: { emoji: emoji.native }
          }).run();
          emit('update:modelValue', editor.value.getHTML());
          showEmojiPicker.value = false;
        }
      });
      if (pickerContainer.value) {
        pickerContainer.value.appendChild(pickerInstance as any);
      }
    }
  }
}

function toggleVarPicker() {
  showVarPicker.value = !showVarPicker.value;
  showEmojiPicker.value = false;
  isCreatingVar.value = false;
  if (showVarPicker.value) nextTick(updatePositions);
}

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    ClicEmojiNode,
    ClicVariableNode,
    Link.configure({ openOnClick: false }),
  ],
  onUpdate: ({ editor }) => {
    if (editor.isDestroyed) return;
    if (editor.isFocused) {
      emit('update:modelValue', editor.getHTML());
    }
  },
  onBlur: ({ editor }) => {
    // Blindagem Suprema: Ignora a perda de foco se qualquer um dos popovers estiver aberto!
    if (editor.isDestroyed || showEmojiPicker.value || showVarPicker.value) return;
    emit('blur');
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value || editor.value.isDestroyed) return;
    if (editor.value.getHTML() !== value) {
      editor.value.commands.setContent(value || '', false);
    }
  }
);

function toggleLink() {
  if (!editor.value) return;
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run();
    return;
  }
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt(t('chatbot.editor.rich_text.link_prompt'), previousUrl);
  if (url === null) return; 
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}
</script>

<template>
  <div class="rich-text-editor" :class="`variant-${variant}`" v-if="editor">
    <!-- Toolbar Flutuante acima do nó -->
    <div class="toolbar" @mousedown.prevent @click.stop>
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"><Bold :size="14" /></button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"><Italic :size="14" /></button>
      <div class="divider"></div>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"><Heading3 :size="14" /></button>
      <div class="divider"></div>
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }"><List :size="14" /></button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }"><ListOrdered :size="14" /></button>
      <div class="divider"></div>
      <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }"><Quote :size="14" /></button>
      <button type="button" @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }"><Code :size="14" /></button>
      <div class="divider"></div>
      <button type="button" @click="toggleLink" :class="{ 'is-active': editor.isActive('link') }" :title="t('chatbot.editor.rich_text.link')"><LinkIcon :size="14" /></button>
      <button ref="emojiBtnRef" type="button" @click="toggleEmojiPicker" :class="{ 'is-active': showEmojiPicker }" :title="t('chatbot.editor.rich_text.emoji')"><Smile :size="14" /></button>
      <div class="divider"></div>
      <button ref="varBtnRef" type="button" @click="toggleVarPicker" class="btn-special" :class="{ 'is-active': showVarPicker }" :title="t('chatbot.editor.rich_text.insert_variable')"><Braces :size="14" /></button>
    </div>
    
    <EditorContent :editor="editor" class="editor-content" />
  </div>

  <Teleport to="body">
    <div v-show="showEmojiPicker" ref="pickerContainer" class="emoji-popover-teleported" :style="popoverStyle"></div>
    
    <!-- Menu de Variáveis -->
    <div v-show="showVarPicker" ref="varPickerContainer" class="var-popover-teleported" :style="varPopoverStyle">
      
      <!-- Modo Formulário -->
      <div v-if="isCreatingVar" class="var-create-inline">
        <input v-model="newVarName" type="text" :placeholder="t('chatbot.properties.variable_name')" @keyup.enter="confirmCreateVariable" class="var-input" />
        <div class="var-actions">
          <select v-model="newVarType" class="var-select">
            <option value="text">{{ t('chatbot.variables.type_text') }}</option>
            <option value="number">{{ t('chatbot.variables.type_number') }}</option>
          </select>
          <button @click="confirmCreateVariable" class="btn-confirm-var">{{ t('chatbot.editor.rich_text.confirm') }}</button>
        </div>
      </div>

      <!-- Modo Lista -->
      <template v-else>
        <button class="var-item btn-create-var" @click="startCreateVariable">
          <Plus :size="14" /> {{ t('chatbot.editor.rich_text.add_variable') }}
        </button>
        
        <div class="var-divider" v-if="Object.keys(projectStore.project.variables).length > 0"></div>
        
        <button 
          v-for="vari in projectStore.project.variables" 
          :key="vari.id"
          class="var-item"
          @click="insertVariable(vari.id, vari.name)"
        >
          <Type v-if="vari.type === 'text'" :size="14" color="#6b7280" />
          <Hash v-else :size="14" color="#6b7280" />
          {{ vari.name }}
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.rich-text-editor {
  position: relative;
  background: white;
  border-radius: 4px;
}
.toolbar {
  position: absolute;
  top: -42px; /* Flutua acima do cabeçalho do nó */
  left: 0;
  display: flex;
  gap: 2px;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.1);
  z-index: 50;
  white-space: nowrap;
}
.toolbar button {
  background: transparent; border: none; border-radius: 4px; padding: 4px;
  cursor: pointer; color: #4b5563; display: flex; align-items: center; justify-content: center;
  transition: all 0.1s;
}
.toolbar button:hover { background: #f3f4f6; color: #111827; }
.toolbar button.is-active { background: #dbeafe; color: #1d4ed8; }
/* Destaque para o botão de Variáveis */
.toolbar button.btn-special {
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
}
.toolbar button.btn-special:hover {
  background: #bfdbfe;
  color: #1e40af;
}
.toolbar button.btn-special.is-active {
  background: #3b82f6;
  color: white;
}
.divider { width: 1px; height: 16px; background: #e5e7eb; margin: 0 4px; align-self: center; }

/* Toolbar Flutuante (Canvas) */
.variant-canvas .toolbar {
  position: absolute; 
  top: -65px; /* Flutua completamente acima da barra colorida do nó */ 
  left: 0;
  box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.1);
}
/* Toolbar Embutida (Barra Lateral) */
.variant-sidebar .toolbar {
  position: relative; top: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0;
  border-bottom: none; box-shadow: none; flex-wrap: wrap; background: #f9fafb;
}
.variant-sidebar .editor-content {
  border-top-left-radius: 0; border-top-right-radius: 0;
}

.editor-content {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  min-height: 60px;
}

:deep(.tiptap) {
  padding: 8px;
  min-height: 60px;
  max-height: 200px; /* Limite seguro para o canvas */
  overflow-y: auto;
  outline: none;
  font-size: 13px;
  line-height: 1.4;
  color: #374151;
}
:deep(.tiptap p) { margin: 0 0 0.5em 0; }
:deep(.tiptap p:last-child) { margin-bottom: 0; }
:deep(.tiptap ul), :deep(.tiptap ol) { padding-left: 20px; margin: 0 0 0.5em 0; }
:deep(.tiptap blockquote) { border-left: 3px solid #d1d5db; margin: 0; padding-left: 10px; color: #6b7280; }
:deep(.tiptap a) { color: #3b82f6; text-decoration: underline; cursor: pointer; }
:deep(.tiptap code) { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; }

.emoji-popover-teleported { position: fixed; z-index: 999999; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border-radius: 10px; background: white; }
:deep(.clic-emoji) { font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif; display: inline-block; line-height: 1; }

/* Popover de Variáveis */
.var-popover-teleported {
  position: fixed; z-index: 999999;
  background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  display: flex; flex-direction: column; padding: 6px;
  min-width: 180px; max-height: 250px; overflow-y: auto;
}
.var-item {
  display: flex; align-items: center; gap: 8px;
  background: transparent; border: none; padding: 8px;
  border-radius: 4px; cursor: pointer; color: #374151;
  font-size: 13px; text-align: left; transition: background 0.1s;
}
.var-item:hover { background: #f3f4f6; }
.btn-create-var { color: #2563eb; font-weight: 500; }
.btn-create-var:hover { background: #dbeafe; }
.var-divider { height: 1px; background: #e5e7eb; margin: 4px 0; }

/* Estilo da "Pílula" (Variável injetada no texto) */
:deep(.clic-variable) {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 600;
  font-family: monospace;
  margin: 0 2px;
  box-shadow: 0 0 0 1px #bfdbfe inset;
  user-select: none;
}

/* Formulário Inline de Variáveis */
.var-create-inline { display: flex; flex-direction: column; gap: 6px; padding: 4px; }
.var-input, .var-select {
  padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; outline: none; width: 100%; box-sizing: border-box;
}
.var-input:focus, .var-select:focus { border-color: #3b82f6; }
.var-actions { display: flex; gap: 6px; }
.btn-confirm-var {
  background: #3b82f6; color: white; border: none; border-radius: 4px;
  padding: 0 12px; cursor: pointer; font-weight: 600; font-size: 12px;
}
.btn-confirm-var:hover { background: #2563eb; }
</style>