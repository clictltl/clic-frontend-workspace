<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ReaderLayout from './layouts/ReaderLayout.vue';
import { ToastContainer } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { Loader2, AlertCircle } from 'lucide-vue-next';

const isLoading = ref(true);
const fatalError = ref<string | null>(null);
const store = useProjectStore();

// ===== Utils =====
function extractTokenFromPath(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const pIndex = parts.lastIndexOf('p');
  return pIndex !== -1 ? parts[pIndex + 1] ?? null : null;
}

// ===== Fetch =====
async function loadProject() {
  const token = extractTokenFromPath();
  
  if (!token) {
    fatalError.value = 'INVALID_TOKEN';
    isLoading.value = false;
    return;
  }

  try {
    // Busca a rota do Core WP, com fallback para ambiente de dev local
    const restRoot = window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/graph-builder/';

    const res = await fetch(restRoot + 'publish/' + token);

    if (!res.ok) {
      fatalError.value = 'INVALID_TOKEN';
      return;
    }

    const json = await res.json();
    
    if (json.success && json.project && json.project.data) {
      // Injeta os dados do grafo na Store de leitura do Runtime
      store.loadProject(json.project.data);
    } else {
      fatalError.value = 'INVALID_DATA';
    }

  } catch (err) {
    fatalError.value = 'NETWORK_ERROR';
    console.error('Erro ao carregar grafo:', err);
  } finally {
    isLoading.value = false;
  }
}

// Inicia o fetch assim que o app é montado na tela do aluno
onMounted(() => {
  loadProject();
});

// ===== Tratamento de Mensagens de Erro =====
const errorMessage = () => {
  switch (fatalError.value) {
    case 'INVALID_TOKEN': return 'Grafo não encontrado ou link inválido.';
    case 'INVALID_DATA': return 'O arquivo deste grafo está corrompido.';
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
      <p>Carregando grafo...</p>
    </div>

    <!-- ESTADO: ERRO FATAL -->
    <div v-else-if="fatalError" class="feedback-screen error">
      <AlertCircle :size="48" color="#ef4444" />
      <h2>Ops!</h2>
      <p>{{ errorMessage() }}</p>
    </div>

    <!-- ESTADO: SUCESSO (Grafo renderizado) -->
    <ReaderLayout v-else />

    <ToastContainer />
  </div>
</template>

<style>
/* CSS Reset Global para o Runtime */
html, body, #app {
  margin: 0; padding: 0; width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f9fafb; /* Fundo suave para leitura */
  color: #1f2937;
}

.runtime-root { height: 100vh; display: flex; flex-direction: column; }

/* Telas de Feedback (Loading / Error) */
.feedback-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #4b5563;
}

.feedback-screen h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.feedback-screen p {
  margin: 0;
  font-size: 16px;
}

.feedback-screen.error {
  color: #ef4444;
}

/* Animação do Spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>