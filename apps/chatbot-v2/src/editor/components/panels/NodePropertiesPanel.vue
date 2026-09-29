<script setup lang="ts">
import { computed } from 'vue';
import { ArrowLeft, Plus, Trash2 } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { NODE_CONFIG } from '../../utils/nodeConfig';
import { generateUUID } from '@clic/shared';
import RichTextEditor from '../canvas/RichTextEditor.vue';

const { t } = useI18n();
const projectStore = useProjectStore();

const activeNode = computed(() => projectStore.activeNode);
const nodeConfig = computed(() => activeNode.value ? NODE_CONFIG[activeNode.value.type] : null);
const nodeData = computed(() => activeNode.value?.data || {});
const variables = computed(() => Object.values(projectStore.project.variables));

interface SubCondition { id: string; connector: string; variableId: string; operator: string; value: string; }
interface RuleGroup { id: string; conditions: SubCondition[]; }

const choicesList = computed<any[]>(() => nodeData.value.choices || []);
const rulesList = computed<RuleGroup[]>(() => nodeData.value.rules || []);
const isConversational = computed(() => activeNode.value ? ['message', 'open_question', 'choice_question', 'end'].includes(activeNode.value.type) : false);

function closePanel() { projectStore.clearSelection(); }
function updateData(payload: Record<string, any>) { if (activeNode.value) projectStore.updateNodeData(activeNode.value.id, payload); }

// MÚLTIPLA ESCOLHA
function addChoice() {
  const choices = [...choicesList.value, { id: generateUUID(), label: `Opção ${choicesList.value.length + 1}` }];
  updateData({ choices });
}
function removeChoice(id: string) {
  if (activeNode.value) projectStore.removeEdgesByHandle(activeNode.value.id, id); // Remove conexões presas a esta opção
  const choices = choicesList.value.filter(c => c.id !== id);
  if (choices.length === 0) choices.push({ id: generateUUID(), label: 'Opção 1' });
  updateData({ choices });
}

// CONDIÇÃO AVANÇADA (E / OU)
function addRuleGroup() {
  const rules = [...rulesList.value, { id: generateUUID(), conditions: [{ id: generateUUID(), connector: 'AND', variableId: '', operator: '==', value: '' }] }];
  updateData({ rules });
}
function removeRuleGroup(id: string) {
  if (activeNode.value) projectStore.removeEdgesByHandle(activeNode.value.id, id); // Remove conexões presas a esta regra
  const rules = rulesList.value.filter(r => r.id !== id);
  if (rules.length === 0) rules.push({ id: generateUUID(), conditions: [{ id: generateUUID(), connector: 'AND', variableId: '', operator: '==', value: '' }] });
  updateData({ rules });
}
function addSubCondition(ruleIndex: number) {
  const rules = JSON.parse(JSON.stringify(rulesList.value));
  rules[ruleIndex].conditions.push({ id: generateUUID(), connector: 'AND', variableId: '', operator: '==', value: '' });
  updateData({ rules });
}
function removeSubCondition(ruleIndex: number, subIndex: number) {
  const rules = JSON.parse(JSON.stringify(rulesList.value));
  rules[ruleIndex].conditions.splice(subIndex, 1);
  if (rules[ruleIndex].conditions.length === 0) removeRuleGroup(rules[ruleIndex].id); // Remove grupo inteiro se esvaziar
  else updateData({ rules });
}
function updateSubCondition(ruleIndex: number, subIndex: number, field: string, value: any) {
  const rules = JSON.parse(JSON.stringify(rulesList.value));
  rules[ruleIndex].conditions[subIndex][field] = value;
  updateData({ rules });
}
</script>

<template>
  <div class="panel" v-if="activeNode && nodeConfig">
    <div class="panel-header" :style="{ borderBottomColor: nodeConfig.color }">
      <button class="btn-back" @click="closePanel" title="Voltar"><ArrowLeft :size="18" /></button>
      <component :is="nodeConfig.icon" :size="20" :color="nodeConfig.color" />
      <h2>{{ t(nodeConfig.titleKey) }}</h2>
    </div>

    <div class="panel-content">
      
      <!-- Editor Lateral (Para textos longos) -->
      <div class="form-group" v-if="isConversational">
        <label>Texto do Balão</label>
        <div class="editor-wrapper">
          <RichTextEditor :model-value="nodeData.text" variant="sidebar" @update:model-value="val => updateData({ text: val })" />
        </div>
      </div>

      <template v-if="activeNode.type === 'choice_question'">
        <div class="form-group"><hr class="divider" /></div>
        <div class="form-group">
          <label>Gerenciar Opções</label>
          <div class="list-container">
            <div v-for="choice in choicesList" :key="choice.id" class="list-item">
              <span class="item-label">{{ choice.label || 'Vazio' }}</span>
              <button class="btn-icon danger" @click="removeChoice(choice.id)"><Trash2 :size="14" /></button>
            </div>
          </div>
          <button class="btn-outline" @click="addChoice"><Plus :size="14" /> Adicionar Opção</button>
        </div>
      </template>

      <!-- CONDIÇÃO: Nova Estrutura de E/OU -->
      <template v-else-if="activeNode.type === 'condition'">
        <div class="form-group">
          <label>Regras (Rotas)</label>
          
          <div class="rules-container">
            <div v-for="(rule, rIndex) in rulesList" :key="rule.id" class="rule-card">
              
              <div class="rule-header">
                <span class="font-bold">Regra {{ rIndex + 1 }}</span>
                <button class="btn-icon danger" @click="removeRuleGroup(rule.id)"><Trash2 :size="14" /></button>
              </div>

              <!-- O corpo da regra agora gerencia o E/OU por item -->
              <div class="rule-body">
                <div v-for="(sub, sIndex) in rule.conditions" :key="sub.id" class="sub-condition-box">
                  
                  <!-- Conector Dinâmico (E/OU) - Só aparece a partir do segundo item -->
                  <div class="sub-connector-row" v-if="sIndex > 0">
                    <select :value="sub.connector || 'AND'" @change="e => updateSubCondition(rIndex, sIndex, 'connector', (e.target as HTMLSelectElement).value)" class="connector-select">
                      <option value="AND">E</option>
                      <option value="OR">OU</option>
                    </select>
                  </div>

                  <div class="sub-row">
                    <select :value="sub.variableId || ''" @change="e => updateSubCondition(rIndex, sIndex, 'variableId', (e.target as HTMLSelectElement).value)">
                      <option value="" disabled>Variável...</option>
                      <option v-for="v in variables" :key="v.id" :value="v.id">{{ v.name }}</option>
                    </select>
                    <button class="btn-icon danger" @click="removeSubCondition(rIndex, sIndex)"><Trash2 :size="14" /></button>
                  </div>
                  <div class="sub-row">
                    <select :value="sub.operator || '=='" @change="e => updateSubCondition(rIndex, sIndex, 'operator', (e.target as HTMLSelectElement).value)">
                      <option value="==">=</option><option value="!=">!=</option>
                      <option value=">">&gt;</option><option value="<">&lt;</option>
                      <option value=">=">&ge;</option><option value="<=">&le;</option>
                    </select>
                    <input type="text" :value="sub.value || ''" @input="e => updateSubCondition(rIndex, sIndex, 'value', (e.target as HTMLInputElement).value)" placeholder="Valor..." />
                  </div>
                </div>
                <button class="btn-text" @click="addSubCondition(rIndex)"><Plus :size="12" /> Adicionar condição</button>
              </div>
            </div>

            <button class="btn-outline" @click="addRuleGroup" style="margin-top: 8px;"><Plus :size="14" /> Adicionar Regra (Rota)</button>

            <!-- Card de "Caso Contrário" Fixo -->
            <div class="rule-card else-card">
              <div class="rule-header">
                <span class="font-bold">Caso contrário</span>
              </div>
              <div class="rule-body" style="font-size: 12px; color: #6b7280;">
                Se nenhuma das regras acima for atendida, o fluxo seguirá por esta rota.
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Matemática e SetVar não mudam -->
      <template v-else-if="activeNode.type === 'set_variable'">
        <div class="form-group">
          <label>Qual variável deseja alterar?</label>
          <select :value="nodeData.variableId || ''" @change="e => updateData({ variableId: (e.target as HTMLSelectElement).value })">
            <option value="" disabled>Selecione...</option>
            <option v-for="v in variables" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div class="form-group" v-if="nodeData.variableId">
          <label>Novo valor:</label>
          <input type="text" :value="nodeData.value || ''" @input="e => updateData({ value: (e.target as HTMLInputElement).value })" placeholder="Digite o valor..." />
        </div>
      </template>

      <template v-else-if="activeNode.type === 'math'">
        <div class="form-group">
          <label>Qual variável numérica calcular?</label>
          <select :value="nodeData.variableId || ''" @change="e => updateData({ variableId: (e.target as HTMLSelectElement).value })">
            <option value="" disabled>Selecione...</option>
            <option v-for="v in variables.filter(v => v.type === 'number')" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div class="form-group row" v-if="nodeData.variableId">
          <select :value="nodeData.operator || '+'" @change="e => updateData({ operator: (e.target as HTMLSelectElement).value })" style="width: 80px;">
            <option value="+">+</option><option value="-">-</option><option value="*">*</option><option value="/">/</option>
          </select>
          <input type="number" :value="nodeData.value || ''" @input="e => updateData({ value: Number((e.target as HTMLInputElement).value) })" placeholder="Valor" style="flex: 1;" />
        </div>
      </template>

      <template v-else-if="activeNode.type === 'open_question'">
        <div class="form-group"><hr class="divider" /></div>
        <div class="form-group">
          <label>Salvar resposta na variável:</label>
          <select :value="nodeData.variableId || ''" @change="e => updateData({ variableId: (e.target as HTMLSelectElement).value })">
            <option value="">(Não salvar)</option>
            <option v-for="v in variables" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; }
.panel-header { display: flex; align-items: center; gap: 8px; padding: 16px; border-bottom: 2px solid #e5e7eb; background: #f9fafb; color: #374151; }
.panel-header h2 { margin: 0; font-size: 16px; font-weight: 600; flex: 1; }
.btn-back { background: transparent; border: none; cursor: pointer; color: #6b7280; display: flex; align-items: center; padding: 4px; border-radius: 4px; }
.btn-back:hover { background: #e5e7eb; color: #374151; }
.panel-content { padding: 16px; display: flex; flex-direction: column; gap: 20px; }

.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group.row { flex-direction: row; }
label { font-size: 13px; font-weight: 600; color: #374151; }
.divider { border: none; border-top: 1px solid #e5e7eb; margin: 0; }

input, select { padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; outline: none; background: white; }
input:focus, select:focus { border-color: #3b82f6; }

.editor-wrapper { border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }

/* Listas */
.list-container { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.list-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; }
.item-label { font-size: 13px; color: #374151; font-weight: 500; }

/* Condição E/OU */
.rules-container { display: flex; flex-direction: column; gap: 16px; margin-bottom: 8px; }
.rule-card { background: white; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.else-card { border-color: #fca5a5; background: #fef2f2; }
.else-card .rule-header { background: #fee2e2; color: #991b1b; border-bottom-color: #fca5a5; }
.rule-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #374151; }
.rule-match-type { padding: 8px 12px 0 12px; font-size: 12px; color: #4b5563; display: flex; align-items: center; gap: 6px; }
.rule-match-type select { padding: 4px; font-size: 12px; }
.rule-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.sub-condition-box { background: #f3f4f6; padding: 8px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px; position: relative; }
.sub-row { display: flex; gap: 6px; }
.sub-row select { flex: 1; }
.sub-row input { flex: 1; min-width: 0; }
.sub-connector { text-align: center; font-size: 10px; font-weight: 700; color: #9ca3af; margin: 2px 0 -2px 0; }
.sub-connector-row { text-align: center; margin: -14px 0 4px 0; position: relative; z-index: 10; }
.connector-select { padding: 2px 6px; font-size: 10px; font-weight: 700; background: #e5e7eb; border: 1px solid #d1d5db; border-radius: 12px; color: #4b5563; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

/* Botões */
.btn-outline { background: white; border: 1px dashed #d1d5db; color: #374151; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 500; font-size: 13px; transition: all 0.1s; }
.btn-outline:hover { background: #f9fafb; border-color: #9ca3af; }
.btn-icon { background: transparent; border: none; padding: 4px; border-radius: 4px; cursor: pointer; color: #6b7280; display: flex; align-items: center; }
.btn-icon:hover { background: #e5e7eb; }
.btn-icon.danger:hover { background: #fee2e2; color: #ef4444; }
.btn-text { background: transparent; border: none; color: #3b82f6; font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; gap: 4px; }
.btn-text:hover { text-decoration: underline; }
.font-bold { font-weight: 700; }
</style>