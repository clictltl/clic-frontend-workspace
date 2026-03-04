<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import CategoryColumn from '@/editor/components/board/CategoryColumn.vue';
import PropertiesPanel from '@/editor/components/panels/PropertiesPanel.vue';
import CategoryEditModal from '@/editor/components/modals/CategoryEditModal.vue';
import { Plus } from 'lucide-vue-next';
import draggable from 'vuedraggable';

const store = useProjectStore();
const showCreateModal = ref(false);
const myCategories = computed({
  get: () => store.project.categories,
  set: (val) => store.reorderCategories(val)
});

</script>

<template>
  <div class="editor-layout">
    
    <div class="board-container">
      <div class="board-canvas">
        
        <div class="add-column-placeholder sticky-column">
          <button @click="showCreateModal = true" class="btn-create-col">
            <div class="icon-circle">
              <Plus class="icon-lg" />
            </div>
            <span>Nova Categoria</span>
          </button>
        </div>

         <draggable 
          v-model="myCategories" 
          item-key="id"
          direction="horizontal"
          class="draggable-flex"
          handle=".column-header"
          animation="200"
          ghost-class="ghost-card"
        >
          <template #item="{ element }">
            <CategoryColumn :category="element" />
          </template>
        </draggable>
      </div>
    </div>

    <div class="panel-container">
      <PropertiesPanel />
    </div>
     
    <CategoryEditModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false" 
    />

  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  background-color: #f8fafc;
}

.board-container {
  flex: 1; 
  overflow-x: auto; 
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 20px 20px;
  padding: 20px;
}

.board-canvas {
  display: flex;
  gap: 16px;
  height: 100%;
  align-items: flex-start;
  padding-right: 40px;
}

.draggable-flex {
  display: flex;
  gap: 16px;
  height: 100%;
  align-items: flex-start;
}

.ghost-card {
  opacity: 0.5;
  background: #e2e8f0;
  border: 2px dashed #94a3b8;
}

.panel-container {
  width: 360px;
  min-width: 360px;
  background: white;
  box-shadow: -5px 0 25px rgba(0,0,0,0.05);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.add-column-placeholder {
  min-width: 280px;
  height: 100%;
}

.sticky-column {
  position: sticky;
  left: 0;
  z-index: 10;
}

.btn-create-col {
  width: 100%;
  height: 140px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 5px 0 15px rgba(0,0,0,0.05);
}

.btn-create-col:hover {
  background: #fff;
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 5px 4px 20px rgba(59, 130, 246, 0.15);
}

.icon-circle {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-create-col:hover .icon-circle {
  background: #dbeafe;
}

.icon-lg {
  width: 24px;
  height: 24px;
}
</style>