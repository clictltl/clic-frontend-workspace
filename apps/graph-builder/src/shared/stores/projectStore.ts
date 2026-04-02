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
  categories: [],
  nodes: [],
  edges: [],
  assets: {},
});

const validateCategoryName = (categories: Category[], name: string, excludeId?: string) => {
  const normalizedName = name.trim().toLowerCase();
  
  if (!normalizedName) {
    throw new Error("O nome da categoria não pode ser vazio.");
  }

  const exists = categories.some(c => 
    c.id !== excludeId && 
    c.name.trim().toLowerCase() === normalizedName
  );

  if (exists) {
    throw new Error(`A categoria "${name}" já existe.`);
  }
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
      state.project.nodes
        .filter((n) => n.categoryId === categoryId)
        .sort((a, b) => a.order - b.order),
    
    activeNode: (state) => 
      state.selectedNodeId ? state.project.nodes.find(n => n.id === state.selectedNodeId) : null,
      
    // Helper para saber quais cores já estão em uso
    usedColors: (state) => new Set(state.project.categories.map(c => c.color))
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

    loadProject(json: GraphProject, markAsUnsaved: boolean = false) {
      this.project = json;
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
        const colorIndex = this.project.categories.length % CATEGORY_COLORS.length;
        finalColor = CATEGORY_COLORS[colorIndex] || DEFAULT_COLOR;
      }

      const newCategory: Category = {
        id: uuidv4(),
        name,
        color: finalColor,
        order: 0,
      };
      this.project.categories.unshift(newCategory);
      this.project.categories.forEach((cat, index) => { cat.order = index; });
    },

    updateCategory(id: string, name: string, color?: string) {
      validateCategoryName(this.project.categories, name, id);
      const category = this.project.categories.find(c => c.id === id);
      if (category) {
        category.name = name;
        if (color) category.color = color;
      }
    },

    deleteCategory(id: string) {
      this.project.categories = this.project.categories.filter(c => c.id !== id);
      const nodesToDelete = this.project.nodes.filter(n => n.categoryId === id);
      const nodeIds = nodesToDelete.map(n => n.id);
      this.project.nodes = this.project.nodes.filter(n => n.categoryId !== id);
      this.project.edges = this.project.edges.filter(e => 
        !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
      );
      this.project.categories.forEach((cat, index) => { cat.order = index; });
    },

    reorderCategories(newCategories: Category[]) {
      this.project.categories = newCategories;
      this.project.categories.forEach((cat, index) => { cat.order = index; });
    },

    addNode(categoryId: string) {
      const currentCount = this.project.nodes.filter(n => n.categoryId === categoryId).length;
      const newNode: Node = {
        id: uuidv4(),
        categoryId,
        title: 'Novo Item',
        content: '',
        order: currentCount,
      };
      this.project.nodes.push(newNode);
      this.selectedNodeId = newNode.id;
    },

    updateNodeSilent(id: string, updates: Partial<Node>) {
      const node = this.project.nodes.find(n => n.id === id);
      if (node) {
        Object.assign(node, updates);
      }
    },

    updateNode(id: string, updates: Partial<Node>) {
      this.updateNodeSilent(id, updates);
    },

    deleteNode(id: string) {
      this.project.nodes = this.project.nodes.filter(n => n.id !== id);
      this.project.edges = this.project.edges.filter(e => e.source !== id && e.target !== id);
      if (this.selectedNodeId === id) this.selectedNodeId = null;
    },

    reorderNodesInCategory(categoryId: string, newOrderedNodes: Node[]) {
      const otherNodes = this.project.nodes.filter(n => n.categoryId !== categoryId);
      const updatedNodes = newOrderedNodes.map((node, index) => ({
        ...node,
        categoryId: categoryId,
        order: index
      }));
      this.project.nodes = [...otherNodes, ...updatedNodes];
    },

    saveNodeContent(nodeId: string, content: string) {
      const node = this.project.nodes.find(n => n.id === nodeId);
      if (node) {
        node.content = content;
      }
    },

    getNodeContent(nodeId: string): string {
      const node = this.project.nodes.find(n => n.id === nodeId);
      return node?.content || '';
    },

    addEdge(sourceId: string, targetId: string) {
      if (sourceId === targetId) return;

      const exists = this.project.edges.some(
        e => e.source === sourceId && e.target === targetId
      );

      if (!exists) {
        const newEdge: Edge = {
          id: uuidv4(),
          source: sourceId,
          target: targetId
        };
        this.project.edges.push(newEdge);
      }
    },

    removeEdge(sourceId: string, targetId: string) {
      this.project.edges = this.project.edges.filter(e => 
        !(e.source === sourceId && e.target === targetId) &&
        !(e.source === targetId && e.target === sourceId)
      );
    },

    // --- AÇÕES DE FORMULÁRIO ---
    updateCategoryFormConfig(categoryId: string, config: CategoryFormConfig | undefined) {
      const category = this.project.categories.find(c => c.id === categoryId);
      if (category) {
        if (config === undefined) {
          delete category.formConfig;
        } else {
          category.formConfig = { ...config };
        }
      }
    },

    processFormAnswers(categoryId: string, answers: any[]) {
      if (answers.length === 0) return [];

      const syncedIds: number[] = [];
      const currentNodesCount = this.project.nodes.filter(n => n.categoryId === categoryId).length;

      answers.forEach((answer, index) => {
        // 1. Extrai os dados (vêm da tabela genérica data: { name, connections })
        const { name, connections } = answer.data;
        const newNodeId = uuidv4();

        // 2. Cria o novo Nó na categoria alvo
        const newNode: Node = {
          id: newNodeId,
          categoryId,
          title: name || 'Sem Nome',
          content: '', // Conteúdo inicial vazio
          order: currentNodesCount + index,
        };
        this.project.nodes.push(newNode);

        // 3. Cria as Arestas (Connections)
        if (Array.isArray(connections)) {
          connections.forEach((targetId: string) => {
            // Validação: Só cria a aresta se o nó de destino ainda existir no projeto
            const targetExists = this.project.nodes.some(n => n.id === targetId);
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