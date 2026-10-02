<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertTriangle, Bot, Loader2 } from '@lucide/vue';
import { RuntimeHeader } from '@clic/shared';
import type { ChatbotProject } from '../shared/types/chatbot';
import { parseProject } from '../shared/domain/project';
import { appDomainDeps } from '../shared/appDeps';
import appLogo from '../assets/logo_novelo.svg';
import { provideMediaResolver } from '../shared/media/resolver';
import { useChatSession } from '../shared/chat/useChatSession';
import ChatInterface from '../shared/chat/ChatInterface.vue';

const { t } = useI18n();

const isLoading = ref(true);
const isUnavailable = ref(false);
const project = shallowRef<ChatbotProject | null>(null);

// No runtime só existem arquivos já publicados: a URL pública fica em `project.assets`
provideMediaResolver(source => {
  if (source.kind === 'url') return source.url;
  const asset = project.value?.assets[source.assetId];
  return asset?.source === 'remote' ? asset.url : undefined;
});

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

    const restRoot = window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/chatbot/';
    const res = await fetch(restRoot + 'publish/' + token);
    if (!res.ok) throw new Error('INVALID_TOKEN');
    const json = await res.json();

    // Projetos do v1 (ou inválidos) são recusados: o chatbot fica indisponível
    const now = new Date().toISOString();
    const result = parseProject(json?.project?.data, appDomainDeps, now);
    if (!result.ok) throw new Error(result.error);
    project.value = result.project;
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
        <header class="runtime-header">
          <div class="widget-title">
            <Bot :size="18" /> <span>{{ project?.title || t('chatbot.runtime.status.chat_title') }}</span>
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

          <ChatInterface v-else :session="session" mode="runtime" />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.runtime-root { height: 100vh; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.runtime-page { flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px; overflow-y: auto; }
.runtime-widget { width: 100%; max-width: 420px; height: 640px; display: flex; flex-direction: column; background: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12); }
.runtime-header { display: flex; align-items: center; padding: 12px 16px; background: white; border-bottom: 1px solid #e5e7eb; }
.widget-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #4b5563; font-size: 14px; }
.runtime-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.status-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 32px; text-align: center; color: #6b7280; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .runtime-widget { height: 100%; max-width: 100%; border-radius: 12px; }
}
</style>
