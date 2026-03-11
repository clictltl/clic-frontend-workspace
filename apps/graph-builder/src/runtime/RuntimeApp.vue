<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ReaderLayout from './layouts/ReaderLayout.vue';
import FormLayout from './layouts/FormLayout.vue';
import { ToastContainer } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { Loader2, AlertCircle } from 'lucide-vue-next';

const isLoading = ref(true);
const fatalError = ref<string | null>(null);
const store = useProjectStore();

// Estado do Roteador Interno
const routeType = ref<'reader' | 'form' | null>(null);
const routeToken = ref<string>('');

// Dados exclusivos do formulário
const formPayload = ref<any>(null);

// ===== Utils =====
function parseUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  
  const pIndex = parts.lastIndexOf('p');
  if (pIndex !== -1 && parts[pIndex + 1]) {
    routeType.value = 'reader';
    routeToken.value = parts[pIndex + 1] || '';
    return;
  }

  const formIndex = parts.lastIndexOf('form');
  if (formIndex !== -1 && parts[formIndex + 1]) {
    routeType.value = 'form';
    routeToken.value = parts[formIndex + 1] || '';
    return;
  }
}

// ===== Fetch =====
async function loadData() {
  parseUrl();
  
  if (!routeType.value || !routeToken.value) {
    fatalError.value = 'INVALID_TOKEN';
    isLoading.value = false;
    return;
  }

  try {
    const restRoot = window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/graph-builder/';

    // Rota 1: Leitor do Grafo (/p/)
    if (routeType.value === 'reader') {
      const res = await fetch(`${restRoot}publish/${routeToken.value}`);
      if (!res.ok) throw new Error('INVALID_TOKEN');
      
      const json = await res.json();
      if (json.success && json.project && json.project.data) {
        store.loadProject(json.project.data);
      } else {
        throw new Error('INVALID_DATA');
      }
    } 
    
    // Rota 2: Formulário Público (/form/)
    else if (routeType.value === 'form') {
      const res = await fetch(`${restRoot}forms/${routeToken.value}`);
      if (!res.ok) throw new Error('FORM_NOT_FOUND');
      
      const json = await res.json();
      if (json.success && json.form && json.project) {
        formPayload.value = json; // Guarda { form: {}, project: {} } para o FormLayout
      } else {
        throw new Error('INVALID_DATA');
      }
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
    case 'INVALID_TOKEN': return 'Grafo não encontrado ou link inválido.';
    case 'FORM_NOT_FOUND': return 'Este formulário não existe ou foi desativado pelo professor.';
    case 'INVALID_DATA': return 'O arquivo de dados está corrompido.';
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
      <p>Carregando...</p>
    </div>

    <!-- ESTADO: ERRO FATAL -->
    <div v-else-if="fatalError" class="feedback-screen error">
      <AlertCircle :size="48" color="#ef4444" />
      <h2>Ops!</h2>
      <p>{{ errorMessage() }}</p>
    </div>

    <!-- ESTADO: SUCESSO (Renderiza baseado na URL) -->
    <template v-else>
      <ReaderLayout v-if="routeType === 'reader'" />
      
      <FormLayout 
        v-else-if="routeType === 'form' && formPayload" 
        :form-config="formPayload.form"
        :project-data="formPayload.project.data"
        :token="routeToken"
      />
    </template>

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
}

.runtime-root { height: 100vh; display: flex; flex-direction: column; }

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