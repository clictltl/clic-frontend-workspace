<script setup lang="ts">
import { watch, onBeforeUnmount, ref, nextTick, onMounted } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Heading3, List, ListOrdered, Quote, Code, Link as LinkIcon, Smile
} from 'lucide-vue-next';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'blur':[];
}>();

// O Nó Atômico que protege o Emoji do navegador
const ClicEmojiNode = Node.create({
  name: 'clicEmoji',
  group: 'inline',
  inline: true,
  atom: true, // Blindagem ativada!
  addAttributes() {
    return {
      emoji: {
        default: '',
        parseHTML: element => element.getAttribute('data-emoji'), // Ensina o Tiptap a ler
      }
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-emoji]' }];
  },
  renderHTML({ HTMLAttributes }) {
    // Salva no JSON limpo e desenha a classe para fallback de fonte
    return['span', { 'data-emoji': HTMLAttributes.emoji, class: 'clic-emoji' }, HTMLAttributes.emoji];
  },
});

// --- LÓGICA DO EMOJI-MART (LAZY LOADING & TELEPORT) ---
const showEmojiPicker = ref(false);
const pickerContainer = ref<HTMLElement | null>(null);
const emojiBtnRef = ref<HTMLButtonElement | null>(null); // Referência do botão
const popoverStyle = ref({ top: '0px', right: '0px' });
let pickerInstance: any = null;

// Calcula a posição do popup com base no botão na tela
function updatePopoverPosition() {
  if (!emojiBtnRef.value || !showEmojiPicker.value) return;
  const rect = emojiBtnRef.value.getBoundingClientRect();
  const rightOffset = window.innerWidth - rect.right; // Distância da borda direita da tela
  
  popoverStyle.value = {
    top: `${rect.bottom + 8}px`,
    right: `${rightOffset}px`
  };
}

// Fecha o popup se o usuário clicar fora ou rolar o painel
function closePopover(e: Event) {
  if (!showEmojiPicker.value) return;
  const target = e.target as HTMLElement;
  // Se clicou dentro do picker ou no próprio botão, não faz nada
  if (pickerContainer.value?.contains(target) || emojiBtnRef.value?.contains(target)) return;
  
  showEmojiPicker.value = false;

  // Se fechou clicando fora e o editor não recuperou o foco, enviamos o blur agora!
  setTimeout(() => {
    if (editor.value && !editor.value.isFocused) {
      emit('blur');
    }
  }, 0);
}

onMounted(() => {
  window.addEventListener('mousedown', closePopover);
  window.addEventListener('resize', updatePopoverPosition);
  // O 'true' captura scrolls de qualquer painel filho (ex: PropertiesPanel)
  window.addEventListener('scroll', closePopover, true); 
});

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', closePopover);
  window.removeEventListener('resize', updatePopoverPosition);
  window.removeEventListener('scroll', closePopover, true);
});

async function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;

  if (showEmojiPicker.value) {
    updatePopoverPosition(); // Calcula imediatamente a posição ao abrir

    if (!pickerInstance) {
      await nextTick();
      const { Picker } = await import('emoji-mart');
      const data = await import('@emoji-mart/data');

      pickerInstance = new Picker({
        data: data.default || data,
        locale: 'pt',
        theme: 'light', // Força o modo claro (fundo branco)
        onEmojiSelect: (emoji: any) => {
          if (!editor.value || editor.value.isDestroyed) return;
          
          editor.value.chain().focus().insertContent({
            type: 'clicEmoji',
            attrs: { emoji: emoji.native }
          }).run();
          
          // Força a emissão para o Pinia, ignorando a trava de foco!
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

const editor = useEditor({
  content: props.modelValue || '',
  extensions:[
    StarterKit.configure({
      link: false,
    }),
    ClicEmojiNode,
    Link.configure({
      openOnClick: false,
    }),
  ],
  onUpdate: ({ editor }) => {
    if (editor.isDestroyed) return; // Evita o erro de view['dom']
    
    // BLINDAGEM DE ESTADO: O Tiptap só dita a verdade para o Pinia 
    // se a mudança foi ativamente feita pelo usuário (com o editor focado).
    if (editor.isFocused) {
      emit('update:modelValue', editor.getHTML());
    }
  },
  onBlur: ({ editor }) => {
    if (editor.isDestroyed) return;
    
    // Trava de Undo Duplo: Se o picker estiver aberto, não emite o commit!
    if (showEmojiPicker.value) return;
    
    emit('blur');
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value || editor.value.isDestroyed) return;
    
    const isSame = editor.value.getHTML() === value;
    if (!isSame) {
      editor.value.commands.setContent(value || '', { emitUpdate: false });
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
  const url = window.prompt('URL do link (inclua https://):', previousUrl);

  if (url === null) return; 

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

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

      <button ref="emojiBtnRef" type="button" @click="toggleEmojiPicker" :class="{ 'is-active': showEmojiPicker }" title="Emoji">
        <Smile :size="16" />
      </button>
    </div>
    
    <EditorContent :editor="editor" class="editor-content" />
  </div>

  <!-- Teleport: Ejeta o popover pro body, fugindo do overflow: hidden do painel -->
  <Teleport to="body">
    <div 
      v-show="showEmojiPicker" 
      ref="pickerContainer" 
      class="emoji-popover-teleported"
      :style="popoverStyle"
    ></div>
  </Teleport>
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
  color: #374151;
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

:deep(.tiptap) {
  padding: 10px;
  min-height: 80px;
  max-height: 250px;
  overflow-y: auto;
  outline: none;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  /* ESTABILIDADE: O fallback garante que o nó não será colapsado ao montar */
  font-family: inherit, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif;
}

:deep(.tiptap p) { margin: 0 0 0.5em 0; }
:deep(.tiptap p:last-child) { margin-bottom: 0; }
:deep(.tiptap ul), :deep(.tiptap ol) { padding-left: 20px; margin: 0 0 0.5em 0; }
:deep(.tiptap h3) { margin: 0 0 0.5em 0; font-size: 15px; }
:deep(.tiptap blockquote) { border-left: 3px solid #d1d5db; margin: 0; padding-left: 10px; color: #6b7280; }
:deep(.tiptap a) { color: #3b82f6; text-decoration: underline; cursor: pointer; }
:deep(.tiptap code) { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; }

/* O popover agora é fixado em relação à tela (viewport) */
.emoji-popover-teleported {
  position: fixed;
  z-index: 999999; /* Garante que fique acima do header do projeto também */
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  border-radius: 10px;
  background: white;
}

/* Garante o fallback de fonte para o nosso nó protegido, impedindo caixas vazias */
:deep(.clic-emoji) {
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif;
  display: inline-block;
  line-height: 1;
}
</style>