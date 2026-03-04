<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Category } from '@/shared/types';
import { useProjectStore } from '@/shared/stores/projectStore';
import NodeCard from './NodeCard.vue';
import CategoryEditModal from '../modals/CategoryEditModal.vue';
import { Pencil } from 'lucide-vue-next';
import draggable from 'vuedraggable';

const props = defineProps<{
  category: Category;
}>();

const store = useProjectStore();
const myNodes = computed({
  get: () => store.nodesByCategory(props.category.id),
  set: (val) => store.reorderNodesInCategory(props.category.id, val)
});
const showEditModal = ref(false);

const handleAddNode = () => {
  store.addNode(props.category.id);
};
</script>

<template>
  <div class="category-column">
    <div class="column-header" :style="{ borderTopColor: category.color }">
      <!-- Nome e Cor -->
      <h3 :style="{ color: category.color }">
        {{ category.name }}
      </h3>
      
      <div class="actions">
        <span class="count">{{ myNodes.length }}</span>
        
        <!-- Botão de Edição (Lápis) -->
        <button class="btn-icon" @click="showEditModal = true" title="Editar Categoria">
          <Pencil class="icon-xs" />
        </button>
      </div>
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

    <!-- Modal de Edição -->
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

.column-header:active {
  cursor: grabbing;
}

.column-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  transition: all 0.2s;
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
  transition: background 0.2s;
  font-size: 0.9rem;
}

.btn-add:hover {
  background: #e2e8f0;
  color: #334155;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.nodes-draggable-area {
  min-height: 10px; /* Garante área de drop mesmo vazia */
  display: flex;
  flex-direction: column;
  gap: 0; /* O gap é controlado pela margin do NodeCard ou aqui */
  height: 100%;
}

.ghost-card {
  opacity: 0.5;
  background: #e2e8f0;
  border: 1px dashed #94a3b8;
}
</style>