import { defineStore } from 'pinia';
import { generateUUID, i18n } from '@clic/shared';
import type { 
  ChatbotProject, 
  ChatNode, 
  ChatEdge,
  Variable,
  VariableType 
} from '../types/project'; // Assumindo que os tipos que definimos estarão aqui

const now = () => new Date().toISOString();

const createEmptyProject = (): ChatbotProject => {
  const nowTime = now();
  const startNodeId = generateUUID();
  const messageNodeId = generateUUID();
  const edgeId = generateUUID();

  return {
    uuid: generateUUID(),
    title: '',
    meta: {
      version: '1.0.0',
      createdAt: nowTime,
      updatedAt: nowTime,
    },
    variables: {},
    nodes: {
      [startNodeId]: {
        id: startNodeId,
        type: 'start',
        position: { x: 250, y: 150 },
        data: {}
      },
      [messageNodeId]: {
        id: messageNodeId,
        type: 'message',
        position: { x: 250, y: 300 },
        // Puxa o texto inicial direto do i18n
        data: { text: i18n.global.t('chatbot.blocks.default_content.message') }
      }
    },
    edges: {
      [edgeId]: {
        id: edgeId,
        sourceNode: startNodeId,
        sourceHandle: 'out_default',
        targetNode: messageNodeId,
        targetHandle: 'in_default',
        color: '#9ca3af'
      }
    },
    assets: {}
  };
};

// Helper: Retorna o conteúdo padrão baseado no tipo do nó
function getDefaultContent(type: ChatNode['type']): string {
  const t = i18n.global.t;
  switch (type) {
    case 'start': return '';
    case 'message': return t('chatbot.blocks.default_content.message');
    case 'open_question': return t('chatbot.blocks.default_content.openQuestion');
    case 'choice_question': return t('chatbot.blocks.default_content.choiceQuestion');
    case 'condition': return t('chatbot.blocks.default_content.condition');
    case 'set_variable': return t('chatbot.blocks.default_content.setVariable');
    case 'math': return t('chatbot.blocks.default_content.math');
    case 'end': return t('chatbot.blocks.default_content.end');
    default: return '';
  }
}

export const useProjectStore = defineStore('chatbot-project', {
  history: {
    stateKey: 'project',
    telemetry: { appSlug: 'chatbot', sessionActions: ['createNew', 'loadProject'] },
    // Movimento no Canvas e seleção não devem poluir o Undo/Redo
    ignoreActions: ['markAsSaved', 'selectNode', 'selectEdge', 'clearSelection'],
    clearHistoryActions: ['createNew', 'loadProject'],
    actionLabels: {
      updateTitle: 'chatbot.history.updateTitle',
      addNode: 'chatbot.history.addNode',
      updateNodePosition: 'chatbot.history.updateNodePosition',
      deleteNode: 'chatbot.history.deleteNode',
      updateNodeData: 'chatbot.history.updateNodeData',
      addEdge: 'chatbot.history.addEdge',
      emoveEdge: 'chatbot.history.removeEdge',
      updateEdgeColor: 'chatbot.history.updateEdgeColor',
      removeEdgesByHandle: 'chatbot.history.removeEdgesByHandle',
      addVariable: 'chatbot.history.addVariable',
      deleteVariable: 'chatbot.history.deleteVariable',
      updateVariable: 'chatbot.history.updateVariable'
    }
  },

  state: () => {
    const initialProject = createEmptyProject();
    return {
      project: initialProject,
      lastSavedState: JSON.stringify(initialProject),
      // Estados Voláteis (UI Context)
      selectedNodeId: null as string | null,
      selectedEdgeId: null as string | null
    };
  },

  getters: {
    hasUnsavedChanges: (state) => JSON.stringify(state.project) !== state.lastSavedState,
    
    activeNode: (state) => state.selectedNodeId ? state.project.nodes[state.selectedNodeId] || null : null,
    
    activeEdge: (state) => state.selectedEdgeId ? state.project.edges[state.selectedEdgeId] || null : null,
  },

  actions: {
    // --- CONTROLE DE SESSÃO ---
    markAsSaved() {
      this.project.meta.updatedAt = now();
      this.lastSavedState = JSON.stringify(this.project);
    },

    createNew() {
      this.project = createEmptyProject();
      this.clearSelection();
      this.markAsSaved();
    },

    loadProject(json: any, markAsUnsaved: boolean = false) {
      const nowTime = now();
      
      json.uuid = json.uuid || generateUUID();
      json.title = json.title || '';
      json.meta = json.meta || { version: '1.0.0', createdAt: nowTime, updatedAt: nowTime };

      // BLINDAGEM DO PHP: Garante que objetos vazios não virem arrays
      json.nodes = Array.isArray(json.nodes) ? {} : (json.nodes || {});
      json.edges = Array.isArray(json.edges) ? {} : (json.edges || {});
      json.variables = Array.isArray(json.variables) ? {} : (json.variables || {});
      json.assets = Array.isArray(json.assets) ? {} : (json.assets || {});

      // Fallback: Se o JSON veio sem o nó 'start' (corrompido), recriamos
      const hasStart = Object.values(json.nodes).some((n: any) => n.type === 'start');
      if (!hasStart) {
        const startId = generateUUID();
        json.nodes[startId] = { id: startId, type: 'start', position: { x: 250, y: 250 }, data: {} };
      }

      this.project = json;
      this.clearSelection();

      if (markAsUnsaved) {
        this.lastSavedState = 'FORCED_UNSAVED';
      } else {
        this.lastSavedState = JSON.stringify(this.project);
      }
    },

    // --- SELEÇÃO UI (Ações Silenciosas) ---
    selectNode(id: string | null) {
      this.selectedNodeId = id;
      if (id) this.selectedEdgeId = null; // Só um pode estar focado no Inspetor lateral
    },

    selectEdge(id: string | null) {
      this.selectedEdgeId = id;
      if (id) this.selectedNodeId = null;
    },

    clearSelection() {
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
    },

    updateTitle(newTitle: string) {
      this.project.title = newTitle;
    },

    // --- GERENCIAMENTO DE VARIÁVEIS ---
    addVariable(name: string, type: VariableType) {
      const id = generateUUID();
      this.project.variables[id] = {
        id,
        name,
        type,
        defaultValue: type === 'number' ? 0 : ''
      };
    },

    updateVariable(id: string, updates: Partial<Variable>) {
      if (this.project.variables[id]) {
        Object.assign(this.project.variables[id], updates);
      }
    },

    deleteVariable(id: string) {
      delete this.project.variables[id];
      // Nota: Não apagamos os nós que usam a variável para não quebrar o grafo.
      // A UI das propriedades mostrará um erro "Variável não encontrada", forçando o aluno a corrigir.
    },

    // --- GERENCIAMENTO DO GRAFO (NÓS) ---
    addNode(type: ChatNode['type'], position: { x: number; y: number }) {
      const id = generateUUID();
      
      // Monta o payload inicial
      let initialData: Record<string, any> = {};
      if (['message', 'open_question', 'choice_question', 'end'].includes(type)) {
        initialData.text = getDefaultContent(type);
      }
      if (type === 'choice_question') {
        initialData.choices = [{ id: generateUUID(), label: 'Opção 1' }];
      }
      if (type === 'condition') {
        initialData.rules = [{ 
          id: generateUUID(), 
          conditions: [{ id: generateUUID(), connector: 'AND', variableId: '', operator: '==', value: '' }] 
        }];
      }

      this.project.nodes[id] = { id, type, position, data: initialData };
      this.selectNode(id);
    },

    updateNodeData(id: string, dataUpdates: Record<string, any>) {
      if (this.project.nodes[id]) {
        this.project.nodes[id].data = { ...this.project.nodes[id].data, ...dataUpdates };
      }
    },

    // Ação Silenciosa chamada constantemente pelo Vue Flow ao arrastar (não polui Undo/Redo)
    updateNodePosition(id: string, position: { x: number; y: number }) {
      if (this.project.nodes[id]) {
        this.project.nodes[id].position = position;
      }
    },

    deleteNode(id: string) {
      const node = this.project.nodes[id];
      if (!node || node.type === 'start') return; // Blindagem: Nunca deletar o START

      delete this.project.nodes[id];
      
      // Cascata: Deleta todas as conexões (Edges) ligadas a este nó
      Object.values(this.project.edges).forEach((edge: ChatEdge) => {
        if (edge.sourceNode === id || edge.targetNode === id) {
          delete this.project.edges[edge.id];
        }
      });

      if (this.selectedNodeId === id) this.clearSelection();
    },

    // --- GERENCIAMENTO DE CONEXÕES (EDGES) ---
    addEdge(sourceNode: string, sourceHandle: string, targetNode: string, targetHandle: string) {
      // Blindagem: Evita conectar o nó nele mesmo ou criar a mesma linha duas vezes
      if (sourceNode === targetNode) return;
      
      const exists = Object.values(this.project.edges).some(
        (e: ChatEdge) => e.sourceNode === sourceNode && e.sourceHandle === sourceHandle && e.targetNode === targetNode
      );
      
      if (!exists) {
        const id = generateUUID();
        this.project.edges[id] = { id, sourceNode, sourceHandle, targetNode, targetHandle };
      }
    },

    removeEdge(id: string) {
      delete this.project.edges[id];
      if (this.selectedEdgeId === id) this.clearSelection();
    },

    removeEdgesByHandle(nodeId: string, handleId: string) {
      // Varre todas as conexões e deleta se a porta de saída (ou entrada) bater com o ID da Opção/Regra deletada
      Object.values(this.project.edges).forEach((edge: ChatEdge) => {
        if (
          (edge.sourceNode === nodeId && edge.sourceHandle === handleId) ||
          (edge.targetNode === nodeId && edge.targetHandle === handleId)
        ) {
          delete this.project.edges[edge.id];
          if (this.selectedEdgeId === edge.id) this.clearSelection();
        }
      });
    },

    updateEdgeColor(id: string, color: string) {
      if (this.project.edges[id]) {
        this.project.edges[id].color = color;
      }
    }
  }
});