<template>
  <div class="modal-backdrop">
    <div class="modal-overlay" @click="$emit('close')"></div>
    
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ titleText }}</h3>
        <p>{{ descriptionText }}</p>
      </div>

      <div class="modal-body">
        <label>Nome do {{ itemLabel }}</label>
        <input 
          ref="inputRef"
          v-model="projectName" 
          @keyup.enter="handleConfirm"
          :placeholder="placeholderText" 
          class="input-modern"
        />

        <p v-if="error" class="error-msg">
          <AlertTriangle :size="16" class="icon" /> {{ error }}
        </p>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" @click="$emit('close')">Cancelar</button>
        <button class="btn-confirm" @click="handleConfirm" :disabled="loading">
          {{ loading ? 'Salvando...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  mode?: 'create' | 'copy';
  itemName?: string; // Ex: 'Chatbot' ou 'Grafo' (Padrão: 'Projeto')
  projectsStore: any; // Instância do useSharedProjects enviada pelo FileMenu
}>(), {
  mode: 'create',
  itemName: 'Projeto'
});

const emit = defineEmits(['close', 'success']);

const projectName = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// Lógica de Texto Dinâmico Genérica
const itemLabel = computed(() => props.itemName);
const isCreateMode = computed(() => props.mode === 'create');

const titleText = computed(() => 
  isCreateMode.value ? `Salvar ${itemLabel.value}` : 'Salvar como...'
);

const descriptionText = computed(() => 
  isCreateMode.value 
    ? `Dê um nome para o seu novo ${itemLabel.value.toLowerCase()} para salvá-lo.` 
    : `Crie uma cópia deste ${itemLabel.value.toLowerCase()} com um novo nome.`
);

const placeholderText = computed(() => 
  isCreateMode.value ? `Ex: Meu ${itemLabel.value}` : `Ex: ${itemLabel.value} v2`
);

const confirmText = computed(() => 
  isCreateMode.value ? 'Salvar' : 'Criar Cópia'
);

onMounted(() => {
  // Pré-preenche com o nome atual se for um projeto novo/fantasma
  if (isCreateMode.value && props.projectsStore?.currentProjectName) {
    // Garante compatibilidade caso currentProjectName seja passado como Ref bruto ou valor reativo
    const name = props.projectsStore.currentProjectName.value ?? props.projectsStore.currentProjectName;
    if (typeof name === 'string' && name.trim() !== '') {
      projectName.value = name;
    }
  }

  inputRef.value?.focus();
});

async function handleConfirm() {
  if (!projectName.value.trim()) {
    error.value = "O nome não pode estar vazio.";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // O modal chama o método pela prop injetada
    const result = await props.projectsStore.saveProjectAs(projectName.value);
    
    if (result) {
      emit('success');
      emit('close');
    } else {
      error.value = props.projectsStore.error?.value || "Erro ao salvar.";
    }
  } catch (e: any) {
    error.value = e.message || "Erro inesperado.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
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
}

.modal-header h3 { margin: 0 0 0.5rem 0; color: #111827; }
.modal-header p { margin: 0 0 1rem 0; color: #6b7280; font-size: 0.9rem; }

.input-modern {
  width: 100%; padding: 0.6rem 0.8rem; margin-top: 0.4rem;
  border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 0.95rem; outline: none; transition: border 0.2s;
}
.input-modern:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

.error-msg {
  background: #fef2f2; color: #b91c1c; font-size: 0.85rem;
  padding: 0.6rem; border-radius: 6px; margin-top: 1rem;
  display: flex; align-items: center; gap: 6px;
}
.error-msg .icon { flex-shrink: 0; }

.modal-actions {
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem;
}

.btn-cancel {
  background: white; border: 1px solid #d1d5db; color: #374151;
  padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;
}
.btn-cancel:hover { background: #f9fafb; }

.btn-confirm {
  background: #2563eb; border: none; color: white;
  padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500;
}
.btn-confirm:hover { background: #1d4ed8; }
.btn-confirm:disabled { opacity: 0.7; cursor: not-allowed; }

@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>