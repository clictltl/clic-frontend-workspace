<script setup lang="ts">
import type { Node } from '@/shared/types';
import { useProjectStore } from '@/shared/stores/projectStore';

// Recebe o objeto "Node" inteiro como propriedade
const props = defineProps<{
  node: Node;
}>();

const store = useProjectStore();

// Quando clicar, define este nó como "Ativo" na store
const handleClick = () => {
  store.selectedNodeId = props.node.id;
};
</script>

<template>
  <div 
    class="node-card" 
    :class="{ 'is-selected': store.selectedNodeId === node.id }"
    @click="handleClick"
  >
    <div class="card-header">
      <span class="card-title">{{ node.title }}</span>
    </div>
    <!-- Futuramente aqui vai um resumo do conteúdo -->
  </div>
</template>

<style lang="scss" scoped>
.node-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  &.is-selected {
    border-color: #3b82f6; // Azul
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .card-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: #334155;
  }
}
</style>