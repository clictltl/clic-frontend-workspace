import { defineStore } from 'pinia';
import type { Block, Connection, Variable, BlockType } from '@/shared/types/chatbot';
import type { ProjectData } from '@/shared/types/project';
import type { ClicAsset } from '@clic/shared';

// IDs fixos para o fluxo inicial
const START_ID = 'start';
const FIRST_MESSAGE_ID = 'block_message_1';

// Posições iniciais (lado a lado)
const START_POSITION = { x: 100, y: 120 };
const GAP_X = 320;
const GAP_Y = 60;

// Helper: Retorna o conteúdo padrão baseado no tipo do bloco
function getDefaultContent(type: BlockType): string {
  switch (type) {
    case 'start': return '';
    case 'message': return 'Olá! Bem-vindo ao chatbot.';
    case 'openQuestion': return 'Qual é o seu nome?';
    case 'choiceQuestion': return 'Escolha uma opção:';
    case 'condition': return 'Verificando condição...';
    case 'setVariable': return 'Definindo variável...';
    case 'math': return 'Operação matemática';
    case 'image': return 'Imagem';
    case 'end': return 'Obrigado por usar o chatbot!';
    default: return '';
  }
}

// Bloco START (inteiro verde, sem conteúdo)
const startBlock: Block = {
  id: START_ID,
  type: 'start',
  position: START_POSITION,
  content: '',  
  nextBlockId: FIRST_MESSAGE_ID
};

// Primeiro bloco de mensagem
const firstMessageBlock: Block = {
  id: FIRST_MESSAGE_ID,
  type: 'message',
  position: { x: START_POSITION.x + GAP_X, y: START_POSITION.y + GAP_Y },
  content: getDefaultContent('message'),
  nextBlockId: undefined
};

// Conexão visual entre start → mensagem
const initialConnection: Connection = {
  id: `conn_${Date.now()}`,
  fromBlockId: START_ID,
  fromOutputId: undefined,
  toBlockId: FIRST_MESSAGE_ID,
};

export const useProjectStore = defineStore('chatbot-project', {
  // --- CONFIGURAÇÃO DO HISTÓRICO (UNDO/REDO) ---
  history: {
    stateKey: 'document',
    ignoreActions:[
      'markAsSaved', 
      'getProjectData', 
      'updateBlockPositionSilent', // 60 FPS Fix (Blocos)
      'updateConnectionSilent',    // 60 FPS Fix (Waypoints)
      'selectBlock',               // UI State não entra no Undo
      'updateBlockSilent'          // Ignora a digitação em tempo real
    ],
    clearHistoryActions:['setProjectData', 'resetProjectData'],
    actionLabels: {
      createBlock: 'Criação de Bloco',
      updateBlock: 'Atualização de Bloco',
      deleteBlock: 'Exclusão de Bloco',
      duplicateBlock: 'Duplicação de Bloco',
      pasteBlock: 'Colagem de Bloco',
      commitBlockMove: 'Movimentação de Bloco',
      addVariable: 'Criação de Variável',
      updateVariableValue: 'Atualização de Variável',
      removeVariable: 'Exclusão de Variável',
      createConnection: 'Criação de Conexão',
      deleteConnection: 'Exclusão de Conexão',
      commitConnectionMove: 'Ajuste de Caminho (Linha)'
    }
  },

  state: () => {
    const initialDocument = {
      blocks:[
        { ...startBlock, position: { ...startBlock.position } },
        { ...firstMessageBlock, position: { ...firstMessageBlock.position } }
      ],
      connections:[
        { ...initialConnection, id: `conn_${Date.now()}` }
      ],
      variables: {} as Record<string, Variable>,
      assets: {} as Record<string, ClicAsset>,
    };

    return {
      document: initialDocument,
      ui: {
        selectedBlockId: null as string | null,
      },
      meta: {
        lastSavedState: JSON.stringify(initialDocument),
      }
    };
  },

  getters: {
    hasUnsavedChanges: (state) => JSON.stringify(state.document) !== state.meta.lastSavedState
  },

  actions: {
    // --- FUNÇÕES DE INFRAESTRUTURA ---
    markAsSaved() { this.meta.lastSavedState = JSON.stringify(this.document); },
    getProjectData(): ProjectData { return JSON.parse(JSON.stringify(this.document)); },
    setProjectData(data: ProjectData, markAsUnsaved: boolean = false) {
      this.document = {
        blocks: Array.isArray(data.blocks) ? data.blocks :[],
        connections: Array.isArray(data.connections) ? data.connections :[],
        variables: typeof data.variables === 'object' ? data.variables : {},
        assets: typeof data.assets === 'object' ? data.assets : {},
      };
      this.ui.selectedBlockId = null;
      if (markAsUnsaved) { this.meta.lastSavedState = 'FORCED_UNSAVED'; } else { this.markAsSaved(); }
    },
    resetProjectData() {
      this.document = {
        blocks:[ { ...startBlock, position: { ...startBlock.position } }, { ...firstMessageBlock, position: { ...firstMessageBlock.position } } ],
        connections:[ { ...initialConnection, id: `conn_${Date.now()}` } ],
        variables: {}, assets: {},
      };
      this.ui.selectedBlockId = null;
      this.markAsSaved();
    },

    // --- AÇÕES DE SELEÇÃO E UI ---
    selectBlock(id: string | null) {
      this.ui.selectedBlockId = id;
    },

    // --- AÇÕES DE BLOCOS ---
    createBlock(type: BlockType, position: { x: number; y: number }) {
      if (type === 'start') return;
      const newBlock: Block = {
        id: `block_${Date.now()}`,
        type,
        position,
        content: getDefaultContent(type),
        choices: type === 'choiceQuestion' ?[] : undefined,
        conditions: type === 'condition' ?[] : undefined,
        nextBlockId: undefined
      };
      this.document.blocks.push(newBlock);
      this.selectBlock(newBlock.id);
    },

    updateBlock(id: string, updates: Partial<Block>) {
      const index = this.document.blocks.findIndex(b => b.id === id);
      if (index !== -1) {
        this.document.blocks[index] = { ...this.document.blocks[index], ...updates };
      }
    },

    updateBlockSilent(id: string, updates: Partial<Block>) {
      const index = this.document.blocks.findIndex(b => b.id === id);
      if (index !== -1) {
        this.document.blocks[index] = { ...this.document.blocks[index], ...updates };
      }
    },

    deleteBlock(id: string) {
      if (id === 'start') return;

      // 1. Apaga conexões atreladas a este bloco (como origem ou destino)
      const connectionsToRemove = this.document.connections.filter(c => c.fromBlockId === id || c.toBlockId === id);
      connectionsToRemove.forEach(c => this.deleteConnection(c.id));

      // 2. Apaga o bloco
      this.document.blocks = this.document.blocks.filter(b => b.id !== id);
      if (this.ui.selectedBlockId === id) this.selectBlock(null);
    },

    duplicateBlock(id: string, newPosition: { x: number; y: number }) {
      if (id === 'start') return;
      const blockToDuplicate = this.document.blocks.find(b => b.id === id);
      if (!blockToDuplicate) return;

      const newBlock: Block = {
        ...JSON.parse(JSON.stringify(blockToDuplicate)),
        id: `block_${Date.now()}`,
        position: newPosition
      };
      this.document.blocks.push(newBlock);
      this.selectBlock(newBlock.id);
    },

    pasteBlock(copiedBlock: Block, position: { x: number; y: number }) {
      const newBlock: Block = {
        ...JSON.parse(JSON.stringify(copiedBlock)), // Clone profundo para segurança
        id: `block_${Date.now()}`,
        position
      };
      this.document.blocks.push(newBlock);
      this.selectBlock(newBlock.id);
    },

    // --- AÇÕES DE MOVIMENTAÇÃO (60 FPS FIX - BLOCOS) ---
    updateBlockPositionSilent(id: string, x: number, y: number) {
      const block = this.document.blocks.find(b => b.id === id);
      if (block) {
        block.position.x = x;
        block.position.y = y;
      }
    },

    commitBlockMove(id: string, x: number, y: number) {
      // Esta ação é registrada pelo Histórico ao soltar o mouse.
      this.updateBlockPositionSilent(id, x, y);
    },

    // --- AÇÕES DE MOVIMENTAÇÃO (60 FPS FIX - WAYPOINTS/CONEXÕES) ---
    updateConnectionSilent(updatedConnections: Connection[]) {
      // Substitui o array inteiro silenciosamente durante o arraste
      this.document.connections = updatedConnections;
    },

    commitConnectionMove(updatedConnections: Connection[]) {
      // Registrada pelo Histórico ao soltar o mouse do waypoint
      this.updateConnectionSilent(updatedConnections);
    },

    // --- AÇÕES DE VARIÁVEIS ---
    addVariable(name: string, type: 'string' | 'number') {
      this.document.variables[name] = { name, type, value: type === 'number' ? 0 : '' };
    },

    updateVariableValue(name: string, value: string | number) {
      if (this.document.variables[name]) {
        this.document.variables[name].value = value;
      }
    },

    removeVariable(name: string) {
      delete this.document.variables[name];
    },

    // --- AÇÕES DE CONEXÕES ---
    createConnection(fromBlockId: string, fromOutputId: string | undefined, toBlockId: string) {
      const fromBlock = this.document.blocks.find(b => b.id === fromBlockId);
      const toBlock = this.document.blocks.find(b => b.id === toBlockId);

      if (!fromBlock || !toBlock || fromBlock.type === 'end') return;

      // Impede duplicata exata
      if (this.document.connections.some(c => c.fromBlockId === fromBlockId && c.fromOutputId === fromOutputId && c.toBlockId === toBlockId)) return;

      // 1. Remove qualquer conexão antiga que saía DESSA MESMA "porta" (Substituição)
      this.document.connections = this.document.connections.filter(c => !(c.fromBlockId === fromBlockId && c.fromOutputId === fromOutputId));

      // 2. Cria a conexão visual
      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        fromBlockId,
        fromOutputId,
        toBlockId
      };
      this.document.connections.push(newConnection);

      // 3. Atualiza a propriedade nextBlockId atômica no bloco de origem
      if (fromOutputId && fromBlock.choices) {
        fromBlock.choices = fromBlock.choices.map(c => c.id === fromOutputId ? { ...c, nextBlockId: toBlockId } : c);
      } else if (fromOutputId && fromBlock.conditions) {
        fromBlock.conditions = fromBlock.conditions.map(c => c.id === fromOutputId ? { ...c, nextBlockId: toBlockId } : c);
      } else {
        fromBlock.nextBlockId = toBlockId;
      }
    },

    deleteConnection(connectionId: string) {
      const connection = this.document.connections.find(c => c.id === connectionId);
      if (!connection) return;

      // 1. Remove a conexão visual
      this.document.connections = this.document.connections.filter(c => c.id !== connectionId);

      // 2. Remove o nextBlockId do bloco de origem
      const fromBlock = this.document.blocks.find(b => b.id === connection.fromBlockId);
      if (fromBlock) {
        if (connection.fromOutputId && fromBlock.choices) {
          fromBlock.choices = fromBlock.choices.map(c => c.id === connection.fromOutputId ? { ...c, nextBlockId: undefined } : c);
        } else if (connection.fromOutputId && fromBlock.conditions) {
          fromBlock.conditions = fromBlock.conditions.map(c => c.id === connection.fromOutputId ? { ...c, nextBlockId: undefined } : c);
        } else {
          fromBlock.nextBlockId = undefined;
        }
      }
    }
  }
});