<script setup lang="ts">
import { computed } from 'vue';
import { generateHTML } from '@tiptap/core';
import { useI18n } from 'vue-i18n';
import type { RichText } from '../../../../shared/types/chatbot';
import { isRichTextEmpty } from '../../../../shared/domain/richText';
import { editorRichTextExtensions } from '../../../utils/richText';

const props = defineProps<{ content: RichText }>();
const { t } = useI18n();

// O HTML é gerado pelo schema do Tiptap (texto escapado, atributos filtrados e links
// perigosos removidos), então é seguro no v-html mesmo com JSON vindo de terceiros.
const html = computed(() => {
  if (isRichTextEmpty(props.content)) return null;
  try {
    return generateHTML(props.content, editorRichTextExtensions);
  } catch (err) {
    console.warn('[Chatbot] Conteúdo de texto inválido', err);
    return null;
  }
});
</script>

<template>
  <div v-if="html" class="rich-text-view" v-html="html"></div>
  <p v-else class="rich-text-empty">({{ t('chatbot.editor.no_content') }})</p>
</template>

<style scoped>
.rich-text-view :deep(p) { margin: 0 0 0.5em 0; }
.rich-text-view :deep(p:last-child) { margin-bottom: 0; }
.rich-text-view :deep(h3) { font-size: 1.1em; margin: 0 0 0.5em 0; }
.rich-text-view :deep(ul), .rich-text-view :deep(ol) { padding-left: 20px; margin: 0 0 0.5em 0; }
.rich-text-view :deep(blockquote) { border-left: 3px solid #d1d5db; margin: 0; padding-left: 10px; color: #6b7280; }
.rich-text-view :deep(a) { color: #3b82f6; text-decoration: underline; }
.rich-text-view :deep(code) { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; }
.rich-text-empty { margin: 0; color: #9ca3af; font-style: italic; }
</style>
