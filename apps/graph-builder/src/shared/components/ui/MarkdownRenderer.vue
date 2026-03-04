<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps<{
  source: string;
}>();

// Configuração do Parser
const md = new MarkdownIt({
  html: false,        // Desabilita HTML cru por segurança (XSS)
  linkify: true,      // Transforma URLs em links automaticamente
  breaks: true,       // Enter vira <br> (comportamento esperado por leigos)
  typographer: true   // Melhora aspas e traços
});

const renderedContent = computed(() => {
  return md.render(props.source || '');
});
</script>

<template>
  <!-- v-html injeta o HTML gerado pelo parser -->
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<style>
/* Estilos Globais para o conteúdo gerado pelo Markdown */
/* Não usamos 'scoped' aqui porque o v-html injeta elementos sem o data-v-id */

.markdown-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #334155;
  line-height: 1.7;
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3 {
  color: #1e293b;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 700;
}

.markdown-content h1 { font-size: 1.8em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
.markdown-content h2 { font-size: 1.5em; }
.markdown-content h3 { font-size: 1.25em; }

.markdown-content p { margin-bottom: 1em; }

.markdown-content ul, 
.markdown-content ol {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.markdown-content li { margin-bottom: 0.3em; }

.markdown-content a {
  color: #2563eb;
  text-decoration: none;
}
.markdown-content a:hover { text-decoration: underline; }

.markdown-content blockquote {
  border-left: 4px solid #cbd5e1;
  padding-left: 1em;
  margin-left: 0;
  color: #64748b;
  font-style: italic;
}

.markdown-content code {
  background-color: #f1f5f9;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
  color: #be185d;
}

.markdown-content pre {
  background-color: #1e293b;
  color: #f8fafc;
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
}
.markdown-content pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

.markdown-content img {
  max-width: 100%;
  border-radius: 8px;
  margin: 1em 0;
}
</style>