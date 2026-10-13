<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MessageCircle, RotateCcw, X } from '@lucide/vue';
import { NODE_CONFIG } from '../../utils/nodeConfig';
import { telemetryService } from '@clic/shared';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { useChatSession } from '../../../shared/chat/useChatSession';
import ChatInterface from '../../../shared/chat/ChatInterface.vue';
import ChatTitleBar from '../../../shared/chat/ChatTitleBar.vue';
import TestVariables from './TestVariables.vue';
import { testActiveNodeId, testFromRequest } from '../../utils/testRun';

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const projectStore = useProjectStore();

// Cada interação do teste vira um evento semântico: o replay refaz a conversa pelo motor
const session = useChatSession({
  getProject: () => projectStore.project,
  onEvent: (name, payload) => telemetryService.addSemantic(name, payload ?? {})
});

watch(session.activeNodeId, id => { testActiveNodeId.value = id; }, { immediate: true });

// "Testar a partir daqui": começa direto no bloco pedido (também com o painel já aberto)
watch(testFromRequest, nodeId => {
  if (!nodeId) return;
  testFromRequest.value = null;
  session.start(nodeId);
}, { immediate: true });

// Tipo do bloco de partida, para o aviso "Testando a partir de…" (o bloco também fica destacado no canvas)
const fromBlockTitle = computed(() => {
  const node = session.fromNodeId.value ? projectStore.project.nodes[session.fromNodeId.value] : undefined;
  return node ? t(NODE_CONFIG[node.type].titleKey) : null;
});

// Abre na tela inicial, como no runtime (prévia do título); o botão do cabeçalho reinicia direto
onBeforeUnmount(() => { testActiveNodeId.value = null; });
</script>

<template>
  <aside class="test-panel">
    <header class="test-header">
      <div class="test-title">
        <MessageCircle :size="16" /> {{ t('chatbot.editor.test.title') }}
      </div>
      <div class="test-actions">
        <button class="btn-icon" :title="t('chatbot.runtime.chat.restart')" @click="session.start()">
          <RotateCcw :size="16" />
        </button>
        <button class="btn-icon" :title="t('global.close')" @click="emit('close')">
          <X :size="16" />
        </button>
      </div>
    </header>
    <!-- Partida fora do Início: aviso e atalho para voltar ao teste completo -->
    <div v-if="fromBlockTitle" class="test-from">
      <span>{{ t('chatbot.editor.test.from_block', { block: fromBlockTitle }) }}</span>
      <button type="button" class="btn-link" @click="session.start(null)">{{ t('chatbot.editor.test.from_start') }}</button>
    </div>
    <!-- Valores das variáveis (só no editor), no ritmo das mensagens -->
    <TestVariables :values="session.values.value" />
    <!-- Prévia do chat como o aluno vê: acompanha a aba Aparência ao vivo -->
    <ChatTitleBar :title="projectStore.project.title" :appearance="projectStore.project.appearance" />
    <ChatInterface :session="session" :appearance="projectStore.project.appearance" />
  </aside>
</template>

<style scoped>
.test-panel {
  width: 360px; flex: 0 0 360px; display: flex; flex-direction: column;
  background: #f9fafb; border-left: 1px solid #e5e7eb; min-height: 0;
}
.test-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: white; border-bottom: 1px solid #e5e7eb;
}
.test-title { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; color: #374151; }
.test-actions { display: flex; gap: 4px; }
.btn-icon {
  background: transparent; border: none; border-radius: 6px; padding: 6px; cursor: pointer;
  color: #6b7280; display: flex; align-items: center;
}
.btn-icon:hover { background: #f3f4f6; color: #111827; }
.test-from {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 6px 12px; background: #eff6ff; border-bottom: 1px solid #bfdbfe; font-size: 13px; color: #1e3a8a;
}
.btn-link {
  flex: 0 0 auto; background: none; border: none; padding: 2px 0; cursor: pointer;
  color: #1d4ed8; font-size: 13px; font-weight: 600; text-decoration: underline;
}
</style>
