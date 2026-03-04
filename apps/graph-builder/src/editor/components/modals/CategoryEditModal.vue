<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Category } from '@/shared/types';
import { useProjectStore, CATEGORY_COLORS } from '@/shared/stores/projectStore';
import { Palette, Hash } from 'lucide-vue-next';

// Prop agora é opcional. Se undefined = Modo Criação
const props = defineProps<{
  category?: Category;
}>();

const emit = defineEmits(['close']);
const store = useProjectStore();
const isEditing = computed(() => !!props.category);

// Lógica de Cor Inteligente (Sugere uma não usada)
const getSuggestedColor = () => {
  if (isEditing.value && props.category) return props.category.color;

  const used = store.usedColors;
  const freeColor = CATEGORY_COLORS.find(c => !used.has(c));
  return freeColor || CATEGORY_COLORS[0];
};

// Estado do Formulário
const formName = ref(props.category?.name || '');
const formColor = ref(getSuggestedColor());

// Foco automático no input ao abrir
const nameInput = ref<HTMLInputElement | null>(null);
const colorInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => setTimeout(() => nameInput.value?.focus(), 100));

const handleHexInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  let val = target.value;
  
  if (val.length > 0 && !val.startsWith('#')) {
    val = '#' + val;
  }
  
  if (/^#[0-9A-F]{6}$/i.test(val)) {
    formColor.value = val;
  }
};

const openNativePicker = () => {
  colorInputRef.value?.click();
};

const handleSave = () => {
  if (!formName.value.trim()) return;
  
  try {
    if (isEditing.value && props.category) {
      store.updateCategory(props.category.id, formName.value, formColor.value);
    } else {
      store.addCategory(formName.value, formColor.value);
    }
    emit('close');
  } catch (error: any) {
    alert(error.message);
  }
};

const handleDelete = () => {
  if (isEditing.value && props.category) {
    if (confirm(`Excluir a categoria "${props.category.name}" e TODOS os seus itens?`)) {
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
          v-model="formName" 
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
                active: formColor?.toLowerCase() === color.toLowerCase(), 
                used: !isEditing && store.usedColors.has(color) && formColor !== color 
              }"
              @click="formColor = color"
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
                :style="{ backgroundColor: formColor }"
                @click="openNativePicker"
                title="Clique para escolher uma cor"
              ></div>

              <!-- Input Hexadecimal (Padrão Universal) -->
              <div class="hex-input-wrapper">
                <Hash class="icon-hash" />
                <input 
                  type="text" 
                  :value="formColor" 
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
              v-model="formColor" 
              class="hidden-native-input" 
            />
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
</style>