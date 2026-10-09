<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Handle, Position, useVueFlow } from '@vue-flow/core';
import { useI18n } from 'vue-i18n';
import { CopyPlus, Dices, Save, SaveOff, Timer, Trash2 } from '@lucide/vue';
import { NODE_CONFIG } from '../../../utils/nodeConfig';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { HANDLE_ELSE, HANDLE_OUT, type ComparisonOperator } from '../../../../shared/types/chatbot';
import RichTextView from './RichTextView.vue';
import { connectTargetNodeId } from '../../../utils/connectTarget';
import DraftInput from '../../common/DraftInput.vue';
import NodeContentEditor from '../../common/NodeContentEditor.vue';
import ChoiceMediaView from '../../../../shared/components/ChoiceMediaView.vue';
import MediaView from '../../../../shared/components/MediaView.vue';
import { testActiveNodeId } from '../../../utils/testRun';

// O Vue Flow só informa o ID: todo o resto é lido do store (fonte da verdade)
const props = defineProps<{ id: string }>();

const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => projectStore.project.nodes[props.id]);
const config = computed(() => (node.value ? NODE_CONFIG[node.value.type] : null));
const isSelected = computed(() => projectStore.selectedNodeId === props.id);

// --- EDIÇÃO INLINE DO TEXTO ---
const isEditingInline = ref(false);

// Se o nó for desselecionado clicando no fundo, sai do modo edição (o editor confirma ao desmontar)
watch(isSelected, selected => {
  if (!selected) isEditingInline.value = false;
});

const { connectionClickStartHandle } = useVueFlow();

function enableInlineEdit() {
  // Com uma conexão pendente, o clique no bloco é "ligar aqui" (tratado no canvas), não editar
  if (connectionClickStartHandle.value) return;
  if (!isSelected.value) projectStore.selectNode(props.id);
  isEditingInline.value = true;
}

// --- RESUMOS (Condição, Definir Variável, Matemática) ---
function varName(id: string | null) {
  return (id && projectStore.project.variables[id]?.name) || '?';
}

function isMissing(id: string | null) {
  return !id || !projectStore.project.variables[id];
}

function literalText(value: string | number) {
  return value === '' ? '""' : String(value);
}

/** Opções preenchidas do sorteio, separadas por " / ". */
function randomText(options: string[]) {
  return options.filter(o => o.trim()).join(' / ') || '""';
}

const OPERATOR_SYMBOLS: Record<ComparisonOperator, string> = { '==': '=', '!=': '≠', '>': '>', '<': '<', '>=': '≥', '<=': '≤' };
</script>

<template>
  <div
    v-if="node && config"
    class="custom-node"
    :class="{ 'is-selected': isSelected, 'is-running': testActiveNodeId === id, 'is-connect-target': connectTargetNodeId === id }"
    :style="{ borderColor: isSelected ? config.color : '#e5e7eb' }"
  >
    <Handle v-if="node.type !== 'start'" type="target" id="in" :position="Position.Left" class="node-handle in-handle" />

    <div class="node-header" :style="{ backgroundColor: config.color }">
      <div class="header-left">
        <component :is="config.icon" :size="16" />
        <span class="node-title">{{ t(config.titleKey) }}</span>
      </div>
      <div v-if="node.type !== 'start'" class="header-actions">
        <button
          class="btn-delete-node"
          @click.stop="projectStore.duplicateNode(id)"
          :title="t('chatbot.editor.duplicate_block')"
          :aria-label="t('chatbot.editor.duplicate_block')"
        >
          <CopyPlus :size="14" />
        </button>
        <button
          class="btn-delete-node"
          @click.stop="projectStore.deleteNode(id)"
          :title="t('chatbot.editor.delete_block')"
          :aria-label="t('chatbot.editor.delete_block')"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <div class="node-body nodrag nowheel">

      <!-- INÍCIO -->
      <div v-if="node.type === 'start'" class="start-message">{{ t('chatbot.editor.start_hint') }}</div>

      <!-- CONVERSACIONAIS (texto rico) -->
      <template v-if="'content' in node.data">
        <div v-if="node.data.media?.position === 'before'" class="node-media">
          <MediaView :media="node.data.media.media" />
        </div>
        <NodeContentEditor v-if="isEditingInline" :node-id="id" @blur="isEditingInline = false" />
        <div
          v-else
          class="read-only-text editable-text"
          @click="enableInlineEdit"
          :title="t('chatbot.editor.click_to_edit')"
        >
          <RichTextView :content="node.data.content" />
        </div>
        <div v-if="node.data.media?.position === 'after'" class="node-media">
          <MediaView :media="node.data.media.media" />
        </div>
        <label v-if="node.type === 'message'" class="delay-field" :class="{ 'is-active': node.data.delay > 0 }" :title="t('chatbot.properties.delay_label')">
          <Timer :size="12" />
          <DraftInput
            type="number"
            class="delay-input"
            :model-value="node.data.delay"
            @commit="value => projectStore.setMessageDelay(id, Number(value))"
          />
          <span>{{ t('chatbot.editor.delay_unit_short') }}</span>
        </label>
      </template>

      <!-- MÚLTIPLA ESCOLHA -->
      <div v-if="node.type === 'choice_question'" class="choices-container">
        <div v-for="choice in node.data.choices" :key="choice.id" class="choice-wrapper">
          <div class="choice-bubble">
            <ChoiceMediaView v-if="choice.media" :media="choice.media" :size="20" />
            <DraftInput
              class="choice-bubble-input"
              :model-value="choice.label"
              :placeholder="choice.media ? '' : t('chatbot.properties.new_choice')"
              @commit="label => projectStore.renameChoice(id, choice.id, label)"
            />
          </div>
          <Handle type="source" :id="choice.id" :position="Position.Right" class="node-handle out-handle inner-handle" :style="{ backgroundColor: config.color }" />
        </div>
      </div>

      <!-- CONDIÇÃO -->
      <div v-else-if="node.type === 'condition'" class="rules-list">
        <div v-for="rule in node.data.rules" :key="rule.id" class="rule-box">
          <div class="rule-label code-style">
            <template v-for="(condition, cIndex) in rule.conditions" :key="condition.id">
              <span v-if="cIndex > 0" class="logic-connector">
                {{ rule.match === 'any' ? t('chatbot.properties.logic_or') : t('chatbot.properties.logic_and') }}
              </span>
              <span v-if="!condition.variableId">…</span>
              <template v-else>
                <span class="var-pill" :class="{ 'is-missing': isMissing(condition.variableId) }">{{ varName(condition.variableId) }}</span>
                <strong> {{ OPERATOR_SYMBOLS[condition.operator] }} </strong>
                <span v-if="condition.value.kind === 'variable'" class="var-pill" :class="{ 'is-missing': isMissing(condition.value.variableId) }">{{ varName(condition.value.variableId) }}</span>
                <span v-else>{{ literalText(condition.value.value) }}</span>
              </template>
            </template>
          </div>
          <Handle type="source" :id="rule.id" :position="Position.Right" class="node-handle out-handle inner-handle" />
        </div>

        <div class="rule-box else-box">
          <span class="rule-label">{{ t('chatbot.properties.else') }}</span>
          <Handle type="source" :id="HANDLE_ELSE" :position="Position.Right" class="node-handle out-handle inner-handle" />
        </div>
      </div>

      <!-- DEFINIR VARIÁVEL -->
      <div v-else-if="node.type === 'set_variable'" class="logic-summary">
        <div v-if="node.data.variableId" class="logic-code">
          <span class="var-pill" :class="{ 'is-missing': isMissing(node.data.variableId) }">{{ varName(node.data.variableId) }}</span>
          =
          <span v-if="node.data.value.kind === 'variable'" class="var-pill" :class="{ 'is-missing': isMissing(node.data.value.variableId) }">{{ varName(node.data.value.variableId) }}</span>
          <span v-else-if="node.data.value.kind === 'random'" class="random-summary">
            <Dices :size="12" class="random-icon" />
            <strong>{{ randomText(node.data.value.options) }}</strong>
          </span>
          <strong v-else>{{ literalText(node.data.value.value) }}</strong>
        </div>
        <div v-else class="subtext">{{ t('chatbot.editor.configure_in_sidebar') }}</div>
      </div>

      <!-- MATEMÁTICA -->
      <div v-else-if="node.type === 'math'" class="logic-summary">
        <div v-if="node.data.variableId" class="logic-code">
          <span class="var-pill" :class="{ 'is-missing': isMissing(node.data.variableId) }">{{ varName(node.data.variableId) }}</span>
          =
          <span class="var-pill" :class="{ 'is-missing': isMissing(node.data.variableId) }">{{ varName(node.data.variableId) }}</span>
          <strong> {{ node.data.operator }} </strong>
          <span v-if="node.data.operand.kind === 'variable'" class="var-pill" :class="{ 'is-missing': isMissing(node.data.operand.variableId) }">{{ varName(node.data.operand.variableId) }}</span>
          <strong v-else>{{ literalText(node.data.operand.value) }}</strong>
        </div>
        <div v-else class="subtext">{{ t('chatbot.editor.configure_in_sidebar') }}</div>
      </div>
    </div>

    <!-- PERGUNTA ABERTA: onde a resposta fica guardada (variável apagada conta como "não salva") -->
    <div
      v-if="node.type === 'open_question'"
      class="node-footer"
      :class="isMissing(node.data.variableId) ? 'is-unsaved' : 'is-saved'"
    >
      <template v-if="isMissing(node.data.variableId)">
        <SaveOff :size="14" class="footer-icon" />
        <span>{{ t('chatbot.editor.answer_not_saved') }}</span>
      </template>
      <template v-else>
        <Save :size="14" class="footer-icon" />
        <i18n-t keypath="chatbot.editor.answer_saved_in" tag="span">
          <template #variable>
            <span class="var-pill">{{ varName(node.data.variableId) }}</span>
          </template>
        </i18n-t>
      </template>
    </div>

    <!-- SAÍDA PADRÃO -->
    <Handle
      v-if="!['end', 'choice_question', 'condition'].includes(node.type)"
      type="source"
      :id="HANDLE_OUT"
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
/* Nó "falando" durante o teste da conversa */
.custom-node.is-connect-target {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.35), 0 4px 12px rgba(0, 0, 0, 0.1);
}
.custom-node.is-running {
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.45), 0 10px 20px -4px rgba(16, 185, 129, 0.35);
  transform: translateY(-2px);
}
.node-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; color: white; border-top-left-radius: 6px; border-top-right-radius: 6px; }
.header-left { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
.header-actions { display: flex; gap: 4px; }
.btn-delete-node {
  background: rgba(0,0,0,0.15); border: none; color: white; cursor: pointer;
  padding: 4px; border-radius: 4px; display: flex; align-items: center; transition: background 0.2s;
}
.btn-delete-node:hover { background: rgba(255,255,255,0.3); }
.node-body { padding: 12px; font-size: 13px; color: #4b5563; min-height: 40px; cursor: text; }

.start-message { font-size: 12px; color: #6b7280; font-style: italic; text-align: center; padding: 8px 0; }
.read-only-text { display: -webkit-box; -webkit-line-clamp: 4; line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
.editable-text { min-height: 20px; width: 100%; }
.editable-text:hover { background: #f3f4f6; border-radius: 4px; cursor: text; }

/* Múltipla Escolha (Botão de Chat com Bolinha Interna) */
.choices-container { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.choice-wrapper { position: relative; display: flex; align-items: center; }
.choice-bubble {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb; border-radius: 16px; background: #f9fafb;
  transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); min-width: 0;
}
.choice-bubble:focus-within { border-color: #3b82f6; background: #eff6ff; }
.choice-bubble-input {
  flex: 1; min-width: 0; border: none; background: transparent; outline: none; padding: 2px 0;
  font-size: 12px; text-align: center; color: #374151; font-weight: 500;
}
.node-media { margin: 8px 0; }

/* Espera (editável no próprio nó) */
.delay-field {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
  padding: 2px 8px; border-radius: 10px; background: #f3f4f6; color: #4b5563;
  font-size: 11px; font-weight: 600; cursor: text;
}
.delay-field.is-active { background: #eff6ff; color: #1d4ed8; }
.delay-input {
  width: 32px; border: none; background: transparent; outline: none; padding: 0;
  font: inherit; color: inherit; text-align: right;
}
.delay-field:focus-within { box-shadow: 0 0 0 1px #3b82f6; }

/* Resumo Lógico (Matemática e Definir Variável) */
.logic-summary { text-align: center; background: #f9fafb; border-radius: 6px; border: 1px dashed #d1d5db; padding: 12px 8px; }
.subtext { font-size: 11px; color: #9ca3af; }
.logic-code { font-family: monospace; font-size: 12px; color: #111827; }
.random-summary { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; vertical-align: middle; }
.random-summary strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.random-icon { flex: 0 0 auto; color: #6b7280; }

/* Rodapé da pergunta aberta (onde a resposta fica guardada) */
.node-footer {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; font-size: 11px; line-height: 1.4;
  border-top: 1px solid #e5e7eb; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;
}
.node-footer .var-pill { padding: 0 5px; }
.footer-icon { flex: 0 0 auto; }
.node-footer.is-saved { background: #f0fdf4; color: #166534; }
.node-footer.is-unsaved { background: #fffbeb; color: #92400e; }

/* Pílula de Variável (Matemática, Definir Variável e Condição) */
.var-pill { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin: 0 2px; }
.var-pill.is-missing { background: #fee2e2; color: #b91c1c; }
.logic-connector { font-size: 10px; color: #9ca3af; font-weight: 700; margin: 0 4px; }

/* Condição (Caixas separadas) */
.rules-list { display: flex; flex-direction: column; gap: 8px; }
.rule-box {
  position: relative; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;
  padding: 8px;
  display: flex; align-items: center; min-height: 20px;
}
.else-box { background: #fef2f2; border-color: #fca5a5; }
.rule-label { font-size: 12px; font-weight: 600; color: #374151; width: 100%; text-align: left; }
.else-box .rule-label { color: #991b1b; }
.code-style { font-family: monospace; font-size: 12px; }

/* ========================================================
   BOLINHAS DE CONEXÃO (HANDLES)
   ======================================================== */
:deep(.node-handle) {
  width: 16px !important;
  height: 16px !important;
  border: 2px solid white !important;
  border-radius: 50% !important;
  box-sizing: border-box !important;
  margin: 0 !important; /* Reseta qualquer sujeira do Vue Flow */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05) !important;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s !important;
  z-index: 10 !important;
  transform: translateY(-50%) !important; /* Alinhamento Y (blinda contra o CSS nativo) */
}

:deep(.node-handle:hover) {
  transform: translateY(-50%) scale(1.3) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
  z-index: 20 !important;
  cursor: crosshair;
}

/* Entrada (Cinza - Esquerda) */
:deep(.in-handle) {
  background-color: #9ca3af !important;
  left: -8px !important; /* Metade exata dos 16px */
  top: 50% !important;
}

/* Saídas em geral (Azul) */
:deep(.out-handle) { background-color: #3b82f6 !important; }

/* Saída Padrão (Direita) */
:deep(.standard-handle) {
  right: -8px !important;
  top: 50% !important;
}

/* Saídas das opções e regras: na borda direita do bloco, na altura da opção/regra.
   -20px = margem interna do corpo (12px) + metade da bolinha (8px), alinhada à saída padrão */
:deep(.inner-handle) {
  right: -20px !important;
  top: 50% !important;
}

/* Área de toque maior que a bolinha (dedo, mãos de criança), sem mudar o visual */
:deep(.node-handle)::after {
  content: ''; position: absolute; inset: -6px; border-radius: 50%;
}

/* ========================================================
   TELAS DE TOQUE (tablet): alvos maiores para dedos de criança.
   No computador com mouse nada muda.
   ======================================================== */
@media (pointer: coarse) {
  /* Mais espaço entre opções/regras: não puxar a conexão da vizinha */
  .choices-container, .rules-list { gap: 14px; }

  /* Bolinha de 20px com área de toque de 44px (mínimo recomendado) */
  :deep(.node-handle) { width: 20px !important; height: 20px !important; }
  :deep(.node-handle)::after { inset: -12px; }
  :deep(.in-handle) { left: -10px !important; }
  :deep(.standard-handle) { right: -10px !important; }
  :deep(.inner-handle) { right: -22px !important; } /* 12px do corpo + metade da bolinha */

  .btn-delete-node { padding: 7px; }

  /* Segurar o dedo abre o menu do bloco: sem seleção de texto nem menu nativo do iPad */
  .node-header, .read-only-text { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
}
</style>
