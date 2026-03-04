<!-- src/runtime/components/ReferencesPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import { Link2 } from 'lucide-vue-next'; // Ícone de link

const store = useProjectStore();

// Computa os grupos de referências baseados no nó selecionado
const referenceGroups = computed(() => {
  const activeId = store.selectedNodeId;
  if (!activeId) return [];

  // 1. Encontra todas as conexões do nó ativo
  const connectedEdges = store.project.edges.filter(
    e => e.source === activeId || e.target === activeId
  );

  // 2. Mapeia para pegar os IDs dos vizinhos
  const neighborIds = new Set(connectedEdges.map(
    e => e.source === activeId ? e.target : e.source
  ));

  // 3. Busca os objetos completos dos nós vizinhos
  const neighbors = store.project.nodes.filter(n => neighborIds.has(n.id));

  if (neighbors.length === 0) return [];

  // 4. Agrupa por Categoria
  const groups: Record<string, typeof neighbors> = {};
  
  neighbors.forEach(node => {
    if (!groups[node.categoryId]) {
      groups[node.categoryId] = [];
    }
    groups[node.categoryId]!.push(node);
  });

  // 5. Formata para array para usar no v-for, ordenando por nome da categoria
  return Object.keys(groups).map(catId => {
    const category = store.project.categories.find(c => c.id === catId);
    return {
      category: category || { name: 'Desconhecido', color: '#ccc', id: 'unknown' },
      nodes: groups[catId]
    };
  }).sort((a, b) => a.category.name.localeCompare(b.category.name));
});

const handleNavigate = (nodeId: string) => {
  store.selectedNodeId = nodeId;
};
</script>

<template>
  <aside class="references-panel">
    <div class="panel-header">
      <h3>
        <Link2 class="icon-sm" />
        Referências
      </h3>
    </div>

    <div class="panel-content">
      <div v-if="referenceGroups.length === 0" class="empty-state">
        Nenhuma conexão encontrada.
      </div>

      <div 
        v-for="group in referenceGroups" 
        :key="group.category.id" 
        class="ref-group"
      >
        <!-- Nome da Categoria -->
        <h4 :style="{ color: group.category.color }">
          {{ group.category.name }}
        </h4>

        <!-- Lista de Links -->
        <ul>
          <li 
            v-for="node in group.nodes" 
            :key="node.id" 
            @click="handleNavigate(node.id)"
            class="ref-link"
          >
            {{ node.title }}
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.references-panel {
  width: 250px;
  min-width: 250px;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.panel-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.icon-sm { width: 16px; height: 16px; }

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.ref-group {
  margin-bottom: 20px;
}

.ref-group h4 {
  font-size: 0.8rem;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  font-weight: 700;
  opacity: 0.8;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ref-link {
  display: block;
  padding: 6px 10px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #334155;
  transition: all 0.2s;
}

.ref-link:hover {
  border-color: #3b82f6;
  color: #2563eb;
  transform: translateX(-2px);
  box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
}

.empty-state {
  color: #94a3b8;
  font-size: 0.9rem;
  font-style: italic;
  text-align: center;
  margin-top: 20px;
}
</style>