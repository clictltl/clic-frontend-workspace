<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, ChevronRight, CircleDashed, Crosshair, Database, Hash, Pencil, Plus, Trash2 } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { checkVariableName, type VariableNameError } from '../../../shared/domain/variables';
import { findVariableUsages } from '../../../shared/domain/usages';
import { clearHighlight, highlightBlocks, highlightedVariableId } from '../../utils/highlight';
import DraftInput from '../common/DraftInput.vue';
import PanelSection from '../common/PanelSection.vue';

const { t } = useI18n();
const projectStore = useProjectStore();

const variables = computed(() => Object.values(projectStore.project.variables).map(v => ({
  ...v,
  usages: findVariableUsages(projectStore.project, v.id)
})));

const ERROR_KEYS: Record<VariableNameError, string> = {
  EMPTY: 'chatbot.variables.error_empty',
  TAKEN: 'chatbot.variables.error_exists'
};
const error = ref<string | null>(null);

// --- CRIAÇÃO ---
const newVarName = ref('');

function handleAddVariable() {
  const problem = checkVariableName(projectStore.project, newVarName.value);
  if (problem) {
    error.value = ERROR_KEYS[problem];
    return;
  }
  projectStore.addVariable(newVarName.value);
  newVarName.value = '';
  error.value = null;
}

// --- RENOMEAR ---
// Nome inválido: o DraftInput volta sozinho para o nome atual
function handleRename(id: string, name: string) {
  const problem = checkVariableName(projectStore.project, name, id);
  if (problem) {
    error.value = ERROR_KEYS[problem];
    return;
  }
  projectStore.renameVariable(id, name);
  error.value = null;
}

// --- VALOR INICIAL (escondido até expandir: quase ninguém precisa) ---
const expanded = ref(new Set<string>());
function toggleExpanded(id: string) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

// --- ONDE É USADA: destaca os blocos no canvas (clicar de novo desliga) ---
function toggleUsages(id: string, usages: string[]) {
  if (highlightedVariableId.value === id) clearHighlight();
  else highlightBlocks(id, usages);
}

// --- EXCLUSÃO (confirma se estiver em uso) ---
const pendingDelete = ref<{ id: string; usages: number } | null>(null);

function requestDelete(id: string) {
  const usages = findVariableUsages(projectStore.project, id).length;
  if (usages === 0) {
    projectStore.deleteVariable(id);
    return;
  }
  pendingDelete.value = { id, usages };
}

function confirmDelete() {
  if (pendingDelete.value) {
    if (highlightedVariableId.value === pendingDelete.value.id) clearHighlight();
    projectStore.deleteVariable(pendingDelete.value.id);
  }
  pendingDelete.value = null;
}
</script>

<template>
  <div class="panel-content properties">
    <PanelSection :icon="Plus" :title="t('chatbot.variables.section_create')">
      <div class="create-form">
        <input
          v-model="newVarName"
          type="text"
          :placeholder="t('chatbot.properties.variable_name')"
          :aria-label="t('chatbot.properties.variable_name')"
          @keyup.enter="handleAddVariable"
          @input="error = null"
        />
        <button class="btn-add" :title="t('chatbot.properties.create_variable')" :aria-label="t('chatbot.properties.create_variable')" @click="handleAddVariable">
          <Plus :size="16" />
        </button>
      </div>
      <p v-if="error" class="error-message">{{ t(error) }}</p>
      <p class="section-hint">{{ t('chatbot.variables.what_is') }}</p>
    </PanelSection>

    <PanelSection :icon="Database" :title="t('chatbot.variables.section_list')">
      <div v-if="variables.length > 0" class="var-list">
        <div v-for="vari in variables" :key="vari.id" class="var-item" :class="{ 'is-highlighted': highlightedVariableId === vari.id }">
          <div class="var-row">
            <button
              type="button"
              class="btn-icon"
              :aria-expanded="expanded.has(vari.id)"
              :title="t('chatbot.variables.show_details')"
              :aria-label="t('chatbot.variables.show_details')"
              @click="toggleExpanded(vari.id)"
            >
              <ChevronDown v-if="expanded.has(vari.id)" :size="16" />
              <ChevronRight v-else :size="16" />
            </button>
            <!-- Só as variáveis antigas do tipo número têm ícone: todas as novas são de texto -->
            <Hash v-if="vari.type === 'number'" :size="14" class="icon-type" :aria-label="t('chatbot.variables.type_number')" />
            <label class="var-name-field">
              <DraftInput
                class="var-name"
                :model-value="vari.name"
                :aria-label="t('chatbot.properties.variable_name')"
                @commit="name => handleRename(vari.id, name)"
              />
              <Pencil :size="12" class="edit-hint" aria-hidden="true" />
            </label>
            <button class="btn-icon danger" :title="t('chatbot.variables.remove_title')" :aria-label="t('chatbot.variables.remove_title')" @click="requestDelete(vari.id)">
              <Trash2 :size="14" />
            </button>
          </div>

          <!-- Onde é usada: um clique destaca esses blocos no canvas -->
          <button
            type="button"
            class="usage-chip"
            :class="{ active: highlightedVariableId === vari.id, unused: vari.usages.length === 0 }"
            :disabled="vari.usages.length === 0"
            :aria-pressed="highlightedVariableId === vari.id"
            :title="vari.usages.length ? t('chatbot.variables.usages_hint') : undefined"
            @click="toggleUsages(vari.id, vari.usages)"
          >
            <template v-if="vari.usages.length">
              <Crosshair :size="12" aria-hidden="true" />
              {{ t('chatbot.variables.usages', { n: vari.usages.length }, vari.usages.length) }}
            </template>
            <template v-else>
              <CircleDashed :size="12" aria-hidden="true" />
              {{ t('chatbot.variables.unused') }}
            </template>
          </button>

          <div v-if="expanded.has(vari.id)" class="var-default">
            <span>{{ t('chatbot.variables.default_value') }}</span>
            <DraftInput
              :type="vari.type === 'number' ? 'number' : 'text'"
              :model-value="vari.defaultValue"
              :placeholder="vari.type === 'number' ? '0' : t('chatbot.variables.default_empty')"
              :aria-label="t('chatbot.variables.default_value')"
              @commit="value => projectStore.setVariableDefault(vari.id, value)"
            />
            <p class="section-hint">{{ t('chatbot.variables.default_hint') }}</p>
          </div>

          <div v-if="pendingDelete?.id === vari.id" class="confirm-delete">
            <span>{{ t('chatbot.variables.used_in', { n: pendingDelete.usages }, pendingDelete.usages) }}</span>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="pendingDelete = null">{{ t('global.cancel') }}</button>
              <button class="btn-danger" @click="confirmDelete">{{ t('global.delete') }}</button>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="section-hint empty-state">{{ t('chatbot.variables.empty_state') }}</p>
    </PanelSection>
  </div>
</template>

<style scoped>
.panel-content { padding: 12px; gap: 12px; background: #f3f4f6; flex: 1; }

.create-form { display: flex; gap: 8px; }
.create-form input { flex: 1; min-width: 0; padding: 8px; font-size: 14px; }
.btn-add {
  background: #3b82f6; color: white; border: none; border-radius: 4px;
  padding: 0 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.btn-add:hover { background: #2563eb; }
.error-message { margin: 0; font-size: 12px; color: #dc2626; }

.var-list { display: flex; flex-direction: column; gap: 8px; }
.var-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 4px; }
.var-item.is-highlighted { border-color: #f59e0b; box-shadow: 0 0 0 2px #fde68a; }
.var-row { display: flex; align-items: center; gap: 4px; }
.icon-type { color: #6b7280; flex: 0 0 auto; }

/* Nome editável: parece texto, mas mostra contorno e lápis ao passar o mouse */
.var-name-field { flex: 1; min-width: 0; position: relative; display: flex; align-items: center; }
.properties .var-name {
  flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: #1f2937;
  background: transparent; border: 1px solid transparent; padding: 4px 22px 4px 6px;
}
.properties .var-name:hover { border-color: #d1d5db; background: white; }
.properties .var-name:focus { border-color: #3b82f6; background: white; }
.edit-hint { position: absolute; right: 6px; color: #9ca3af; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
.var-name-field:hover .edit-hint, .var-name-field:focus-within .edit-hint { opacity: 1; }

/* Usada: etiqueta azul preenchida e clicável. Não usada: contorno tracejado, sem cara de botão
   (não é erro, só outro estado). Destacando no canvas: âmbar, como o contorno dos blocos. */
.usage-chip {
  align-self: flex-start; margin-left: 30px; display: inline-flex; align-items: center; gap: 4px;
  border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 999px;
  padding: 2px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.usage-chip:hover:not(:disabled) { background: #dbeafe; }
.usage-chip.active { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
.usage-chip.unused {
  background: transparent; border: 1px dashed #9ca3af; color: #4b5563;
  font-weight: 400; font-style: italic; cursor: default;
}

.var-default { margin-left: 30px; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #4b5563; }
.var-default input { padding: 6px; font-size: 13px; }

.confirm-delete {
  display: flex; flex-direction: column; gap: 8px; margin-top: 4px;
  padding: 8px; border: 1px solid #fca5a5; background: #fef2f2;
  font-size: 12px; color: #991b1b; border-radius: 6px;
}
.confirm-actions { display: flex; justify-content: flex-end; gap: 6px; }
.btn-cancel, .btn-danger { border: none; border-radius: 4px; padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-cancel { background: white; color: #374151; border: 1px solid #d1d5db; }
.btn-danger { background: #dc2626; color: white; }
.btn-danger:hover { background: #b91c1c; }

.empty-state { text-align: center; padding: 8px 0; }
</style>
