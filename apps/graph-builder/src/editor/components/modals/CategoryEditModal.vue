<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Category, CategoryFormConfig } from '@/shared/types';
import { useProjectStore, CATEGORY_COLORS } from '@/shared/stores/projectStore';
import { useProjects } from '@/editor/utils/useProjects';
import { Palette, Hash, Copy, ExternalLink, Settings2, Link, Unlink, Loader2 } from 'lucide-vue-next'; // Loader2 adicionado

const props = defineProps<{ category?: Category; }>();
const emit = defineEmits(['close']);

const store = useProjectStore();
const projects = useProjects();
const isEditing = computed(() => !!props.category);

const getSuggestedColor = () => {
  if (isEditing.value && props.category) return props.category.color;
  const used = store.usedColors;
  const freeColor = CATEGORY_COLORS.find(c => !used.has(c));
  return freeColor || CATEGORY_COLORS[0];
};

// --- ESTADO DA CATEGORIA ---
const categoryName = ref(props.category?.name || '');
const categoryColor = ref(getSuggestedColor());

const nameInput = ref<HTMLInputElement | null>(null);
const colorInputRef = ref<HTMLInputElement | null>(null);

// --- ESTADO DO FORMULÁRIO (Configuração Local do JSON) ---
const formEnabled = ref(props.category?.formConfig?.enabled || false);
const formNameFieldLabel = ref(props.category?.formConfig?.nameFieldLabel || 'Qual o seu nome?');
const formTargetCategories = ref<string[]>(props.category?.formConfig?.targetCategories ||[]);

// --- ESTADO DO SERVIDOR (Efêmero, não vai pro JSON) ---
const formIsActive = ref(false);
const formExists = ref(false);
const formUrl = ref('');
const isLoadingStatus = ref(false);
const isTogglingLink = ref(false);

const eligibleCategories = computed(() => store.project.categories.filter(c => c.id !== props.category?.id));
const canActivateLink = computed(() => !!projects.currentProjectId.value && isEditing.value);

onMounted(async () => {
  setTimeout(() => nameInput.value?.focus(), 100);

  // LAZY LOADING: Busca o status do link no banco de dados ao abrir o modal
  if (canActivateLink.value && props.category?.id) {
    isLoadingStatus.value = true;
    try {
      const status = await projects.getFormStatus(props.category.id);
      if (status && status.exists) {
        formExists.value = true;
        formIsActive.value = status.is_active;
        formUrl.value = status.form_url;
        formEnabled.value = true;
      }
    } finally {
      isLoadingStatus.value = false;
    }
  }
});

const handleHexInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  let val = target.value;
  if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
  if (/^#[0-9A-F]{6}$/i.test(val)) categoryColor.value = val;
};

const openNativePicker = () => colorInputRef.value?.click();

const copyLink = () => {
  navigator.clipboard.writeText(formUrl.value);
  alert('Link copiado!');
};

// 1. AÇÃO LOCAL: Apenas salva a intenção e a configuração no arquivo (Pinia)
const handleSave = () => {
  if (!categoryName.value.trim()) return;
  
  try {
    let categoryId = props.category?.id;

    if (isEditing.value && props.category) {
      store.updateCategory(props.category.id, categoryName.value, categoryColor.value);
    } else {
      store.addCategory(categoryName.value, categoryColor.value);
      const newCategory = store.project.categories[0];
      if (!newCategory) throw new Error("Falha ao criar categoria.");
      categoryId = newCategory.id;
    }

    if (categoryId) {
      if (formEnabled.value) {
        const config: CategoryFormConfig = {
          enabled: true,
          nameFieldLabel: formNameFieldLabel.value,
          targetCategories: formTargetCategories.value
        };
        store.updateCategoryFormConfig(categoryId, config);
      } else {
        store.updateCategoryFormConfig(categoryId, undefined);
      }
    }

    emit('close');
  } catch (error: any) {
    alert(error.message);
  }
};

// 2. AÇÃO NA NUVEM: Liga ou desliga o formulário no servidor
const handleToggleLink = async (activate: boolean) => {
  if (!props.category?.id || !projects.currentProjectId.value) return;

  isTogglingLink.value = true;
  try {
    const config = {
      enabled: true,
      nameFieldLabel: formNameFieldLabel.value,
      targetCategories: formTargetCategories.value
    };

    const res = await projects.setupForm(props.category.id, config, activate);

    if (res?.success) {
      formIsActive.value = activate;
      formUrl.value = res.form_url;
      // Se ativou com sucesso uma vez, o form agora existe no banco e não pode mais ser desabilitado
      if (activate) {
        formExists.value = true;
        formEnabled.value = true;
      }
    }
  } catch (e: any) {
    alert(e.message || "Erro ao conectar com o servidor.");
  } finally {
    isTogglingLink.value = false;
  }
};

const handleDelete = async () => {
  if (isEditing.value && props.category) {
    if (confirm(`Excluir a categoria "${categoryName.value}" e TODOS os seus itens?`)) {
      if (formIsActive.value || formUrl.value) {
        await projects.deleteForm(props.category.id);
      }
      store.deleteCategory(props.category.id);
      emit('close');
    }
  }
};
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <h3>{{ isEditing ? 'Editar Categoria' : 'Nova Categoria' }}</h3>

      <div class="form-group">
        <label>Nome</label>
        <input 
          ref="nameInput"
          v-model="categoryName" 
          type="text" 
          placeholder="Ex: Introdução, Exemplos..." 
          @keyup.enter="handleSave"
        />
      </div>

      <div class="form-group">
        <label>Cor</label>
        
        <div class="color-section">
          
          <!-- 1. Paleta Rápida (Swatches) -->
          <div class="swatches">
            <div 
              v-for="color in CATEGORY_COLORS" 
              :key="color"
              class="swatch"
              :style="{ backgroundColor: color }"
              :class="{ 
                active: categoryColor?.toLowerCase() === color.toLowerCase(), 
                used: !isEditing && store.usedColors.has(color) && categoryColor !== color 
              }"
              @click="categoryColor = color"
              :title="(!isEditing && store.usedColors.has(color)) ? 'Já utilizada' : ''"
            ></div>
          </div>

          <!-- 2. Seletor Personalizado (Padronizado) -->
          <div class="custom-color-control">
            <span class="label-sm">Personalizado:</span>
            
            <div class="input-group">
              <!-- Preview Visual -->
              <div 
                class="color-preview" 
                :style="{ backgroundColor: categoryColor }"
                @click="openNativePicker"
                title="Clique para escolher uma cor"
              ></div>

              <!-- Input Hexadecimal (Padrão Universal) -->
              <div class="hex-input-wrapper">
                <Hash class="icon-hash" />
                <input 
                  type="text" 
                  :value="categoryColor" 
                  @input="handleHexInput"
                  maxlength="7"
                  class="hex-input"
                />
              </div>

              <!-- Botão Gatilho do Seletor Nativo -->
              <button class="btn-picker-trigger" @click="openNativePicker" title="Abrir seletor de cores">
                <Palette class="icon-sm" />
              </button>
            </div>
            
            <!-- Input Nativo Invisível (Backup) -->
            <input 
              ref="colorInputRef"
              type="color" 
              v-model="categoryColor" 
              class="hidden-native-input" 
            />
          </div>

        </div>
      </div>

      <!-- SEÇÃO DE FORMULÁRIO -->
      <div class="form-divider"></div>
      
      <div class="form-section">
        <div class="section-header">
          <Settings2 class="icon-xs" />
          <span>Utilizar formulário nesta categoria</span>
          <label class="switch" :title="formExists ? 'Esta categoria já possui um formulário vinculado' : ''">
            <input 
              type="checkbox" 
              v-model="formEnabled" 
              :disabled="formExists"
            >
            <span class="slider"></span>
          </label>
        </div>

        <p v-if="formExists" class="lock-notice">
          Vínculo com formulário ativo. Para remover, exclua a categoria.
        </p>

        <div v-if="formEnabled" class="form-config-box">
          <div class="form-group sm">
            <label>Pergunta do Formulário</label>
            <input v-model="formNameFieldLabel" type="text" placeholder="Ex: Qual seu nome?">
          </div>

          <div class="form-group sm">
            <label>Conectar com Categorias:</label>
            <div class="target-list">
              <label v-for="cat in eligibleCategories" :key="cat.id" class="target-item">
                <input type="checkbox" :value="cat.id" v-model="formTargetCategories">
                <span :style="{ color: cat.color }">{{ cat.name }}</span>
              </label>
            </div>
          </div>

          <!-- STATUS DO LINK (EXPLICITO) -->
          <div class="link-manager">
            
            <div v-if="!canActivateLink" class="warning-box">
              Atenção: Para gerar o link público, salve a categoria e o projeto na nuvem.
            </div>
            
            <!-- Estado de Carregamento da API -->
            <div v-else-if="isLoadingStatus" class="loading-status-box">
              <Loader2 class="icon-spin icon-sm" />
              <span>Verificando status do link...</span>
            </div>

            <div v-else>
              <div v-if="!formIsActive" class="activate-box">
                <p class="hint">A configuração viaja com o arquivo. Ative o link para começar a receber dados desta turma.</p>
                <button class="btn-activate" @click="handleToggleLink(true)" :disabled="isTogglingLink">
                  <Link class="icon-xs" /> {{ isTogglingLink ? 'Processando...' : 'Ativar Link Público' }}
                </button>
              </div>
              
              <div v-else class="active-link-box">
                <label class="active-label">Link Ativo e recebendo respostas</label>
                <div class="link-input-group">
                  <input type="text" readonly :value="formUrl">
                  <button @click="copyLink" title="Copiar link" class="btn-subtle"><Copy class="icon-xs" /></button>
                  <a :href="formUrl" target="_blank" class="btn-subtle" title="Abrir Form"><ExternalLink class="icon-xs" /></a>
                </div>
                <button class="btn-deactivate" @click="handleToggleLink(false)" :disabled="isTogglingLink">
                  <Unlink class="icon-xs" /> Desativar Link
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="actions">
        <!-- Botão excluir só aparece na edição -->
        <button v-if="isEditing" class="btn-delete" @click="handleDelete">Excluir</button>
        <div v-else></div> <!-- Spacer -->

        <div class="right-actions">
          <button class="btn-cancel" @click="emit('close')">Cancelar</button>
          <button class="btn-save" @click="handleSave">
            {{ isEditing ? 'Salvar' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: white; width: 360px;
  padding: 24px; border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

h3 { margin: 0 0 20px 0; color: #1e293b; font-size: 1.2rem; }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #64748b; margin-bottom: 8px; }
.form-group input[type="text"]:not(.hex-input) {
  width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem;
}
.form-group input:focus { outline: none; border-color: #3b82f6; }

.swatches { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.swatch {
  width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
  border: 2px solid transparent; transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.swatch:hover { transform: scale(1.1); }
.swatch.active { border-color: #1e293b; transform: scale(1.15); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.swatch.used { opacity: 0.3; transform: scale(0.9); }
.swatch.used:hover { opacity: 1; transform: scale(1.1); }

.custom-color-control {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.label-sm { font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px; display: block; }

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  width: 36px; height: 36px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.1);
}

.hex-input-wrapper {
  flex: 1;
  position: relative;
  display: flex; align-items: center;
}

.icon-hash {
  position: absolute; left: 8px; width: 14px; height: 14px; color: #94a3b8;
}

.hex-input {
  width: 100%;
  padding: 8px 8px 8px 26px; /* Espaço para o ícone hash */
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.95rem;
  text-transform: uppercase;
  color: #334155;
}

.btn-picker-trigger {
  background: white; border: 1px solid #cbd5e1;
  padding: 8px; border-radius: 6px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-picker-trigger:hover { background: #f1f5f9; border-color: #94a3b8; }
.icon-sm { width: 18px; height: 18px; color: #475569; }

.hidden-native-input {
  opacity: 0; position: absolute; pointer-events: none; width: 0; height: 0;
}

.actions { display: flex; justify-content: space-between; margin-top: 24px; align-items: center; }
.right-actions { display: flex; gap: 10px; }

button { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: background 0.2s; }
.btn-save { background: #2563eb; color: white; }
.btn-save:hover { background: #1d4ed8; }
.btn-cancel { background: #e2e8f0; color: #475569; }
.btn-cancel:hover { background: #cbd5e1; }
.btn-delete { background: transparent; color: #ef4444; padding-left: 0; }
.btn-delete:hover { text-decoration: underline; background: transparent; }

/* --- FORM CONFIG STYLES --- */
.form-divider { height: 1px; background: #e2e8f0; margin: 24px -24px 20px -24px; }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.section-header span { font-weight: 600; font-size: 0.85rem; color: #475569; flex: 1; }

.form-config-box { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
.form-group.sm { margin-bottom: 12px; }
.form-group.sm label { font-size: 0.75rem; margin-bottom: 4px; }
.form-group.sm input { padding: 6px 10px; font-size: 0.85rem; }

.target-list { display: flex; flex-direction: column; gap: 6px; max-height: 100px; overflow-y: auto; background: white; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; }
.target-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; }

/* Link Manager */
.link-manager { margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
.warning-box { background: #fffbeb; color: #b45309; font-size: 0.75rem; padding: 10px; border-radius: 6px; border: 1px solid #fde68a; }

.activate-box .hint { font-size: 0.75rem; color: #64748b; margin: 0 0 10px 0; line-height: 1.3; }
.btn-activate { display: flex; align-items: center; gap: 6px; width: 100%; justify-content: center; background: #10b981; color: white; }
.btn-activate:hover:not(:disabled) { background: #059669; }
.btn-activate:disabled { opacity: 0.6; cursor: not-allowed; }

.active-link-box .active-label { display: block; font-size: 0.75rem; font-weight: 600; color: #10b981; margin-bottom: 8px; }
.link-input-group { display: flex; gap: 6px; align-items: center; margin-bottom: 12px; }
.link-input-group input { flex: 1; font-size: 0.75rem; background: #fff; border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; color: #334155; }
.btn-subtle { display: flex; align-items: center; background: white; border: 1px solid #cbd5e1; padding: 6px; border-radius: 4px; color: #64748b; }
.btn-subtle:hover { background: #f1f5f9; color: #1e293b; }

.btn-deactivate { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; background: #fee2e2; color: #ef4444; font-size: 0.8rem; }
.btn-deactivate:hover:not(:disabled) { background: #fecaca; }

/* Switch Style */
.switch { position: relative; display: inline-block; width: 34px; height: 18px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 18px; }
.slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; }
input:checked + .slider { background-color: #3b82f6; }
input:checked + .slider:before { transform: translateX(16px); }

.section-header.is-locked {
  cursor: help;
}

.section-header.is-locked span {
  color: #6b7280; /* Texto levemente acinzentado */
}

.lock-notice {
  font-size: 11px;
  color: #9ca3af;
  margin-top: -8px;
  margin-bottom: 12px;
  padding-left: 28px; /* Alinha com o ícone de Settings2 */
}

.loading-status-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #64748b;
  font-size: 0.85rem;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>