import { defineStore } from 'pinia';
import type { Block, Connection, Variable } from '@/shared/types/chatbot';
import type { ProjectData } from '@/shared/types/project';
import type { ClicAsset } from '@clic/shared';

// IDs fixos para o fluxo inicial
const START_ID = 'start';
const FIRST_MESSAGE_ID = 'block_message_1';

// Posições iniciais (lado a lado)
const START_POSITION = { x: 100, y: 120 };
const GAP_X = 320;
const GAP_Y = 60;

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
  position: {
    x: START_POSITION.x + GAP_X,
    y: START_POSITION.y + GAP_Y
  },
  content: 'Olá! Bem-vindo ao chatbot.',
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
  history: {
    stateKey: 'document',
    ignoreActions: ['markAsSaved', 'getProjectData'],
    clearHistoryActions: ['setProjectData', 'resetProjectData']
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
    // --- FUNÇÕES DE SNAPSHOT E SALVAMENTO ---

    /**
     * Marca o projeto como salvo. 
     * Congela o documento atual em uma string para comparação futura.
     */
    markAsSaved() {
      this.meta.lastSavedState = JSON.stringify(this.document);
    },

    // --- AÇÕES DO PROJETO ---

    /**
     * Exporta o estado atual do editor garantindo a Regra de Ouro 1 (JSON Limpo)
     */
    getProjectData(): ProjectData {
      // Retornamos um clone profundo para evitar reatividade acidental
      return JSON.parse(JSON.stringify(this.document));
    },

    /**
     * Aplica um projeto ao editor (login, import JSON, banco de dados)
     */
    setProjectData(data: ProjectData, markAsUnsaved: boolean = false) {
      this.document = {
        blocks: Array.isArray(data.blocks) ? data.blocks : [],
        connections: Array.isArray(data.connections) ? data.connections :[],
        variables: typeof data.variables === 'object' ? data.variables : {},
        assets: typeof data.assets === 'object' ? data.assets : {},
      };

      this.ui.selectedBlockId = null;

      if (markAsUnsaved) {
        // Força a flag de unsaved a ficar true, definindo o snapshot como uma string vazia/diferente
        this.meta.lastSavedState = 'FORCED_UNSAVED';
      } else {
        // Se é um carregamento normal, o snapshot atual é exatamente este documento recém-carregado
        this.markAsSaved();
      }
    },

    /**
     * Reseta o editor para um estado inicial válido
     */
    resetProjectData() {
      this.document = {
        blocks:[
          { ...startBlock, position: { ...startBlock.position } },
          { ...firstMessageBlock, position: { ...firstMessageBlock.position } }
        ],
        connections:[
          { ...initialConnection, id: `conn_${Date.now()}` }
        ],
        variables: {},
        assets: {},
      };

      this.ui.selectedBlockId = null;
      this.markAsSaved();
    }
  }
});