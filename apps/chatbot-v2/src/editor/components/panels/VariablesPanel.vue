<script setup lang="ts">
import { ref } from 'vue';
import { Database, Plus, Trash2, Hash, Type } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import type { VariableType } from '../../../shared/types/project';

const { t } = useI18n();
const projectStore = useProjectStore();

const newVarName = ref('');
const newVarType = ref<VariableType>('text');

function handleAddVariable() {
  const name = newVarName.value.trim();
  if (!name) return;
  
  // Opcional: validação para não ter variáveis com o mesmo nome
  const exists = Object.values(projectStore.project.variables).some(v => v.name === name);
  if (exists) {
    alert(t('chatbot.variables.error_exists'));
    return;
  }

  projectStore.addVariable(name, newVarType.value);
  newVarName.value = '';
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

      <hr class="divider" />

      <!-- Lista de Variáveis -->
      <div class="var-list" v-if="Object.keys(projectStore.project.variables).length > 0">
        <div 
          v-for="vari in projectStore.project.variables" 
          :key="vari.id" 
          class="var-item"
        >
          <div class="var-info">
            <Type v-if="vari.type === 'text'" :size="14" class="icon-type" />
            <Hash v-else :size="14" class="icon-type" />
            <span class="var-name">{{ vari.name }}</span>
          </div>
          <button class="btn-delete" @click="projectStore.deleteVariable(vari.id)" :title="t('chatbot.variables.remove_title')">
            <Trash2 :size="14" />
          </button>
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

.divider { border: none; border-top: 1px solid #e5e7eb; margin: 0; }

.var-list { display: flex; flex-direction: column; gap: 8px; }
.var-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;
}
.var-info { display: flex; align-items: center; gap: 6px; }
.var-name { font-size: 14px; font-weight: 500; color: #374151; }
.icon-type { color: #6b7280; }
.btn-delete {
  background: transparent; border: none; color: #ef4444; cursor: pointer;
  padding: 4px; border-radius: 4px; display: flex; align-items: center;
}
.btn-delete:hover { background: #fee2e2; }

.empty-state { text-align: center; color: #9ca3af; font-size: 14px; padding: 20px 0; }
</style>