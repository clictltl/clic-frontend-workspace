<template>
  <div class="modal-backdrop">
    <div class="modal-overlay" @click="$emit('close')"></div>
    
    <div class="modal-card">
      <div class="modal-header">
        <!-- Ícone muda de cor conforme status -->
        <div class="icon-container" :class="{ 'inactive': !isActive }">
          <Link :size="24" class="icon" />
        </div>
        
        <!-- Título Dinâmico -->
        <h3>
          <span v-if="isActive">Compartilhamento Ativo</span>
          <span v-else-if="exists">Compartilhamento Desativado</span>
          <span v-else>Compartilhar {{ itemName }}</span>
        </h3>
      </div>

      <div class="modal-body">
        
        <div v-if="loading" class="state-container">
          <span class="spinner"></span>
          <span>{{ loadingText }}</span>
        </div>

        <div v-else-if="error" class="error-msg">
          <AlertTriangle :size="16" class="icon" /> {{ error }}
        </div>

        <!-- MODO GERENCIAMENTO (Se já existe ou está ativo) -->
        <div v-else-if="exists || isActive" class="share-content">
          
          <p class="description-text" v-if="isActive">
            O link está ativo. Qualquer pessoa com a URL abaixo pode acessar o {{ itemName.toLowerCase() }}.
          </p>
          <p class="description-text warning" v-else>
            O link está desativado. Reative para permitir o acesso novamente.
          </p>

          <label class="input-label">Link Público</label>
          <div class="input-group" :class="{ 'disabled': !isActive }">
            <input
              ref="inputRef"
              readonly
              class="input-copy"
              :value="shareUrl"
              @click="handleInputClick"
              :disabled="!isActive"
            />
            <button 
              class="btn-copy" 
              @click="copyToClipboard" 
              title="Copiar"
              :disabled="!isActive"
            >
              <Copy :size="18" class="icon" />
            </button>
          </div>
          
          <div class="actions-row">
            <!-- BOTÃO ALTERNÁVEL (TOGGLE) -->
            
            <button 
              v-if="isActive" 
              class="btn-danger-outline" 
              @click="handleUnshare"
            >
              Desativar Link
            </button>

            <button 
              v-else 
              class="btn-success-outline" 
              @click="handleReactivate"
            >
              Reativar Link
            </button>

            <button class="btn-primary" @click="$emit('close')">
              Concluído
            </button>
          </div>
        </div>

        <!-- MODO CRIAÇÃO (Primeira vez apenas) -->
        <div v-else class="empty-state">
          <p class="description-text">
            Nenhum link gerado anteriormente.
            Gere um link para permitir que outros visualizem este {{ itemName.toLowerCase() }}.
          </p>

          <div class="actions-center">
            <button class="btn-secondary" @click="$emit('close')" style="margin-right: 10px;">
              Cancelar
            </button>
            <button class="btn-primary large" @click="handleGenerateLink">
              Gerar Link
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Link, AlertTriangle, Copy } from 'lucide-vue-next';
import { useToast } from '@clic/shared';

const props = withDefaults(defineProps<{
  projectsStore: any;
  itemName?: string;
}>(), {
  itemName: 'Projeto'
});

const emit = defineEmits(['close']);
const toast = useToast();
const error = props.projectsStore.error;

const shareUrl = ref<string | null>(null);
const isActive = ref(false);
const exists = ref(false);
const loading = ref(true);
const loadingText = ref('Verificando...');
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    const status = await props.projectsStore.getShareStatus();
    
    exists.value = status?.exists || false;
    
    if (status && status.exists) {
      shareUrl.value = status.share_url;
      isActive.value = status.is_active;
    } else {
      isActive.value = false;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

// Ação Inicial (Primeira vez)
async function handleGenerateLink() {
  await executeShare("Link gerado!");
}

// Ação de Reativar (Mesma API, mensagem diferente)
async function handleReactivate() {
  await executeShare("Link reativado com sucesso!");
}

async function executeShare(successMsg: string) {
  loadingText.value = 'Processando...';
  loading.value = true;
  try {
    const res = await props.projectsStore.shareProject();
    if (res && res.share_url) {
      shareUrl.value = res.share_url;
      isActive.value = true;
      exists.value = true;
      toast.success(successMsg);
    }
  } finally {
    loading.value = false;
  }
}

async function handleUnshare() {
  if (!confirm("O link ficará inacessível. Você poderá reativá-lo depois.")) return;

  loadingText.value = 'Desativando...';
  loading.value = true;
  try {
    const success = await props.projectsStore.unshareProject();
    if (success) {
      isActive.value = false;
      toast.success("Link desativado.");
    }
  } finally {
    loading.value = false;
  }
}

function handleInputClick() { if(isActive.value) inputRef.value?.select(); }

async function copyToClipboard() {
  if (!shareUrl.value || !isActive.value) return;
  await navigator.clipboard.writeText(shareUrl.value);
  toast.success("Copiado!");
  handleInputClick();
}
</script>

<style scoped>
/* Estilos Base */
.modal-backdrop { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); }
.modal-card { position: relative; background: white; width: 100%; max-width: 420px; padding: 1.5rem; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s ease-out; text-align: center; }

.modal-header h3 { margin: 0 0 0.5rem 0; color: #111827; font-size: 1.25rem; }
.icon-container { background: #eff6ff; color: #2563eb; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; transition: all 0.3s; }

.icon-container.inactive { background: #f3f4f6; color: #9ca3af; } /* Cinza quando inativo */
.icon-container .icon { font-size: 24px; }

.state-container { padding: 2rem 0; display: flex; flex-direction: column; align-items: center; gap: 10px; color: #6b7280; }
.spinner { width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
.error-msg { background: #fef2f2; color: #b91c1c; padding: 0.8rem; border-radius: 6px; }

.description-text { color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; }
.description-text.warning { color: #d97706; } /* Laranja para aviso de pausado */

.input-label { display: block; text-align: left; margin-bottom: 6px; font-size: 0.85rem; font-weight: 500; color: #374151; }
.input-group { display: flex; gap: 8px; margin-bottom: 1.5rem; transition: opacity 0.3s; }
.input-group.disabled { opacity: 0.6; pointer-events: none; } /* Visualmente desabilitado */

.input-copy { flex: 1; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; outline: none; }
.btn-copy { background: white; border: 1px solid #d1d5db; width: 40px; border-radius: 6px; cursor: pointer; }

.actions-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 1.2rem; margin-top: 1rem; gap: 10px; }
.actions-center { display: flex; justify-content: center; margin-top: 1rem; }

.btn-primary { background: #2563eb; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary.large { padding: 0.8rem 2rem; }

.btn-secondary { background: white; border: 1px solid #d1d5db; color: #374151; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; }
.btn-secondary:hover { background: #f9fafb; }

.btn-danger-outline {
  background: white; border: 1px solid #dc2626; color: #dc2626;
  padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.9rem;
}
.btn-danger-outline:hover { background: #fef2f2; border-color: #b91c1c; }

.btn-success-outline {
  background: white; border: 1px solid #059669; color: #059669;
  padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.9rem;
}
.btn-success-outline:hover { background: #ecfdf5; border-color: #047857; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>