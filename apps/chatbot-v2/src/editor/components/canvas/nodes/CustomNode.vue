<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { NODE_CONFIG } from '../../../utils/nodeConfig.ts';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '../../../../shared/stores/projectStore.ts';
import RichTextEditor from './RichTextEditor.vue';
import { Trash2 } from '@lucide/vue';

const props = defineProps<{
  id: string;
  data: {
    nodeType: keyof typeof NODE_CONFIG;
    nodeData: Record<string, any>;
    isSelected: boolean;
  };
}>();

const { t } = useI18n();
const projectStore = useProjectStore();
const config = computed(() => NODE_CONFIG[props.data.nodeType]);

const choices = computed<any[]>(() => props.data.nodeData.choices || []);
const rules = computed<any[]>(() => props.data.nodeData.rules || []);
const variables = computed(() => projectStore.project.variables);
const isConversational = computed(() => ['message', 'open_question', 'choice_question', 'end'].includes(props.data.nodeType));

// Limpa tags HTML para ver se o editor está realmente vazio (evitando o <p></p>)
const displayText = computed(() => {
  const rawHTML = props.data.nodeData.text || '';
  const plainText = rawHTML.replace(/<[^>]+>/g, '').trim();
  
  if (!plainText && rawHTML.indexOf('<img') === -1) {
    // Se não tiver texto nem imagem, devolve um placeholder clicável
    return `<p style="color: #9ca3af; font-style: italic;">(${t('chatbot.editor.no_content')})</p>`;
  }
  return rawHTML;
});

// Controle do Modo de Edição Inline
const isEditingInline = ref(false);

// Se o nó for desselecionado clicando no fundo, sai do modo edição
watch(() => props.data.isSelected, (selected) => {
  if (!selected) isEditingInline.value = false;
});

function enableInlineEdit() {
  if (!props.data.isSelected) projectStore.selectNode(props.id);
  isEditingInline.value = true;
}

function updateText(newText: string) {
  projectStore.updateNodeData(props.id, { text: newText });
}

function updateChoiceLabel(index: number, event: Event) {
  const newLabel = (event.target as HTMLInputElement).value;
  const newChoices = [...choices.value];
  newChoices[index].label = newLabel;
  projectStore.updateNodeData(props.id, { choices: newChoices });
}

function getVarName(id: string) {
  return variables.value[id]?.name || '?';
}

// Construtor Inteligente da frase com HTML (Pílula Azul)
function getRuleHtml(rule: any, index: number) {
  if (!rule.conditions || rule.conditions.length === 0) return t('chatbot.properties.rule_n', { n: index + 1 });
  
  const parts = rule.conditions.map((sub: any) => {
    if (!sub.variableId) return '...';
    // Injeta a mesma classe var-pill usada na Matemática
    return `<span class="var-pill">${getVarName(sub.variableId)}</span> <strong>${sub.operator}</strong> ${sub.value}`;
  });
  
  const connector = rule.conditions.length > 1 && rule.conditions[1].connector === 'OR' 
    ? ` <span class="logic-connector">${t('chatbot.properties.logic_or')}</span> `
    : ` <span class="logic-connector">${t('chatbot.properties.logic_and')}</span> `;
    
  return parts.join(connector);
}
</script>

<template>
  <div class="custom-node" :class="{ 'is-selected': data.isSelected }" :style="{ borderColor: data.isSelected ? config.color : '#e5e7eb' }">
    
    <Handle v-if="data.nodeType !== 'start'" type="target" id="in_default" :position="Position.Left" class="node-handle in-handle" />

    <div class="node-header" :style="{ backgroundColor: config.color }">
      <div class="header-left">
        <component :is="config.icon" :size="16" />
        <span class="node-title">{{ t(config.titleKey) }}</span>
      </div>
      <button 
        v-if="data.nodeType !== 'start'" 
        class="btn-delete-node" 
        @click.stop="projectStore.deleteNode(id)"
        :title="t('chatbot.editor.delete_block')"
      >
        <Trash2 :size="14" />
      </button>
    </div>

    <div class="node-body nodrag nowheel">
      
      <!-- INÍCIO -->
      <template v-if="data.nodeType === 'start'">
        <div class="start-message">{{ t('chatbot.editor.start_hint') }}</div>
      </template>

      <!-- CONVERSACIONAL -->
      <template v-else-if="isConversational">
        <RichTextEditor 
          v-if="isEditingInline" 
          :model-value="data.nodeData.text" 
          @update:model-value="updateText" 
          @blur="isEditingInline = false"
        />
        <div 
          v-else 
          class="read-only-text editable-text" 
          v-html="displayText"
          @click="enableInlineEdit"
          :title="t('chatbot.editor.click_to_edit')"
        ></div>
        
        <div class="choices-container" v-if="data.nodeType === 'choice_question'">
          <div v-for="choice in choices" :key="choice.id" class="choice-wrapper">
            <input type="text" :value="choice.label" @input="updateChoiceLabel(choices.indexOf(choice), $event)" class="choice-bubble-input" :placeholder="t('chatbot.properties.new_choice')" />
            <!-- Bolinha embutida dentro do wrapper do botão -->
            <Handle type="source" :id="choice.id" :position="Position.Right" class="node-handle out-handle inner-handle" :style="{ backgroundColor: config.color }" />
          </div>
        </div>
      </template>

      <!-- CONDIÇÃO (Design de Caixas com Espaçamento e Pílulas) -->
      <template v-else-if="data.nodeType === 'condition'">
        <div class="rules-list">
          <div v-for="(rule, index) in rules" :key="rule.id" class="rule-box">
            <div class="rule-label code-style" v-html="getRuleHtml(rule, index)"></div>
            <Handle type="source" :id="rule.id" :position="Position.Right" class="node-handle out-handle inner-handle" />
          </div>
          
          <div class="rule-box else-box">
            <span class="rule-label">{{ t('chatbot.properties.else') }}</span>
            <Handle type="source" id="out_else" :position="Position.Right" class="node-handle out-handle inner-handle" />
          </div>
        </div>
      </template>

      <!-- SET VARIABLE -->
      <template v-else-if="data.nodeType === 'set_variable'">
        <div class="logic-summary">
          <div v-if="data.nodeData.variableId" class="logic-code">
            <span class="var-pill">{{ getVarName(data.nodeData.variableId) }}</span> = <strong>{{ data.nodeData.value || '0' }}</strong>
          </div>
          <div v-else class="subtext">{{ t('chatbot.editor.configure_in_sidebar') }}</div>
        </div>
      </template>

      <!-- MATH -->
      <template v-else-if="data.nodeType === 'math'">
        <div class="logic-summary">
          <div v-if="data.nodeData.variableId" class="logic-code">
            <span class="var-pill">{{ getVarName(data.nodeData.variableId) }}</span> = <span class="var-pill">{{ getVarName(data.nodeData.variableId) }}</span> <strong>{{ data.nodeData.operator || '+' }} {{ data.nodeData.value || '0' }}</strong>
          </div>
          <div v-else class="subtext">{{ t('chatbot.editor.configure_in_sidebar') }}</div>
        </div>
      </template>
    </div>

    <!-- PORTA DE SAÍDA PADRÃO -->
    <Handle 
      v-if="!['end', 'choice_question', 'condition'].includes(data.nodeType)" 
      type="source" 
      id="out_default" 
      :position="Position.Right" 
      class="node-handle out-handle standard-handle" 
    />
  </div>
</template>

<style scoped>
.custom-node { 
  background: white; border-radius: 8px; border: 2px solid #e5e7eb; width: 260px; 
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  position: relative; 
}
.custom-node:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}
.custom-node.is-selected { 
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
  transform: translateY(-2px);
}
.node-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; color: white; border-top-left-radius: 6px; border-top-right-radius: 6px; }
.header-left { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
.btn-delete-node { 
  background: rgba(0,0,0,0.15); border: none; color: white; cursor: pointer; 
  padding: 4px; border-radius: 4px; display: flex; align-items: center; transition: background 0.2s; 
}
.btn-delete-node:hover { background: rgba(255,255,255,0.3); }
.node-body { padding: 12px; font-size: 13px; color: #4b5563; min-height: 40px; cursor: text; }

.start-message { font-size: 12px; color: #6b7280; font-style: italic; text-align: center; padding: 8px 0; }
.read-only-text { display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
.read-only-text :deep(p) { margin: 0 0 0.5em 0; }
.read-only-text :deep(p:last-child) { margin-bottom: 0; }
.editable-text { min-height: 20px; width: 100%; }
.editable-text:hover { background: #f3f4f6; border-radius: 4px; cursor: text; }


/* Nova UX de Múltipla Escolha (Botão de Chat com Bolinha Interna) */
.choices-container { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.choice-wrapper { position: relative; display: flex; align-items: center; }
.choice-bubble-input { 
  flex: 1; padding: 8px 32px 8px 12px; /* 32px de respiro interno para a bolinha não cobrir o texto */
  border: 1px solid #e5e7eb; border-radius: 16px; 
  background: #f9fafb; font-size: 12px; text-align: center; color: #374151; font-weight: 500;
  transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); width: 100%; box-sizing: border-box;
}
.choice-bubble-input:focus { border-color: #3b82f6; background: #eff6ff; outline: none; }

/* Resumo Lógico (Matemática e SetVar) */
.logic-summary { text-align: center; background: #f9fafb; border-radius: 6px; border: 1px dashed #d1d5db; padding: 12px 8px; }
.subtext { font-size: 11px; color: #9ca3af; }
.logic-code { font-family: monospace; font-size: 12px; color: #111827; }

/* Pílula de Variável Injetada Globalmente (Math, SetVar e Condition HTML) */
:deep(.var-pill) { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin: 0 2px; }
:deep(.logic-connector) { font-size: 10px; color: #9ca3af; font-weight: 700; margin: 0 2px; }

/* Nova UX da Condição (Caixas separadas e espaçosas) */
.rules-list { display: flex; flex-direction: column; gap: 8px; } /* O gap dá o espaço perfeito entre elas */
.rule-box { 
  position: relative; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; 
  padding: 8px 32px 8px 8px; /* 32px de respiro interno */
  display: flex; align-items: center; min-height: 20px;
}
.else-box { background: #fef2f2; border-color: #fca5a5; }
.rule-label { font-size: 12px; font-weight: 600; color: #374151; width: 100%; text-align: left; }
.else-box .rule-label { color: #991b1b; }
.code-style { font-family: monospace; font-size: 12px; }

/* ========================================================
   BOLINHAS DE CONEXÃO (HANDLES) - VISUAL PREMIUM
   ======================================================== */
:deep(.node-handle) { 
  width: 16px !important; 
  height: 16px !important; 
  border: 2px solid white !important; 
  border-radius: 50% !important; 
  box-sizing: border-box !important;
  margin: 0 !important; /* Reseta qualquer sujeira do Vue Flow */
  
  /* Sombra para dar profundidade de "Plug" */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05) !important; 
  
  /* Animação suave */
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s !important;
  z-index: 10 !important;
}

/* Base de Alinhamento Y (O !important blinda contra o CSS nativo) */
:deep(.node-handle) {
  transform: translateY(-50%) !important;
}

/* Efeito Hover Maravilhoso (Cresce e eleva a sombra) */
:deep(.node-handle:hover) {
  transform: translateY(-50%) scale(1.3) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
  z-index: 20 !important;
  cursor: crosshair; /* Muda o mouse para indicar conexão */
}

/* Entrada (Cinza - Esquerda Matemática) */
:deep(.in-handle) { 
  background-color: #9ca3af !important; 
  left: -8px !important; /* Metade exata dos 16px */
  top: 50% !important; 
}

/* Saídas em geral (Azul) */
:deep(.out-handle) { 
  background-color: #3b82f6 !important; 
}

/* Saída Padrão (Direita Matemática) */
:deep(.standard-handle) { 
  right: -8px !important; /* Metade exata dos 16px */
  top: 50% !important; 
}

/* Saídas INTERNAS (Choice e Condition) 
   Aninhadas perfeitamente, a 8px da borda interna do botão/caixa */
:deep(.inner-handle) { 
  right: 8px !important; 
  top: 50% !important; 
}
</style>