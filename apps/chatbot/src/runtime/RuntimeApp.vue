<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertTriangle, Bot, Loader2 } from '@lucide/vue';
import { RuntimeHeader } from '@clic/shared';
import type { ChatbotProject } from '../shared/types/chatbot';
import appLogo from '../assets/logo_novelo.webp'; // Imagem 2x da altura exibida: o SVG original tinha 85 KB
import { provideMediaResolver } from '../shared/media/resolver';
import { useChatSession } from '../shared/chat/useChatSession';
import ChatInterface from '../shared/chat/ChatInterface.vue';
import ChatTitleBar from '../shared/chat/ChatTitleBar.vue';
import { fetchPublishedProject, publishedMediaUrl } from '../shared/chat/publishedProject';
import LinkedChatbot from './LinkedChatbot.vue';

const { t } = useI18n();

const isLoading = ref(true);
const isUnavailable = ref(false);
const project = shallowRef<ChatbotProject | null>(null);

// No runtime só existem arquivos já publicados: a URL pública fica em `project.assets`
provideMediaResolver(source => publishedMediaUrl(project.value, source));

// Sem telemetria: o runtime público não tem sessão de aluno logado
const session = useChatSession({ getProject: () => project.value! });

function extractTokenFromPath(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const pIndex = parts.lastIndexOf('p');
  return pIndex !== -1 ? parts[pIndex + 1] ?? null : null;
}

/** Abre uma cópia (remix) do chatbot publicado no editor, em outra aba. */
function openInEditor() {
  const href = window.location.href;
  const pIndex = href.indexOf('/p/');
  const appBaseUrl = pIndex !== -1 ? href.substring(0, pIndex) : '';
  const token = extractTokenFromPath();
  if (token) window.open(`${appBaseUrl}/editor?remix=${token}`, '_blank');
}

async function loadProject() {
  try {
    const token = extractTokenFromPath();
    if (!token) throw new Error('INVALID_TOKEN');

    // Projetos do v1 são convertidos; inválidos deixam o chatbot indisponível
    project.value = await fetchPublishedProject(token);
  } catch (err) {
    console.warn('[Chatbot] Projeto indisponível', err);
    isUnavailable.value = true;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadProject);
</script>

<template>
  <div class="runtime-root">
    <RuntimeHeader app-name="Novelo" :app-logo="appLogo" :show-edit-button="!isUnavailable" @edit-click="openInEditor" />

    <div class="runtime-page">
      <div class="runtime-widget">
        <ChatTitleBar v-if="project" :title="project.title" :appearance="project.appearance" />
        <header v-else class="runtime-header">
          <div class="widget-title">
            <Bot :size="18" /> <span>{{ t('chatbot.runtime.status.chat_title') }}</span>
          </div>
        </header>

        <main class="runtime-body">
          <div v-if="isLoading" class="status-screen">
            <Loader2 class="spin" :size="48" color="#9ca3af" />
            <p>{{ t('chatbot.runtime.status.loading') }}</p>
          </div>

          <div v-else-if="isUnavailable" class="status-screen">
            <AlertTriangle :size="48" color="#ef4444" />
            <p>{{ t('chatbot.runtime.status.unavailable') }}</p>
          </div>

          <ChatInterface v-else-if="project" :session="session" :appearance="project.appearance" />
        </main>

        <!-- "Abrir outro chatbot": o chatbot escolhido abre por cima; Voltar retorna a este, no mesmo ponto -->
        <LinkedChatbot v-if="session.openedLink.value?.token" :token="session.openedLink.value.token" @back="session.closeLink()" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.runtime-root { height: 100vh; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.runtime-page { flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px; overflow-y: auto; }
.runtime-widget { position: relative; width: 100%; max-width: 480px; height: 100%; max-height: 820px; /* Acompanha a altura da tela */ display: flex; flex-direction: column; background: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12); }
.runtime-header { display: flex; align-items: center; padding: 12px 16px; background: white; border-bottom: 1px solid #e5e7eb; }
.widget-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #4b5563; font-size: 14px; }
.runtime-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.status-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 32px; text-align: center; color: #6b7280; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Celular: o chat ocupa a tela inteira, como um app de conversa */
@media (max-width: 480px) {
  .runtime-page { padding: 0; }
  .runtime-widget { max-height: none; border-radius: 0; box-shadow: none; }
}
</style>
