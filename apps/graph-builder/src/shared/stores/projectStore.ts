import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { GraphProject, Category, Node, Edge, CategoryFormConfig } from '../types';

export const CATEGORY_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
];

const DEFAULT_COLOR = '#64748b';

const now = () => new Date().toISOString();

const createEmptyProject = (): GraphProject => ({
  meta: {
    id: uuidv4(),
    name: 'Novo Projeto',
    version: '1.0.0',
    createdAt: now(),
    updatedAt: now(),
  },
  categories: {},
  nodes: {},
  edges: {},
  assets: {},
});

const validateCategoryName = (categoriesObj: Record<string, Category>, name: string, excludeId?: string) => {
  const normalizedName = name.trim().toLowerCase();
  
  if (!normalizedName) throw new Error("O nome da categoria não pode ser vazio.");

  const exists = Object.values(categoriesObj).some(c => 
    c.id !== excludeId && c.name.trim().toLowerCase() === normalizedName
  );
  if (exists) throw new Error(`A categoria "${name}" já existe.`);
};

export const useProjectStore = defineStore('project', {
  history: {
    stateKey: 'project',
    ignoreActions: ['markAsSaved', 'updateNodeSilent'],
    clearHistoryActions: ['createNew', 'loadProject', 'processFormAnswers'],
    actionLabels: {
      saveNodeContent: 'Edição do conteúdo',
      addNode: 'Criação de item',
      deleteNode: 'Exclusão de item',
      updateNode: 'Atualização de item',
      reorderNodesInCategory: 'Reordenação de item',
      addCategory: 'Criação de categoria',
      deleteCategory: 'Exclusão de categoria',
      updateCategory: 'Atualização de categoria',
      reorderCategories: 'Reordenação de categoria',
      addEdge: 'Conexão',
      removeEdge: 'Remoção de conexão',
      updateCategoryFormConfig: 'Configuração de Formulário'
    }
  },

  state: () => {
    const initialProject = createEmptyProject() as GraphProject;

    return {
      project: initialProject,
      selectedNodeId: null as string | null, 
      lastSavedState: JSON.stringify(initialProject),
    };
  },

  getters: {
    hasUnsavedChanges: (state) => JSON.stringify(state.project) !== state.lastSavedState,

    nodesByCategory: (state) => (categoryId: string) => 
      Object.values(state.project.nodes)
        .filter((n) => n.categoryId === categoryId)
        .sort((a, b) => a.order - b.order),
    
    activeNode: (state) => 
      state.selectedNodeId ? state.project.nodes[state.selectedNodeId] || null : null,
      
    // Helper para saber quais cores já estão em uso
    usedColors: (state) => new Set(Object.values(state.project.categories).map(c => c.color))
  },

  actions: {
    // --- FUNÇÕES DE CONTROLE DE SALVAMENTO ---
    markAsSaved() {
      this.project.meta.updatedAt = now();
      this.lastSavedState = JSON.stringify(this.project);
    },

    // --- AÇÕES DO PROJETO ---
    createNew() {
      this.project = createEmptyProject();
      this.selectedNodeId = null;
      this.markAsSaved();
    },

    loadProject(json: any, markAsUnsaved: boolean = false) {
      // ADAPTER DE MIGRAÇÃO: Converte projeto legado (Array) para o novo Estado Normalizado
      const isLegacy = Array.isArray(json.categories) || Array.isArray(json.nodes);
      
      if (isLegacy) {
        const migrated: GraphProject = { ...json, categories: {}, nodes: {}, edges: {} };
        
        (json.categories ||[]).forEach((c: any, index: number) => {
          c.order = (index + 1) * 1000;
          migrated.categories[c.id] = c;
        });
        (json.nodes ||[]).forEach((n: any, index: number) => {
          n.order = (index + 1) * 1000;
          migrated.nodes[n.id] = n;
        });
        (json.edges ||[]).forEach((e: any) => {
          migrated.edges[e.id] = e;
        });
        
        this.project = migrated;
        markAsUnsaved = true; // Força salvar no banco com o formato novo na próxima vez
      } else {
        this.project = json;
      }

      this.selectedNodeId = null;

      if (markAsUnsaved) {
        this.lastSavedState = 'FORCED_UNSAVED';
      } else {
        this.lastSavedState = JSON.stringify(this.project);
      }
    },

    addCategory(name: string, color?: string) {
      validateCategoryName(this.project.categories, name);
      let finalColor = color;
      if (!finalColor) {
        const colorIndex = Object.keys(this.project.categories).length % CATEGORY_COLORS.length;
        finalColor = CATEGORY_COLORS[colorIndex] || DEFAULT_COLOR;
      }

      // Spaced Indexing: Para nascer no "topo" (esquerda), pega o menor e subtrai 1000.
      const catArray = Object.values(this.project.categories);
      const minOrder = catArray.length > 0 ? Math.min(...catArray.map(c => c.order)) : 1000;

      const id = uuidv4();
      const newCategory: Category = {
        id: id,
        name,
        color: finalColor,
        order: minOrder - 1000,
      };
      this.project.categories[id] = newCategory;
    },

    updateCategory(id: string, name: string, color?: string) {
      validateCategoryName(this.project.categories, name, id);
      if (this.project.categories[id]) {
        this.project.categories[id].name = name;
        if (color) this.project.categories[id].color = color;
      }
    },

    deleteCategory(id: string) {
      delete this.project.categories[id];

      // Deleta nós filhos
      Object.values(this.project.nodes).forEach(n => {
        if (n.categoryId === id) {
          delete this.project.nodes[n.id];
          // Deleta arestas ligadas a esse nó
          Object.values(this.project.edges).forEach(e => {
            if (e.source === n.id || e.target === n.id) delete this.project.edges[e.id];
          });
        }
      });
    },

    reorderCategories(newCategories: Category[]) {
      newCategories.forEach((cat, index) => {
        const category = this.project.categories[cat.id];
        if (category) {
          category.order = (index + 1) * 1000;
        }
      });
    },

    addNode(categoryId: string) {
      const nodesInCategory = Object.values(this.project.nodes).filter(n => n.categoryId === categoryId);
      const maxOrder = nodesInCategory.length > 0 ? Math.max(...nodesInCategory.map(n => n.order)) : 0;

      const id = uuidv4();
      const newNode: Node = {
        id: id,
        categoryId,
        title: 'Novo Item',
        content: '',
        order: maxOrder + 1000,
      };
      this.project.nodes[id] = newNode;
      this.selectedNodeId = id;
    },

    updateNodeSilent(id: string, updates: Partial<Node>) {
      if (this.project.nodes[id]) Object.assign(this.project.nodes[id], updates);
    },

    updateNode(id: string, updates: Partial<Node>) {
      this.updateNodeSilent(id, updates);
    },

    deleteNode(id: string) {
      delete this.project.nodes[id];
      Object.values(this.project.edges).forEach(e => {
        if (e.source === id || e.target === id) delete this.project.edges[e.id];
      });
      if (this.selectedNodeId === id) this.selectedNodeId = null;
    },

     reorderNodesInCategory(categoryId: string, newOrderedNodes: Node[]) {
      newOrderedNodes.forEach((node, index) => {
        const nodeToUpdate = this.project.nodes[node.id];
        if (nodeToUpdate) {
          nodeToUpdate.categoryId = categoryId; // Caso tenha sido arrastado entre colunas
          nodeToUpdate.order = (index + 1) * 1000;
        }
      });
    },

    saveNodeContent(nodeId: string, content: string) {
      const node = this.project.nodes[nodeId];
      if (node) {
        node.content = content;
      }
    },

    getNodeContent(nodeId: string): string {
      const node = this.project.nodes[nodeId];
      return node?.content || '';
    },

    addEdge(sourceId: string, targetId: string) {
      if (sourceId === targetId) return;

      const exists = Object.values(this.project.edges).some(e => e.source === sourceId && e.target === targetId);
      if (!exists) {
        const id = uuidv4();
        const newEdge: Edge = {
          id: id,
          source: sourceId,
          target: targetId
        };
        this.project.edges[id] = newEdge;
      }
    },

    removeEdge(sourceId: string, targetId: string) {
      Object.values(this.project.edges).forEach(e => {
        if ((e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId)) {
          delete this.project.edges[e.id];
        }
      });
    },

    // --- AÇÕES DE FORMULÁRIO ---
    updateCategoryFormConfig(categoryId: string, config: CategoryFormConfig | undefined) {
      const category = this.project.categories[categoryId];
      if (category) {
        if (config === undefined) {
          delete category.formConfig;
        } else {
          category.formConfig = { ...config };
        }
      }
    },

    processFormAnswers(categoryId: string, answers: any[]) {
      if (answers.length === 0) return[];
      const syncedIds: number[] =[];

      const nodesInCategory = Object.values(this.project.nodes).filter(n => n.categoryId === categoryId);
      let currentMaxOrder = nodesInCategory.length > 0 ? Math.max(...nodesInCategory.map(n => n.order)) : 0;

      answers.forEach((answer) => {
        // 1. Extrai os dados (vêm da tabela genérica data: { name, connections })
        const { name, connections } = answer.data;
        const newNodeId = uuidv4();
        currentMaxOrder += 1000;

        // 2. Cria o novo Nó na categoria alvo
        const newNode: Node = {
          id: newNodeId,
          categoryId,
          title: name || 'Sem Nome',
          content: '', // Conteúdo inicial vazio
          order: currentMaxOrder,
        };
        this.project.nodes[newNodeId] = newNode;

        // 3. Cria as Arestas (Connections)
        if (Array.isArray(connections)) {
          connections.forEach((targetId: string) => {
            // Validação: Só cria a aresta se o nó de destino ainda existir no projeto
            const targetExists = this.project.nodes[targetId];
            if (targetExists) {
              this.addEdge(newNodeId, targetId);
            }
          });
        }

        // 4. Guarda o ID do banco para avisar o backend que já processamos
        syncedIds.push(answer.id);
      });

      return syncedIds;
    }
  }
});