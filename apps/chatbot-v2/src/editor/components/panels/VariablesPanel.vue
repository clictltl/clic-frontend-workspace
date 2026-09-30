<script setup lang="ts">
import { computed, ref } from 'vue';
import { Database, Plus, Trash2, Hash, Type } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import type { VariableType } from '../../../shared/types/chatbot';
import { checkVariableName, type VariableNameError } from '../../../shared/domain/variables';
import { findVariableUsages } from '../../../shared/domain/usages';
import DraftInput from '../common/DraftInput.vue';

const { t } = useI18n();
const projectStore = useProjectStore();

const variables = computed(() => Object.values(projectStore.project.variables));

const ERROR_KEYS: Record<VariableNameError, string> = {
  EMPTY: 'chatbot.variables.error_empty',
  TAKEN: 'chatbot.variables.error_exists'
};
const error = ref<string | null>(null);

// --- CRIAÇÃO ---
const newVarName = ref('');
const newVarType = ref<VariableType>('text');

function handleAddVariable() {
  const problem = checkVariableName(projectStore.project, newVarName.value);
  if (problem) {
    error.value = ERROR_KEYS[problem];
    return;
  }
  projectStore.addVariable(newVarName.value, newVarType.value);
  newVarName.value = '';
  error.value = null;
}

// --- RENOMEAR ---
// Incrementar a chave recria o input e descarta um nome inválido digitado
const resetKeys = ref<Record<string, number>>({});

function handleRename(id: string, name: string) {
  const problem = checkVariableName(projectStore.project, name, id);
  if (problem) {
    error.value = ERROR_KEYS[problem];
    resetKeys.value[id] = (resetKeys.value[id] ?? 0) + 1;
    return;
  }
  projectStore.renameVariable(id, name);
  error.value = null;
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
  if (pendingDelete.value) projectStore.deleteVariable(pendingDelete.value.id);
  pendingDelete.value = null;
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <Database :size="20" />
      <h2>{{ t('chatbot.editor.tabs.variables') }}</h2>
    </div>

    <div class="panel-content">
      <!-- Formulário de Criação -->
      <div class="create-form">
        <input
          v-model="newVarName"
          type="text"
          :placeholder="t('chatbot.properties.variable_name')"
          @keyup.enter="handleAddVariable"
          @input="error = null"
        />
        <div class="form-row">
          <select v-model="newVarType">
            <option value="text">{{ t('chatbot.variables.type_text') }}</option>
            <option value="number">{{ t('chatbot.variables.type_number') }}</option>
          </select>
          <button class="btn-add" @click="handleAddVariable">
            <Plus :size="16" />
          </button>
        </div>
      </div>

      <p v-if="error" class="error-message">{{ t(error) }}</p>

      <hr class="divider" />

      <!-- Lista de Variáveis -->
      <div class="var-list" v-if="variables.length > 0">
        <div v-for="vari in variables" :key="vari.id" class="var-item">
          <div class="var-row">
            <Type v-if="vari.type === 'text'" :size="14" class="icon-type" />
            <Hash v-else :size="14" class="icon-type" />
            <DraftInput
              :key="`${vari.id}-${resetKeys[vari.id] ?? 0}`"
              class="var-name"
              :model-value="vari.name"
              @commit="name => handleRename(vari.id, name)"
            />
            <button class="btn-delete" @click="requestDelete(vari.id)" :title="t('chatbot.variables.remove_title')">
              <Trash2 :size="14" />
            </button>
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

      <div v-else class="empty-state">
        {{ t('chatbot.variables.empty_state') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }
.panel-header {
  display: flex; align-items: center; gap: 8px;
  padding: 16px; border-bottom: 1px solid #e5e7eb;
  background: #f9fafb; color: #374151;
}
.panel-header h2 { margin: 0; font-size: 16px; font-weight: 600; }
.panel-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

.create-form { display: flex; flex-direction: column; gap: 8px; }
input, select {
  padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;
}
.form-row { display: flex; gap: 8px; }
.form-row select { flex: 1; }
.btn-add {
  background: #3b82f6; color: white; border: none; border-radius: 4px;
  padding: 0 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.btn-add:hover { background: #2563eb; }
.error-message { margin: -8px 0 0 0; font-size: 12px; color: #dc2626; }

.divider { border: none; border-top: 1px solid #e5e7eb; margin: 0; }

.var-list { display: flex; flex-direction: column; gap: 8px; }
.var-item { background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb; }
.var-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; }
.icon-type { color: #6b7280; flex: 0 0 auto; }
.var-name {
  flex: 1; min-width: 0; font-size: 14px; font-weight: 500; color: #374151;
  background: transparent; border: 1px solid transparent; padding: 4px 6px;
}
.var-name:hover { border-color: #d1d5db; background: white; }
.var-name:focus { border-color: #3b82f6; background: white; outline: none; }
.btn-delete {
  background: transparent; border: none; color: #ef4444; cursor: pointer;
  padding: 4px; border-radius: 4px; display: flex; align-items: center;
}
.btn-delete:hover { background: #fee2e2; }

.confirm-delete {
  display: flex; flex-direction: column; gap: 8px;
  padding: 8px; border-top: 1px solid #fca5a5; background: #fef2f2;
  font-size: 12px; color: #991b1b; border-radius: 0 0 6px 6px;
}
.confirm-actions { display: flex; justify-content: flex-end; gap: 6px; }
.btn-cancel, .btn-danger { border: none; border-radius: 4px; padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-cancel { background: white; color: #374151; border: 1px solid #d1d5db; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }

.empty-state { text-align: center; color: #9ca3af; font-size: 14px; padding: 20px 0; }
</style>
