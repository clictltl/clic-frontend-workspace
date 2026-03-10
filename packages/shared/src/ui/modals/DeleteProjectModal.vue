<template>
  <div class="modal-backdrop">
    <!-- Overlay fecha ao clicar fora -->
    <div class="modal-overlay" @click="close"></div>
    
    <div class="modal-card">
      <div class="modal-header">
        <div class="icon-container">
          <Trash2 :size="24" color="#dc2626" />
        </div>
        <h3>Excluir {{ itemName }}</h3>
        
        <p v-if="currentProjectName">
          Tem certeza de que deseja excluir o {{ itemName.toLowerCase() }} <strong>"{{ currentProjectName }}"</strong>?
        </p>
        <p v-else>
          Tem certeza de que deseja excluir este {{ itemName.toLowerCase() }}?
        </p>
        
        <p class="warning-text">Esta ação é irreversível e os dados não poderão ser recuperados.</p>
      </div>

      <div class="modal-body">
        <p v-if="error" class="error-msg">
          <AlertTriangle :size="16" class="icon" /> {{ error }}
        </p>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="close">Cancelar</button>
        <button 
          class="btn-danger" 
          @click="confirmDelete" 
          :disabled="loading"
        >
          {{ loading ? 'Excluindo...' : 'Sim, Excluir' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Trash2, AlertTriangle } from 'lucide-vue-next';
import { useToast } from '../../ui/useToast';

const props = withDefaults(defineProps<{
  projectsStore: any;
  itemName?: string;
}>(), {
  itemName: 'Projeto'
});

const emit = defineEmits(["close", "deleted"]);

const toast = useToast();
const currentProjectId = props.projectsStore.currentProjectId;
const currentProjectName = props.projectsStore.currentProjectName;
const error = props.projectsStore.error;

const loading = ref(false);

function close() {
  emit("close");
}

async function confirmDelete() {
  if (!currentProjectId.value) {
    error.value = "Nenhum projeto selecionado.";
    return;
  }

  loading.value = true;
  error.value = null; // Limpa erros anteriores

  try {
    const success = await props.projectsStore.deleteProject(currentProjectId.value);

    if (success) {
      toast.success("Projeto excluído com sucesso.");
      emit("deleted");
      emit("close");
    } else {
      // Se a função deleteProject não setou o error ref, definimos um padrão
      if (!error.value) error.value = "Erro ao excluir o projeto.";
    }
  } catch (e: any) {
    error.value = e.message || "Erro inesperado.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* --- Estrutura Modal Padrão --- */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.modal-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
}

.modal-card {
  position: relative; background: white;
  width: 100%; max-width: 400px;
  padding: 1.5rem; border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  animation: slideUp 0.3s ease-out;
  text-align: center; /* Centralizado para alertas de confirmação fica melhor */
}

/* --- Cabeçalho e Ícone --- */
.icon-container {
  background: #fef2f2;
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1rem auto;
}
.icon-danger { font-size: 24px; }

.modal-header h3 { margin: 0 0 0.5rem 0; color: #111827; font-size: 1.25rem; }
.modal-header p { margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.95rem; line-height: 1.5; }

.warning-text {
  color: #b91c1c !important; /* Vermelho escuro */
  font-size: 0.85rem !important;
  font-weight: 500;
  margin-top: 8px !important;
}

/* --- Mensagem de Erro --- */
.error-msg {
  background: #fef2f2; color: #b91c1c; font-size: 0.85rem;
  padding: 0.6rem; border-radius: 6px; margin-top: 1rem;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  text-align: left;
}

/* --- Ações --- */
.modal-actions {
  display: flex; justify-content: center; gap: 12px;
  margin-top: 1.5rem;
}

.btn-cancel {
  background: white; border: 1px solid #d1d5db; color: #374151;
  padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer;
  font-weight: 500; transition: background 0.2s;
}
.btn-cancel:hover { background: #f9fafb; }

/* Botão Danger (Vermelho) */
.btn-danger {
  background: #dc2626; border: none; color: white;
  padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer;
  font-weight: 500; transition: background 0.2s;
}
.btn-danger:hover { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.6; cursor: wait; }

@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>