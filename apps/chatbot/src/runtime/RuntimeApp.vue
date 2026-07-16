<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useChatRuntime } from '@/runtime/engine/useChatRuntime';
import type { ProjectData } from '@/shared/types/project';
import { RuntimeHeader } from '@clic/shared';
import appLogo from '@/assets/logo_novelo.svg';
import { Play, Square, Loader2, AlertTriangle, Bot } from '@lucide/vue';
import ChatInterface from '@/shared/components/ChatInterface.vue';

const { t } = useI18n();
const isLoading = ref(true);
const fatalError = ref<string | null>(null);

const runtime = ref<ReturnType<typeof useChatRuntime> | null>(null);
const r = computed(() => runtime.value);

function handleEditClick() {
  const href = window.location.href;
  const pIndex = href.indexOf('/p/');
  const appBaseUrl = pIndex !== -1 ? href.substring(0, pIndex) : '/';
  const token = extractTokenFromPath();
  if (token) window.open(`${appBaseUrl}/editor?remix=${token}`, '_blank');
}

function extractTokenFromPath(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const pIndex = parts.lastIndexOf('p');
  return pIndex !== -1 ? parts[pIndex + 1] ?? null : null;
}

async function loadProject() {
  const token = extractTokenFromPath();
  if (!token) { fatalError.value = 'INVALID_TOKEN'; return; }
  try {
    const restRoot = window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/chatbot/';
    const res = await fetch(restRoot + 'publish/' + token);
    if (!res.ok) { fatalError.value = 'INVALID_TOKEN'; return; }
    
    const json = await res.json();
    const data: ProjectData = json.project.data;
    
    runtime.value = useChatRuntime({
      blocks: data.blocks,
      variables: data.variables,
      assets: data.assets
    });
  } catch {
    fatalError.value = 'NETWORK_ERROR';
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadProject);
</script>

<template>
  <div class="runtime-root">
    <RuntimeHeader appName="Chatbot" :appLogo="appLogo" @edit-click="handleEditClick" />

    <div class="runtime-page">
      <div class="runtime-widget">
        <header class="runtime-header">
          <div class="widget-title">
            <Bot :size="18" /> <span>{{ t('chatbot.runtime.status.chat_title') }}</span>
          </div>
          <div class="runtime-actions">
            <button class="btn-start" @click="r?.start()">
              <Play :size="14" fill="currentColor" /> {{ t('chatbot.runtime.toolbar.start') }}
            </button>
            <button class="btn-stop" @click="r?.stopChat()" :disabled="!r?.isRunning">
              <Square :size="14" fill="currentColor" /> {{ t('chatbot.runtime.toolbar.stop') }}
            </button>
          </div>
        </header>

        <main class="runtime-body">
          <div v-if="isLoading" class="status-screen">
            <Loader2 class="animate-spin status-icon" :size="48" color="#9ca3af" />
            <p>{{ t('chatbot.runtime.status.loading') }}</p>
          </div>

          <div v-else-if="fatalError" class="status-screen">
            <AlertTriangle class="status-icon" :size="48" color="#ef4444" />
            <p>{{ t('chatbot.runtime.status.unavailable') }}</p>
          </div>

          <!-- Interface unificada -->
          <ChatInterface v-else-if="r" :runtime="r" mode="runtime" />
        </main>
      </div>
    </div>
  </div>
</template>

<style>
html, body, #app { margin: 0; padding: 0; width: 100%; height: 100%; }
</style>

<style scoped>
.runtime-root { height: 100vh; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.runtime-page { flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px; overflow-y: auto; }
.runtime-widget { width: 100%; max-width: 420px; height: 640px; display: flex; flex-direction: column; background: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12); }
.runtime-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: white; border-bottom: 1px solid #e5e7eb; }
.widget-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #4b5563; font-size: 14px; }
.runtime-actions { display: flex; gap: 8px; }

.btn-start, .btn-stop { height: 32px; padding: 0 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 700; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-start { background: #10b981; color: white; }
.btn-start:hover { background: #059669; transform: translateY(-1px); }
.btn-stop { background: #ef4444; color: white; }
.btn-stop:hover { background: #dc2626; transform: translateY(-1px); }
.btn-stop:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.runtime-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.status-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 32px; text-align: center; color: #6b7280; }
.status-icon { margin-bottom: 8px; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .runtime-widget { height: 100%; max-width: 100%; border-radius: 12px; }
  .btn-start, .btn-stop { height: 30px; font-size: 11px; padding: 0 10px; }
}
</style>