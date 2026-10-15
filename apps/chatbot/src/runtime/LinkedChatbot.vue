<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertTriangle, ArrowLeft, Loader2 } from '@lucide/vue';
import type { ChatbotProject } from '../shared/types/chatbot';
import { provideMediaResolver } from '../shared/media/resolver';
import { useChatSession } from '../shared/chat/useChatSession';
import { fetchPublishedProject, publishedMediaUrl } from '../shared/chat/publishedProject';
import ChatInterface from '../shared/chat/ChatInterface.vue';
import ChatTitleBar from '../shared/chat/ChatTitleBar.vue';

/**
 * Chatbot aberto por "Abrir outro chatbot": camada por cima do anterior, com sessão, variáveis,
 * aparência e mídias próprias. Se ele também abrir outro, a camada seguinte fica por cima desta
 * (pilha); cada "Voltar" fecha uma camada e o anterior continua de onde estava.
 */
const props = defineProps<{ token: string }>();
const emit = defineEmits<{ back: [] }>();
const { t } = useI18n();

const project = shallowRef<ChatbotProject | null>(null);
const isUnavailable = ref(false);

provideMediaResolver(source => publishedMediaUrl(project.value, source));

// Sem telemetria, como o runtime público
const session = useChatSession({ getProject: () => project.value! });

onMounted(async () => {
  try {
    project.value = await fetchPublishedProject(props.token);
    session.start(); // O aluno já escolheu abrir: começa direto, sem a tela de "Iniciar"
  } catch (err) {
    console.warn('[Chatbot] Chatbot ligado indisponível', err);
    isUnavailable.value = true;
  }
});
</script>

<template>
  <section class="linked-chatbot">
    <template v-if="project">
      <ChatTitleBar :title="project.title" :appearance="project.appearance" show-back @back="emit('back')" />
      <ChatInterface :session="session" :appearance="project.appearance" />
    </template>

    <template v-else>
      <header class="linked-header">
        <button type="button" class="back-button" :title="t('chatbot.runtime.chat.back')" :aria-label="t('chatbot.runtime.chat.back')" @click="emit('back')">
          <ArrowLeft :size="20" />
        </button>
      </header>
      <div class="status-screen">
        <template v-if="isUnavailable">
          <AlertTriangle :size="40" color="#ef4444" />
          <p>{{ t('chatbot.runtime.linked.unavailable') }}</p>
          <button type="button" class="btn-back" @click="emit('back')">
            <ArrowLeft :size="16" /> {{ t('chatbot.runtime.chat.back') }}
          </button>
        </template>
        <template v-else>
          <Loader2 class="spin" :size="40" color="#9ca3af" />
          <p>{{ t('chatbot.runtime.status.loading') }}</p>
        </template>
      </div>
    </template>

    <!-- Este chatbot abriu outro: a próxima camada da pilha -->
    <LinkedChatbot v-if="session.openedLink.value?.token" :token="session.openedLink.value.token" @back="session.closeLink()" />
  </section>
</template>

<style scoped>
.linked-chatbot {
  position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column;
  background: #f9fafb; animation: slide-in 0.2s ease-out;
}
@keyframes slide-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
.linked-header { display: flex; align-items: center; padding: 10px 14px; background: white; border-bottom: 1px solid #e5e7eb; }
.back-button {
  width: 36px; height: 36px; margin: -4px 0 -4px -6px; border: none; border-radius: 50%; background: transparent;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151;
}
.back-button:hover { background: #f3f4f6; }
.status-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 32px; text-align: center; color: #4b5563; }
.btn-back {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px;
  border: 1px solid #d1d5db; background: white; color: #374151; font-weight: 600; cursor: pointer;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .linked-chatbot { animation: none; } }
</style>
