import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { GraphProject, Category, Node, Edge } from '../types';

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
  state: () => ({
    project: createEmptyProject() as GraphProject,
    selectedNodeId: null as string | null, 
    // --- CONTROLE DE ALTERAÇÕES ---
    hasUnsavedChanges: false,
    _isLoading: false, // Trava para evitar marcar 'dirty' ao carregar projetos
  }),

  getters: {
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
      this._isLoading = true;
      this.hasUnsavedChanges = false;
      
      // Mantém bloqueado por 500ms para garantir que "ecos" de reatividade sejam ignorados
      setTimeout(() => {
        this.hasUnsavedChanges = false;
        this._isLoading = false;
      }, 500);
    },

    touch() {
      this.project.meta.updatedAt = now();
      if (!this._isLoading) {
        this.hasUnsavedChanges = true;
      }
    },

    // --- AÇÕES DO PROJETO ---
    createNew() {
      this._isLoading = true;
      this.project = createEmptyProject();
      this.selectedNodeId = null;
      this.hasUnsavedChanges = false;
      setTimeout(() => { this._isLoading = false; }, 500);
    },

    loadProject(json: GraphProject) {
      this._isLoading = true;
      this.project = json;
      this.selectedNodeId = null;
      this.hasUnsavedChanges = false;
      setTimeout(() => { this._isLoading = false; }, 500);
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
      this.touch();
    },

    updateCategory(id: string, name: string, color?: string) {
      validateCategoryName(this.project.categories, name, id);
      const category = this.project.categories.find(c => c.id === id);
      if (category) {
        category.name = name;
        if (color) category.color = color;
        this.touch();
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
      this.touch();
    },

    reorderCategories(newCategories: Category[]) {
      this.project.categories = newCategories;
      this.project.categories.forEach((cat, index) => { cat.order = index; });
      this.touch();
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
      this.touch();
    },

    updateNode(id: string, updates: Partial<Node>) {
      const node = this.project.nodes.find(n => n.id === id);
      if (node) {
        Object.assign(node, updates);
        this.touch();
      }
    },

    deleteNode(id: string) {
      this.project.nodes = this.project.nodes.filter(n => n.id !== id);
      this.project.edges = this.project.edges.filter(e => e.source !== id && e.target !== id);
      if (this.selectedNodeId === id) this.selectedNodeId = null;
      this.touch();
    },

    reorderNodesInCategory(categoryId: string, newOrderedNodes: Node[]) {
      const otherNodes = this.project.nodes.filter(n => n.categoryId !== categoryId);
      const updatedNodes = newOrderedNodes.map((node, index) => ({
        ...node,
        categoryId: categoryId,
        order: index
      }));
      this.project.nodes = [...otherNodes, ...updatedNodes];
      this.touch();
    },

    saveNodeContent(nodeId: string, content: string) {
      const node = this.project.nodes.find(n => n.id === nodeId);
      if (node) {
        node.content = content;
        this.touch();
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
        this.touch();
      }
    }
  }
});