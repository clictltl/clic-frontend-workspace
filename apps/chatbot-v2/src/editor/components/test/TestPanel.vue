<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MessageCircle, RotateCcw, X } from '@lucide/vue';
import { telemetryService } from '@clic/shared';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { useChatSession } from '../../../shared/chat/useChatSession';
import ChatInterface from '../../../shared/chat/ChatInterface.vue';
import { testActiveNodeId } from '../../utils/testRun';

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
const projectStore = useProjectStore();

// Cada interação do teste vira um evento semântico: o replay refaz a conversa pelo motor
const session = useChatSession({
  getProject: () => projectStore.project,
  onEvent: (name, payload) => telemetryService.addSemantic(name, payload ?? {})
});

watch(session.activeNodeId, id => { testActiveNodeId.value = id; }, { immediate: true });

onMounted(() => session.start());
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
    <ChatInterface :session="session" mode="test" />
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
</style>
