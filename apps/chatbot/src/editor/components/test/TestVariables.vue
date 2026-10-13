<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Box, ChevronDown } from '@lucide/vue';
import { useProjectStore } from '../../../shared/stores/projectStore';
import type { ChatValues } from '../../../shared/engine/types';

/**
 * Valores das variáveis durante o teste: ajuda a investigar por que uma condição deu certo
 * ou errado. Só no editor; os valores seguem o ritmo das mensagens (ver useChatSession).
 */
const props = defineProps<{ values: ChatValues | null }>();
const { t } = useI18n();
const projectStore = useProjectStore();

// Aberto/fechado é conveniência de cada pessoa: fica no navegador
const STORAGE_KEY = 'clic-chatbot-test-variables-open';
function readOpen(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== '0'; } catch { return true; }
}
const isOpen = ref(readOpen());
function toggle() {
  isOpen.value = !isOpen.value;
  try { localStorage.setItem(STORAGE_KEY, isOpen.value ? '1' : '0'); } catch { /* sem armazenamento */ }
}

// Antes de começar (ou variável criada durante o teste): o valor inicial
const rows = computed(() => Object.values(projectStore.project.variables).map(variable => ({
  id: variable.id,
  name: variable.name,
  value: String(props.values?.[variable.id] ?? variable.defaultValue)
})));

// Destaque de ~1,5s na linha cujo valor acabou de mudar
const changed = ref<Set<string>>(new Set());
const timers = new Map<string, ReturnType<typeof setTimeout>>();
watch(() => props.values, (next, prev) => {
  if (!next || !prev) return;
  for (const [id, value] of Object.entries(next)) {
    if (prev[id] === value) continue;
    clearTimeout(timers.get(id));
    changed.value = new Set(changed.value).add(id);
    timers.set(id, setTimeout(() => {
      const rest = new Set(changed.value);
      rest.delete(id);
      changed.value = rest;
    }, 1500));
  }
});
onBeforeUnmount(() => timers.forEach(clearTimeout));
</script>

<template>
  <section v-if="rows.length" class="test-variables">
    <button
      type="button"
      class="toggle"
      :aria-expanded="isOpen"
      :title="t('chatbot.editor.test.toggle_variables')"
      @click="toggle"
    >
      <Box :size="14" aria-hidden="true" />
      <span class="toggle-label">{{ t('chatbot.editor.test.variables') }} ({{ rows.length }})</span>
      <ChevronDown :size="14" class="chevron" :class="{ open: isOpen }" aria-hidden="true" />
    </button>
    <ul v-if="isOpen" class="rows">
      <li v-for="row in rows" :key="row.id" class="row" :class="{ changed: changed.has(row.id) }">
        <span class="var-pill">{{ row.name }}</span>
        <span v-if="row.value !== ''" class="value" :title="row.value">{{ row.value }}</span>
        <span v-else class="value empty">{{ t('chatbot.editor.test.empty_value') }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.test-variables { background: #f3f4f6; border-bottom: 1px solid #e5e7eb; }
.toggle {
  width: 100%; display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  background: transparent; border: none; cursor: pointer; color: #374151; font-size: 13px; font-weight: 600;
}
.toggle:hover { background: #e5e7eb; }
.toggle:focus-visible { outline: 3px solid #93c5fd; outline-offset: -3px; }
.toggle-label { flex: 1; text-align: left; }
.chevron { transition: transform 0.2s; }
.chevron.open { transform: rotate(180deg); }
.rows { list-style: none; margin: 0; padding: 0 8px 8px; max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.row {
  display: flex; align-items: center; gap: 8px; padding: 3px 6px; border-radius: 6px; min-width: 0;
  transition: background-color 0.6s;
}
.row.changed { background: #fde68a; transition: none; }
.row .var-pill { flex: 0 0 auto; font-size: 12px; }
.value { min-width: 0; flex: 1; font-size: 13px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.value.empty { color: #6b7280; font-style: italic; }

@media (prefers-reduced-motion: reduce) {
  .row, .chevron { transition: none; }
}
</style>
