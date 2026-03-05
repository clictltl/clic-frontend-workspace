<template>
  <div class="modal-backdrop">
    <div class="modal-overlay" @click="$emit('close')"></div>

    <div class="modal-card">
      <div class="modal-header">
        <div class="icon-container" :class="{ 'inactive': !isActive }">
          <span class="icon">{{ isActive ? '🚀' : '💤' }}</span>
        </div>
        
        <h3>
          <span v-if="isActive">Chatbot Publicado</span>
          <span v-else-if="exists">Publicação Pausada</span>
          <span v-else>Publicar Chatbot</span>
        </h3>
      </div>

      <div class="modal-body">
        
        <div v-if="loading" class="state-container">
          <span class="spinner"></span><span>{{ loadingText }}</span>
        </div>
        <div v-else-if="error" class="error-msg">
          <span class="icon">⚠️</span> {{ error }}
        </div>

        <!-- MODO GERENCIAMENTO -->
        <div v-else-if="exists || isActive" class="success-content">
          
          <div class="success-banner" v-if="isActive">
            <p class="success-title">Chatbot Online</p>
            <p class="success-date">Versão de {{ formatDate(result.published_at) }}</p>
          </div>
          <div class="success-banner warning" v-else>
            <p class="success-title">Chatbot Offline</p>
            <p class="success-date">Última versão: {{ formatDate(result.published_at) }}</p>
          </div>

          <label class="input-label">Link Público</label>
          <div class="input-group" :class="{ 'disabled': !isActive }">
            <input ref="inputRef" readonly class="input-copy" :value="result.publish_url" @click="handleInputClick" :disabled="!isActive"/>
            <button class="btn-copy" @click="copyToClipboard" title="Copiar" :disabled="!isActive"><span class="icon">📋</span></button>
          </div>

          <p class="helper-text" v-if="isActive">
            Se fez alterações, clique em "Atualizar" para salvar e sincronizar.
          </p>
          <p class="helper-text" v-else>
            Deseja restaurar a versão antiga ou salvar e publicar suas novas alterações?
          </p>

          <div class="actions-row">
            <!-- BOTÃO ESQUERDO: Despublicar OU Restaurar -->
            <button 
              v-if="isActive" 
              class="btn-danger-outline" 
              @click="handleUnpublish" 
              title="Desativar chatbot"
            >
              Despublicar
            </button>
            
            <button 
              v-else 
              class="btn-secondary" 
              @click="handleReactivateOnly"
              title="Liga o bot como estava antes, sem salvar alterações atuais"
            >
              Restaurar Anterior
            </button>
            
            <div class="right-actions">
              <button class="btn-secondary" @click="$emit('close')">Fechar</button>
              
              <!-- BOTÃO DIREITO: Atualizar / Publicar Nova -->
              <button 
                class="btn-primary" 
                @click="handlePublishOrUpdate"
                :disabled="!isActive && !exists"
              >
                {{ isActive ? 'Atualizar' : 'Publicar Nova Versão' }}
              </button>
            </div>
          </div>
        </div>

        <!-- MODO CRIAÇÃO -->
        <div v-else class="empty-state">
          <p class="description-text">
            Este chatbot nunca foi publicado.
            Publique para gerar um link único de acesso.
          </p>
          <div class="actions-center">
            <button class="btn-secondary" @click="$emit('close')" style="margin-right: 10px;">Cancelar</button>
            <button class="btn-primary large" @click="handlePublishOrUpdate">Publicar</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, onMounted } from 'vue';
import { useProjects } from '@/editor/utils/useProjects';
import { useToast } from '@clic/shared';

const emit = defineEmits(['close']);
const projects = useProjects();
const toast = useToast();
const { error } = toRefs(projects);

const result = ref<any>(null);
const loading = ref(true);
const loadingText = ref('Verificando status...');
const isActive = ref(false);
const exists = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  loadingText.value = 'Verificando status...';
  loading.value = true;
  try {
    const status = await projects.getPublishStatus();
    exists.value = status?.exists || false;
    if (status && status.exists) {
      result.value = status;
      isActive.value = status.is_active;
    } else {
      isActive.value = false;
    }
  } finally {
    loading.value = false;
  }
});

// Ação 1: Publicar Nova Versão (Salva + Sobrescreve)
async function handlePublishOrUpdate() {
  loadingText.value = 'Salvando e publicando...';
  loading.value = true;
  try {
    const saved = await projects.saveProject();
    if (!saved) {
      toast.error("Erro ao salvar.");
      loading.value = false;
      return;
    }
    const res = await projects.publishProject(); // Default: only_reactivate = false
    if (res) {
      result.value = res;
      isActive.value = true;
      exists.value = true;
      toast.success(res.existing ? "Nova versão publicada!" : "Publicado!");
    }
  } catch (e) { console.error(e); } finally { loading.value = false; }
}

// Ação 2: Apenas Reativar (Não Salva, Não Sobrescreve)
async function handleReactivateOnly() {
  loadingText.value = 'Restaurando versão...';
  loading.value = true;
  try {
    const res = await projects.publishProject({ only_reactivate: true });
    if (res) {
      result.value = res;
      isActive.value = true;
      exists.value = true;
      toast.success("Versão anterior restaurada e online!");
    }
  } catch (e) { console.error(e); } finally { loading.value = false; }
}

async function handleUnpublish() {
  if (!confirm("O link parará de funcionar. Continuar?")) return;
  loadingText.value = 'Desativando...';
  loading.value = true;
  try {
    const success = await projects.unpublishProject();
    if (success) { 
      isActive.value = false; 
      toast.success("Despublicado.");
    }
  } finally { loading.value = false; }
}

function handleInputClick() { if(isActive.value) inputRef.value?.select(); }
function copyToClipboard() { if (result.value && isActive.value) { navigator.clipboard.writeText(result.value.publish_url); toast.success('Copiado!'); handleInputClick(); } }
function formatDate(dateStr: string) { try { return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return dateStr; } }
</script>

<style scoped>
/* CSS Mantido - Igual ao anterior */
.modal-backdrop { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
.modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); }
.modal-card { position: relative; background: white; width: 100%; max-width: 440px; padding: 1.5rem; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: slideUp 0.3s ease-out; text-align: center; }

.modal-header h3 { margin: 0 0 1rem 0; color: #111827; font-size: 1.25rem; }
.icon-container { background: #ecfdf5; color: #059669; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; transition: all 0.3s; }
.icon-container.inactive { background: #f3f4f6; color: #9ca3af; }
.icon-container .icon { font-size: 28px; }

.state-container { padding: 2rem 0; display: flex; flex-direction: column; align-items: center; gap: 10px; color: #6b7280; }
.spinner { width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite; }
.error-msg { background: #fef2f2; color: #b91c1c; padding: 0.8rem; border-radius: 6px; }

.success-banner { margin-bottom: 1.2rem; }
.success-banner.warning .success-title { color: #d97706; }
.success-title { font-weight: 600; color: #059669; font-size: 1.1rem; margin: 0; }
.success-date { font-size: 0.8rem; color: #9ca3af; margin-top: 4px; }

.description-text { color: #6b7280; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; }
.input-label { display: block; text-align: left; margin-bottom: 6px; font-size: 0.85rem; font-weight: 500; color: #374151; }
.input-group { display: flex; gap: 8px; margin-bottom: 1rem; transition: opacity 0.3s; }
.input-group.disabled { opacity: 0.6; pointer-events: none; }
.input-copy { flex: 1; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; outline: none; }
.btn-copy { background: white; border: 1px solid #d1d5db; width: 40px; border-radius: 6px; cursor: pointer; }

.helper-text { font-size: 0.8rem; color: #6b7280; margin-bottom: 1.5rem; }

.actions-row { display: flex; align-items: center; justify-content: space-between; margin-top: 1.2rem; padding-top: 1.2rem; border-top: 1px solid #f3f4f6; gap: 10px; }
.right-actions { display: flex; gap: 10px; }
.actions-center { display: flex; justify-content: center; margin-top: 1.5rem; }

.btn-primary { background: #059669; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s; }
.btn-primary:hover { background: #047857; }
.btn-primary:disabled { background-color: #9ca3af; cursor: not-allowed; opacity: 0.7; }
.btn-primary.large { padding: 0.8rem 2rem; font-size: 1rem; }

.btn-secondary { background: white; border: 1px solid #d1d5db; color: #374151; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
.btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

.btn-danger-outline { background: white; border: 1px solid #dc2626; color: #dc2626; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s; }
.btn-danger-outline:hover { background: #fef2f2; border-color: #b91c1c; }

.btn-success-outline { background: white; border: 1px solid #059669; color: #059669; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s; }
.btn-success-outline:hover { background: #ecfdf5; border-color: #047857; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>