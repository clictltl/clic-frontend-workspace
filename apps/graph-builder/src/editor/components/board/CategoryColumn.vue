<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Category } from '@/shared/types';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useProjects } from '@/editor/utils/useProjects';
import NodeCard from './NodeCard.vue';
import CategoryEditModal from '../modals/CategoryEditModal.vue';
import { Pencil, Database, DownloadCloud, RefreshCw } from 'lucide-vue-next';
import draggable from 'vuedraggable';

const props = defineProps<{
  category: Category;
}>();

const store = useProjectStore();
const projects = useProjects();

const myNodes = computed({
  get: () => store.nodesByCategory(props.category.id),
  set: (val) => store.reorderNodesInCategory(props.category.id, val)
});

const showEditModal = ref(false);

// --- LOGICA DE FORMULARIO ---
const pendingAnswers = ref<any[]>([]);
const isSyncing = ref(false);
const isFetching = ref(false);
const isFormEnabled = computed(() => !!props.category.formConfig?.enabled);

// Busca respostas no servidor que pertencem a esta categoria
const checkPendingAnswers = async () => {
  if (!isFormEnabled.value || !projects.currentProjectId.value || isFetching.value) return;

  isFetching.value = true;
  try {
    const allAnswers = await projects.getFormAnswers();
    pendingAnswers.value = allAnswers.filter((ans: any) => ans.reference_id === props.category.id);
  } catch (e) {
    console.error("Erro ao buscar respostas:", e);
  } finally {
    isFetching.value = false;
  }
};

// Processa a importacao das respostas para o grafo
const handleSyncAnswers = async () => {
  if (pendingAnswers.value.length === 0) return;
  
  isSyncing.value = true;
  try {
    // 1. Cria os nos e conexoes na store local
    const syncedIds = store.processFormAnswers(props.category.id, pendingAnswers.value);
    
    // 2. Avisa o servidor que estas respostas foram processadas
    if (syncedIds.length > 0) {
      await projects.syncFormAnswers(syncedIds);
    }
    
    // 3. Limpa a lista local
    pendingAnswers.value = [];
  } catch (e) {
    console.error("Erro ao sincronizar respostas:", e);
  } finally {
    isSyncing.value = false;
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkPendingAnswers();
  }
};

const handleAddNode = () => {
  store.addNode(props.category.id);
};

onMounted(() => {
  checkPendingAnswers();
  window.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  window.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <div class="category-column">
    <div class="column-header" :style="{ borderTopColor: category.color }">
      <div class="title-wrapper">
        <Database v-if="isFormEnabled" class="icon-form-indicator" title="Alimentada por formulário" />
        <h3 :style="{ color: category.color }">
          {{ category.name }}
        </h3>
      </div>
      
      <div class="actions">
        <span class="count">{{ myNodes.length }}</span>

        <button 
          v-if="isFormEnabled"
          class="btn-icon" 
          @click="checkPendingAnswers" 
          :class="{ 'spinning': isFetching }"
          title="Verificar novas respostas"
        >
          <RefreshCw class="icon-xs" />
        </button>
        
        <button class="btn-icon" @click="showEditModal = true" title="Editar Categoria">
          <Pencil class="icon-xs" />
        </button>
      </div>
    </div>

    <!-- BANNER DE SINCRONIZACAO -->
    <div v-if="pendingAnswers.length > 0" class="sync-banner">
      <div class="sync-info">
        <span class="sync-count">{{ pendingAnswers.length }}</span>
        <span class="sync-text">novas respostas</span>
      </div>
      <button class="btn-sync" @click="handleSyncAnswers" :disabled="isSyncing">
        <DownloadCloud class="icon-xs" />
        {{ isSyncing ? 'Importando...' : 'Importar' }}
      </button>
    </div>

    <div class="column-body">
      <draggable
        v-model="myNodes"
        item-key="id"
        group="nodes" 
        ghost-class="ghost-card"
        animation="200"
        class="nodes-draggable-area"
      >
        <template #item="{ element }">
          <NodeCard :node="element" />
        </template>
      </draggable>
    </div>

    <div class="column-footer">
      <button class="btn-add" @click="handleAddNode">
        + Adicionar Item
      </button>
    </div>

    <CategoryEditModal 
      v-if="showEditModal" 
      :category="category" 
      @close="showEditModal = false" 
    />
  </div>
</template>

<style scoped>
.category-column {
  background: #f1f5f9;
  border-radius: 8px;
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  border: 1px solid #e2e8f0;
}

.column-header {
  padding: 12px;
  background: #fff;
  border-radius: 8px 8px 0 0;
  border-top: 3px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  cursor: grab;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.icon-form-indicator {
  width: 14px;
  height: 14px;
  color: #94a3b8;
  flex-shrink: 0;
}

.column-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* SYNC BANNER STYLES */
.sync-banner {
  background: #eff6ff;
  border-bottom: 1px solid #dbeafe;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sync-count {
  background: #3b82f6;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}

.sync-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e40af;
}

.btn-sync {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-sync:hover:not(:disabled) {
  background: #2563eb;
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.btn-icon {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

.column-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.column-footer {
  padding: 10px;
}

.btn-add {
  width: 100%;
  background: transparent;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.nodes-draggable-area {
  min-height: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ghost-card {
  opacity: 0.5;
  background: #e2e8f0;
  border: 1px dashed #94a3b8;
}

.spinning {
  animation: spin 1s linear infinite;
  color: #3b82f6 !important;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>