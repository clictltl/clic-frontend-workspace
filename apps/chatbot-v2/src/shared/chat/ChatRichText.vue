<script setup lang="ts">
import { computed } from 'vue';
import { generateHTML } from '@tiptap/core';
import type { RichText } from '../types/chatbot';
import { createRichTextExtensions } from '../richText/extensions';

// No chat as variáveis já chegam substituídas pelo motor: não há nome a resolver
const extensions = createRichTextExtensions({ variableName: () => undefined });

const props = defineProps<{ content: RichText }>();

// HTML gerado pelo schema do Tiptap (texto escapado, links perigosos removidos)
const html = computed(() => {
  try {
    return generateHTML(props.content, extensions);
  } catch (err) {
    console.warn('[Chatbot] Conteúdo de texto inválido', err);
    return '';
  }
});
</script>

<template>
  <div class="chat-rich-text" v-html="html"></div>
</template>

<style scoped>
.chat-rich-text :deep(p) { margin: 0 0 0.5em 0; }
.chat-rich-text :deep(p:last-child) { margin-bottom: 0; }
.chat-rich-text :deep(p:empty) { display: none; }
.chat-rich-text :deep(ul), .chat-rich-text :deep(ol) { padding-left: 20px; margin: 0 0 0.5em 0; }
.chat-rich-text :deep(h3) { margin: 0 0 0.5em 0; font-size: 15px; }
.chat-rich-text :deep(blockquote) { border-left: 3px solid rgba(0,0,0,0.1); margin: 0; padding-left: 10px; opacity: 0.9; }
.chat-rich-text :deep(a) { color: inherit; text-decoration: underline; font-weight: 600; }
.chat-rich-text :deep(code) { background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; }
</style>
