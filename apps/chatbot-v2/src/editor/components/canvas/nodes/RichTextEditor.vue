<script setup lang="ts">
import { watch, onBeforeUnmount, ref, nextTick, onMounted } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import {
  Bold, Italic, Heading3, List, ListOrdered, Quote, Code, Link as LinkIcon, Unlink, Smile, Box, Plus, Hash
} from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import type { RichText } from '../../../../shared/types/chatbot';
import { RICH_TEXT_NODES } from '../../../../shared/domain/richText';
import { findVariableByName } from '../../../../shared/domain/variables';
import { editorRichTextExtensions } from '../../../utils/richText';
import { EMOJI_PICKER_SIZE, useEmojiPicker } from '../../../utils/useEmojiPicker';
import { placePopover } from '../../../utils/popover';
import { normalizeWebUrl } from '../../../../shared/domain/media';

const props = withDefaults(defineProps<{
  modelValue: RichText;
  variant?: 'canvas' | 'sidebar';
}>(), {
  variant: 'canvas'
});

// `commit` só dispara ao terminar a edição (blur), com o documento alterado:
// um trecho digitado = uma action no store = um evento de telemetria (regra 6).
const emit = defineEmits<{
  'commit': [value: RichText];
  'blur': [];
}>();

const { t } = useI18n();
const projectStore = useProjectStore();

let lastCommitted = JSON.stringify(props.modelValue);

function commit() {
  if (!editor.value || editor.value.isDestroyed) return;
  const doc = editor.value.getJSON();
  const serialized = JSON.stringify(doc);
  if (serialized === lastCommitted) return;
  lastCommitted = serialized;
  emit('commit', doc);
}

function finishEditing() {
  commit();
  emit('blur');
}

// Registrado antes do useEditor para rodar antes de o editor ser destruído
// (ex.: nó desselecionado com o texto ainda em edição)
onBeforeUnmount(commit);

// Lógica dos Popovers (Emoji e Variáveis)
const showEmojiPicker = ref(false);
const pickerContainer = ref<HTMLElement | null>(null);
const emojiBtnRef = ref<HTMLButtonElement | null>(null);
const popoverStyle = ref({ top: '0px', left: '0px' });

const emojiPicker = useEmojiPicker(emoji => {
  if (!editor.value || editor.value.isDestroyed) return;
  editor.value.chain().focus().insertContent({ type: RICH_TEXT_NODES.emoji, attrs: { emoji } }).run();
  showEmojiPicker.value = false;
});


const showVarPicker = ref(false);
const varPickerContainer = ref<HTMLElement | null>(null);
const varBtnRef = ref<HTMLButtonElement | null>(null);
const varPopoverStyle = ref({ top: '0px', left: '0px' });

// Popover de link
const LINK_POPOVER_SIZE = { width: 280, height: 120 };
const showLinkPopover = ref(false);
const linkContainer = ref<HTMLElement | null>(null);
const linkBtnRef = ref<HTMLButtonElement | null>(null);
const linkInputRef = ref<HTMLInputElement | null>(null);
const linkPopoverStyle = ref({ top: '0px', left: '0px' });
const linkUrl = ref('');
const linkError = ref(false);
const hasLink = ref(false);

function updatePositions() {
  if (showLinkPopover.value && linkBtnRef.value) {
    linkPopoverStyle.value = placePopover(linkBtnRef.value.getBoundingClientRect(), LINK_POPOVER_SIZE);
  }
  if (showEmojiPicker.value && emojiBtnRef.value) {
    popoverStyle.value = placePopover(emojiBtnRef.value.getBoundingClientRect(), EMOJI_PICKER_SIZE);
  }
  if (showVarPicker.value && varBtnRef.value) {
    // Mede o menu já visível e encaixa na tela (no painel lateral, abre para a esquerda)
    const rect = varPickerContainer.value?.getBoundingClientRect();
    const size = { width: Math.max(rect?.width ?? 0, 180), height: rect?.height || 250 };
    varPopoverStyle.value = placePopover(varBtnRef.value.getBoundingClientRect(), size);
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

  if (showLinkPopover.value && !linkContainer.value?.contains(target) && !linkBtnRef.value?.contains(target)) {
    showLinkPopover.value = false;
    didCloseSomething = true;
  }

  // Só checa se precisa encerrar a edição caso o usuário tenha acabado de sair de um popover
  if (didCloseSomething) {
    setTimeout(() => {
      if (editor.value && !editor.value.isFocused) finishEditing();
    }, 0);
  }
}

function insertVariable(variableId: string) {
  if (!editor.value) return;
  editor.value.chain().focus().insertContent({ type: RICH_TEXT_NODES.variable, attrs: { variableId } }).run();
  showVarPicker.value = false;
}

const isCreatingVar = ref(false);
const newVarName = ref('');

function startCreateVariable() {
  isCreatingVar.value = true;
  newVarName.value = '';
  nextTick(updatePositions); // O formulário muda o tamanho do menu
}

function confirmCreateVariable() {
  const name = newVarName.value.trim();
  if (!name) return;

  // Nome já existente: reaproveita a variável em vez de criar outra
  const id = findVariableByName(projectStore.project, name)?.id ?? projectStore.addVariable(name);
  if (id) insertVariable(id);
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
    await nextTick();
    await emojiPicker.mount(pickerContainer.value);
  }
}

function toggleVarPicker() {
  showVarPicker.value = !showVarPicker.value;
  showEmojiPicker.value = false;
  showLinkPopover.value = false;
  isCreatingVar.value = false;
  if (showVarPicker.value) nextTick(updatePositions);
}

const editor = useEditor({
  content: props.modelValue,
  extensions: editorRichTextExtensions,
  // Nome para leitores de tela (o rótulo "Texto do balão" não fica ligado ao contenteditable)
  editorProps: {
    attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': t('chatbot.properties.bubble_text') }
  },
  onBlur: ({ editor }) => {
    // Ignora a perda de foco se qualquer um dos popovers estiver aberto
    if (editor.isDestroyed || showEmojiPicker.value || showVarPicker.value || showLinkPopover.value) return;
    finishEditing();
  },
});

// Mudança externa (ex.: undo com o editor aberto mas sem foco): sincroniza sem gerar commit
watch(
  () => props.modelValue,
  (value) => {
    const serialized = JSON.stringify(value);
    if (serialized === lastCommitted) return;
    lastCommitted = serialized;
    if (editor.value && !editor.value.isDestroyed && !editor.value.isFocused) {
      editor.value.commands.setContent(value, { emitUpdate: false });
    }
  }
);

/** Abre o painel de link, já com o endereço se o trecho tiver link. */
async function toggleLinkPopover() {
  if (!editor.value) return;
  showLinkPopover.value = !showLinkPopover.value;
  showEmojiPicker.value = false;
  showVarPicker.value = false;
  if (!showLinkPopover.value) return;

  hasLink.value = editor.value.isActive('link');
  linkUrl.value = editor.value.getAttributes('link').href ?? '';
  linkError.value = false;
  updatePositions();
  await nextTick();
  linkInputRef.value?.focus();
  linkInputRef.value?.select();
}

function closeLinkPopover() {
  showLinkPopover.value = false;
  editor.value?.commands.focus();
}

function applyLink() {
  if (!editor.value) return;
  const href = normalizeWebUrl(linkUrl.value);
  if (!href) {
    linkError.value = true;
    return;
  }
  const chain = editor.value.chain().focus();
  // Sem texto selecionado (e fora de um link): o próprio endereço vira o texto do link
  const { state } = editor.value;
  if (state.selection.empty && !hasLink.value) {
    // Separa da palavra anterior, se estiver grudado nela
    const { from } = state.selection;
    const before = state.doc.textBetween(Math.max(0, from - 1), from);
    const space = before && !/\s/.test(before) ? [{ type: 'text', text: ' ' }] : [];
    chain.insertContent([...space, { type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }]).run();
  } else {
    chain.extendMarkRange('link').setLink({ href }).run();
  }
  showLinkPopover.value = false;
}

function removeLink() {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
  showLinkPopover.value = false;
}
</script>

<template>
  <div class="rich-text-editor" :class="`variant-${variant}`" v-if="editor">
    <!-- Toolbar Flutuante acima do nó -->
    <div class="toolbar" @mousedown.prevent @click.stop>
      <button type="button" :title="t('chatbot.editor.rich_text.bold')" :aria-label="t('chatbot.editor.rich_text.bold')" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"><Bold :size="14" /></button>
      <button type="button" :title="t('chatbot.editor.rich_text.italic')" :aria-label="t('chatbot.editor.rich_text.italic')" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }"><Italic :size="14" /></button>
      <div class="divider"></div>
      <button type="button" :title="t('chatbot.editor.rich_text.heading')" :aria-label="t('chatbot.editor.rich_text.heading')" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"><Heading3 :size="14" /></button>
      <div class="divider"></div>
      <button type="button" :title="t('chatbot.editor.rich_text.bullet_list')" :aria-label="t('chatbot.editor.rich_text.bullet_list')" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }"><List :size="14" /></button>
      <button type="button" :title="t('chatbot.editor.rich_text.ordered_list')" :aria-label="t('chatbot.editor.rich_text.ordered_list')" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }"><ListOrdered :size="14" /></button>
      <div class="divider"></div>
      <button type="button" :title="t('chatbot.editor.rich_text.quote')" :aria-label="t('chatbot.editor.rich_text.quote')" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }"><Quote :size="14" /></button>
      <button type="button" :title="t('chatbot.editor.rich_text.code')" :aria-label="t('chatbot.editor.rich_text.code')" @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }"><Code :size="14" /></button>
      <div class="divider"></div>
      <button ref="linkBtnRef" type="button" @click="toggleLinkPopover" :class="{ 'is-active': editor.isActive('link') || showLinkPopover }" :title="t('chatbot.editor.rich_text.link')"><LinkIcon :size="14" /></button>
      <button ref="emojiBtnRef" type="button" @click="toggleEmojiPicker" :class="{ 'is-active': showEmojiPicker }" :title="t('chatbot.editor.rich_text.emoji')"><Smile :size="14" /></button>      <div class="divider"></div>
      <button ref="varBtnRef" type="button" @click="toggleVarPicker" class="btn-special" :class="{ 'is-active': showVarPicker }" :title="t('chatbot.editor.rich_text.insert_variable')"><Box :size="14" /></button>
    </div>
    
    <EditorContent :editor="editor" class="editor-content" />
  </div>

  <Teleport to="body">
    <!-- Link: endereço, aplicar e remover -->
    <div v-if="showLinkPopover" ref="linkContainer" class="link-popover-teleported" :style="linkPopoverStyle">
      <input
        ref="linkInputRef"
        v-model="linkUrl"
        type="url"
        inputmode="url"
        class="var-input"
        :class="{ 'has-error': linkError }"
        :placeholder="t('chatbot.editor.rich_text.link_placeholder')"
        @input="linkError = false"
        @keydown.enter.prevent="applyLink"
        @keydown.esc.prevent="closeLinkPopover"
      />
      <p v-if="linkError" class="link-error">{{ t('chatbot.editor.rich_text.link_invalid') }}</p>
      <div class="link-actions">
        <button v-if="hasLink" type="button" class="btn-remove-link" @click="removeLink">
          <Unlink :size="14" /> {{ t('chatbot.editor.rich_text.link_remove') }}
        </button>
        <button type="button" class="btn-confirm-var" @click="applyLink">{{ t('chatbot.editor.rich_text.link_apply') }}</button>
      </div>
    </div>

    <div v-show="showEmojiPicker" ref="pickerContainer" class="emoji-popover-teleported" :style="popoverStyle"></div>
    
    <!-- Menu de Variáveis -->
    <div v-show="showVarPicker" ref="varPickerContainer" class="var-popover-teleported" :style="varPopoverStyle">
      
      <!-- Modo Formulário -->
      <div v-if="isCreatingVar" class="var-create-inline">
        <input v-model="newVarName" type="text" :placeholder="t('chatbot.properties.variable_name')" @keyup.enter="confirmCreateVariable" class="var-input" />
        <div class="var-actions">
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
          @click="insertVariable(vari.id)"
        >
          <!-- Só as variáveis antigas do tipo número têm ícone: todas as novas são de texto -->
          <Hash v-if="vari.type === 'number'" :size="14" color="#6b7280" />
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
/* No bloco, o texto em edição tem o mesmo tamanho do texto exibido (15px) */
.variant-canvas :deep(.tiptap) { font-size: 15px; }
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

/* Formulário Inline de Variáveis */
.var-create-inline { display: flex; flex-direction: column; gap: 6px; padding: 4px; }
.var-input {
  padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; outline: none; width: 100%; box-sizing: border-box;
}
.var-input:focus { border-color: #3b82f6; }
.var-actions { display: flex; gap: 6px; }
.btn-confirm-var {
  background: #3b82f6; color: white; border: none; border-radius: 4px;
  padding: 0 12px; cursor: pointer; font-weight: 600; font-size: 12px;
}
.btn-confirm-var:hover { background: #2563eb; }

/* Popover de Link */
.link-popover-teleported {
  position: fixed; z-index: 999999; width: 280px; box-sizing: border-box;
  background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
  display: flex; flex-direction: column; gap: 8px; padding: 10px;
}
.var-input.has-error { border-color: #dc2626; }
.link-error { margin: 0; font-size: 12px; color: #dc2626; }
.link-actions { display: flex; justify-content: flex-end; gap: 6px; }
.link-actions .btn-confirm-var { padding: 6px 14px; }
.btn-remove-link {
  display: flex; align-items: center; gap: 4px; margin-right: auto;
  background: transparent; border: none; color: #b91c1c; font-size: 12px; font-weight: 600;
  cursor: pointer; padding: 6px 4px; border-radius: 4px;
}
.btn-remove-link:hover { background: #fee2e2; }
</style>