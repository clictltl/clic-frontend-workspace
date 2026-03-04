<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import { Trash2, MousePointerClick, ChevronRight, FileEdit } from 'lucide-vue-next';
import ContentEditorModal from '../modals/ContentEditorModal.vue';

const store = useProjectStore();

// O nó atualmente selecionado
const activeNode = computed(() => store.activeNode);

// Estado para controlar quais categorias estão abertas na lista
const expandedCategories = ref<Set<string>>(new Set());

const showEditor = ref(false); 

// Alterna o estado de expansão de uma categoria
const toggleCategory = (catId: string) => {
  const newSet = new Set(expandedCategories.value);
  if (newSet.has(catId)) {
    newSet.delete(catId);
  } else {
    newSet.add(catId);
  }
  expandedCategories.value = newSet;
};

// Computada que agrupa os nós elegíveis por categoria
const connectionGroups = computed(() => {
  if (!activeNode.value) return [];

  const currentCategoryId = activeNode.value.categoryId;

  // 1. Pega todas as categorias, EXCETO a do nó atual (Regra de Negócio)
  const eligibleCategories = store.project.categories.filter(
    c => c.id !== currentCategoryId
  );

  // 2. Mapeia para um formato { category, nodes[] }
  return eligibleCategories.map(cat => {
    // Pega os nós desta categoria
    const nodes = store.project.nodes.filter(n => n.categoryId === cat.id);
    return {
      category: cat,
      nodes: nodes
    };
  }).filter(group => group.nodes.length > 0); // Opcional: Esconde categorias vazias
});

// Verifica se já existe conexão
const isConnected = (targetId: string) => {
  if (!activeNode.value) return false;
  return store.project.edges.some(e => 
    (e.source === activeNode.value!.id && e.target === targetId) ||
    (e.source === targetId && e.target === activeNode.value!.id)
  );
};

// Alterna a conexão
const toggleConnection = (targetId: string) => {
  if (!activeNode.value) return;
  const sourceId = activeNode.value.id;

  if (isConnected(targetId)) {
    // Remover conexão
    store.project.edges = store.project.edges.filter(e => 
      !(e.source === sourceId && e.target === targetId) &&
      !(e.source === targetId && e.target === sourceId)
    );
  } else {
    // Adicionar conexão
    store.addEdge(sourceId, targetId);
  }
};

const handleDelete = () => {
  if (activeNode.value && confirm('Tem certeza que deseja excluir este item?')) {
    store.deleteNode(activeNode.value.id);
  }
};

// Limpa os expands quando muda de nó (opcional, gosto pessoal de UX)
watch(() => activeNode.value?.id, () => {
  // Se quiser manter aberto, comente a linha abaixo
  // expandedCategories.value = new Set();
});
</script>

<template>
  <div class="properties-panel">
    
    <!-- Estado: Nenhum nó selecionado -->
    <div v-if="!activeNode" class="empty-state">
      <MousePointerClick class="empty-icon" />
      <p>Selecione um item para editar</p>
    </div>

    <!-- Estado: Editando nó -->
    <div v-else class="edit-form">
      <div class="header">
        <div class="header-title">
          <h2>Editar Item</h2>
        </div>
        <button class="btn-delete" @click="handleDelete" title="Excluir item">
          <Trash2 class="icon-trash" />
        </button>
      </div>

      <div class="scrollable-content">
        <!-- Campo Título -->
        <div class="form-group">
          <label>Título</label>
          <input 
            v-model="activeNode.title" 
            type="text" 
            placeholder="Nome do conceito"
            class="input-title"
          />
        </div>

        <!-- Campo Conteúdo -->
        <div class="form-group">
          <label>Conteúdo</label>
          <div class="content-actions">
            <p class="help-text">
              O conteúdo é editado em tela cheia para melhor foco.
            </p>
            <button class="btn-open-editor" @click="showEditor = true">
              <FileEdit class="icon-btn" />
              Editar Conteúdo
            </button>
          </div>
        </div>

        <!-- Lista de Conexões (Novo Layout) -->
        <div class="form-group connections-section">
          <label>Conexões</label>
          <div class="connections-container">
            
            <p v-if="connectionGroups.length === 0" class="hint">
              Nenhum outro item disponível para conectar (crie itens em outras categorias).
            </p>

            <div 
              v-for="group in connectionGroups" 
              :key="group.category.id" 
              class="category-group"
            >
              <!-- Cabeçalho da Categoria (Accordion) -->
              <div 
                class="group-header" 
                :style="{ borderLeftColor: group.category.color }"
                @click="toggleCategory(group.category.id)"
              >
                <span class="cat-name">{{ group.category.name }}</span>
                <ChevronRight 
                  class="chevron-icon" 
                  :class="{ open: expandedCategories.has(group.category.id) }"
                />
              </div>

              <!-- Lista de Itens (Expansível) -->
              <div v-show="expandedCategories.has(group.category.id)" class="group-items">
                <label 
                  v-for="node in group.nodes" 
                  :key="node.id" 
                  class="connection-item"
                >
                  <input 
                    type="checkbox" 
                    :checked="isConnected(node.id)" 
                    @change="toggleConnection(node.id)"
                  />
                  <span class="node-label">{{ node.title }}</span>
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <ContentEditorModal 
      v-if="showEditor && activeNode"
      :node-id="activeNode.id"
      :node-title="activeNode.title"
      @close="showEditor = false"
    />

  </div>
</template>

<style scoped>
.properties-panel {
  width: 100%; 
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  padding: 30px;
  text-align: center;
  gap: 10px;
}

.empty-icon { width: 48px; height: 48px; opacity: 0.3; }

.edit-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 700;
}

.btn-delete {
  background: #fff1f2;
  border: 1px solid #fecaca;
  color: #e11d48;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: #ffe4e6;
  border-color: #fda4af;
}

.icon-trash {
  width: 16px;
  height: 16px;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.scrollable-content::-webkit-scrollbar { width: 6px; }
.scrollable-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 8px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

input[type="text"], textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
  background: #f8fafc;
}

input[type="text"]:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-title {
  font-weight: 600;
  font-size: 1rem;
  color: #1e293b;
}

small, .hint {
  display: block;
  margin-top: 6px;
  color: #94a3b8;
  font-size: 0.8rem;
}

/* --- Acordeão de Conexões --- */
.connections-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.category-group { border-bottom: 1px solid #f1f5f9; }
.category-group:last-child { border-bottom: none; }

.group-header {
  padding: 12px 14px;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid transparent; 
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  transition: background 0.2s;
}

.group-header:hover { background: #f1f5f9; }

.chevron-icon {
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transition: transform 0.2s;
}

.chevron-icon.open { transform: rotate(90deg); }

.group-items {
  background: #fff;
  padding: 6px 0;
  max-height: 200px;
  overflow-y: auto;
}

.connection-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #334155;
  transition: background 0.1s;
}

.connection-item:hover { background: #f8fafc; }

.connection-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
}

.node-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: none;
  letter-spacing: normal;
}

/* Estilos do Botão de Conteúdo */
.content-actions {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.help-text {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 12px 0;
}

.btn-open-editor {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: white; border: 1px solid #cbd5e1;
  padding: 10px; border-radius: 6px;
  color: #334155; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}

.btn-open-editor:hover {
  border-color: #3b82f6; color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.icon-btn { width: 18px; height: 18px; }
</style>