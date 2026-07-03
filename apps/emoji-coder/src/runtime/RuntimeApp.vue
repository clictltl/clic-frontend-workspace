<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { ToastContainer } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { Loader2, AlertCircle } from '@lucide/vue';
import ExecutionPlayer from '@/shared/components/ExecutionPlayer.vue';

const isLoading = ref(true);
const fatalError = ref<string | null>(null);
const store = useProjectStore();
const routeToken = ref<string>('');

// No modo publicado (Runtime), voltar ao início significa recarregar ou voltar para a raiz
const handleRuntimeHome = () => {
  window.location.href = window.location.pathname;
};
provide('goHomeAction', handleRuntimeHome);

function parseUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const pIndex = parts.lastIndexOf('p');
  if (pIndex !== -1 && parts[pIndex + 1]) {
    routeToken.value = parts[pIndex + 1] || '';
  }
}

async function loadData() {
  parseUrl();
  
  if (!routeToken.value) {
    fatalError.value = 'INVALID_TOKEN';
    isLoading.value = false;
    return;
  }

  try {
    const restRoot = (window as any).CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/emoji-coder/';

    const res = await fetch(`${restRoot}publish/${routeToken.value}`);
    if (!res.ok) throw new Error('INVALID_TOKEN');
    
    const json = await res.json();
    if (json.success && json.project && json.project.data) {
      store.loadProject(json.project.data);
    } else {
      throw new Error('INVALID_DATA');
    }

  } catch (err: any) {
    fatalError.value = err.message || 'NETWORK_ERROR';
    console.error('Erro ao carregar dados:', err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadData();
});

const errorMessage = () => {
  switch (fatalError.value) {
    case 'INVALID_TOKEN': return 'Projeto não encontrado ou link inválido.';
    case 'INVALID_DATA': return 'O arquivo do projeto está corrompido.';
    case 'NETWORK_ERROR': return 'Erro de conexão. Verifique sua internet.';
    default: return 'Ocorreu um erro desconhecido.';
  }
};
</script>

<template>
  <div class="runtime-root">
    
    <!-- ESTADO: CARREGANDO -->
    <div v-if="isLoading" class="feedback-screen">
      <Loader2 class="spinner" :size="48" color="#3b82f6" />
      <p>Carregando Projeto...</p>
    </div>

    <!-- ESTADO: ERRO FATAL -->
    <div v-else-if="fatalError" class="feedback-screen error">
      <AlertCircle :size="48" color="#ef4444" />
      <h2>Ops!</h2>
      <p>{{ errorMessage() }}</p>
    </div>

    <!-- ESTADO: SUCESSO -->
    <!-- Renderizamos o Player Universal marcando-o como isRuntime = true -->
    <ExecutionPlayer v-else :is-runtime="true" />

    <ToastContainer />
  </div>
</template>

<style>
/* CSS Reset Global para o Runtime */
html, body, #app {
  margin: 0; padding: 0; width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f9fafb;
  color: #1f2937;
  overscroll-behavior-y: none;
}

.runtime-root { height: 100vh; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }

.feedback-screen {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; color: #4b5563;
}

.feedback-screen h2 { margin: 0; font-size: 24px; color: #1f2937; }
.feedback-screen p { margin: 0; font-size: 16px; text-align: center; max-width: 400px; }
.feedback-screen.error { color: #ef4444; }

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>