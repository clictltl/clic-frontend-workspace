<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, X } from '@lucide/vue';
import type { Variable } from '@/shared/types/chatbot';
import { useProjectStore } from '@/shared/stores/projectStore';

const props = defineProps<{
  variables: Record<string, Variable>;
}>();

const { t } = useI18n();
const store = useProjectStore();

const emit = defineEmits<{
  'add-variable':[name: string, type: 'string' | 'number'];
  'remove-variable': [name: string];
}>();

const newVarName = ref('');
const newVarType = ref<'string' | 'number'>('string');

function addVariable() {
  const name = newVarName.value.trim();
  if (!name) {
    alert(t('chatbot.variables.error_empty'));
    return;
  }
  if (props.variables[name]) {
    alert(t('chatbot.variables.error_exists'));
    return;
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    alert(t('chatbot.variables.error_invalid'));
    return;
  }

  emit('add-variable', name, newVarType.value);
  newVarName.value = '';
}

function removeVariable(name: string) {
  if (confirm(t('chatbot.variables.confirm_delete', { name }))) {
    emit('remove-variable', name);
  }
}

function updateVariable(name: string, value: string | number) {
  const variable = props.variables[name];
  const finalValue = variable.type === 'number' ? Number(value) : value;
  store.updateVariableValue(name, finalValue);
}
</script>

<template>
  <div class="variables-panel">
    <div class="add-variable-form">
      <h3>{{ t('chatbot.variables.title_new') }}</h3>
      <div class="form-row">
        <input
          v-model="newVarName"
          type="text"
          :placeholder="t('chatbot.variables.name_placeholder')"
          @keyup.enter="addVariable"
        />
        <select v-model="newVarType">
          <option value="string">{{ t('chatbot.variables.type_text') }}</option>
          <option value="number">{{ t('chatbot.variables.type_number') }}</option>
        </select>
        <button @click="addVariable" class="btn-add"><Plus :size="18" /></button>
      </div>
    </div>

    <div class="variables-list">
      <h3>{{ t('chatbot.variables.title_list') }}</h3>
      <div v-if="Object.keys(variables).length === 0" class="empty-state">
        <p>{{ t('chatbot.variables.empty_state') }}</p>
      </div>
      <div v-else class="variables-grid">
        <div v-for="(variable, name) in variables" :key="name" class="variable-item">
          <div class="variable-header">
            <span class="variable-name">{{ name }}</span>
            <span class="variable-type">{{ variable.type === 'string' ? t('chatbot.variables.type_text') : t('chatbot.variables.type_number') }}</span>
            <button @click="removeVariable(name)" class="btn-remove-small" :title="t('chatbot.variables.remove_title')">
              <X :size="14" />
            </button>
          </div>
          <input
            :type="variable.type === 'number' ? 'number' : 'text'"
            :value="variable.value ?? ''"
            @change="updateVariable(name, ($event.target as HTMLInputElement).value)"
            :placeholder="t('chatbot.variables.value_placeholder')"
            class="variable-value"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.variables-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.add-variable-form {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-row input {
  flex: 2;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.form-row select {
  flex: 1;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-add {
  width: 36px;
  height: 36px;
  padding: 0;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #059669;
}

.variables-list {
  flex: 1;
}

.empty-state {
  text-align: center;
  color: #6b7280;
  padding: 24px;
}

.variables-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variable-item {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.variable-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.variable-name {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  color: #374151;
  font-family: 'Courier New', monospace;
}

.variable-type {
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.btn-remove-small {
  width: 20px;
  height: 20px;
  padding: 0;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.btn-remove-small:hover {
  background: #dc2626;
}

.variable-value {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}

.variable-value:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
