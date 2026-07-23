import { defineStore } from 'pinia';
import { generateUUID } from '@clic/shared';
import type { EmojiProject } from '../types';

const now = () => new Date().toISOString();

const createEmptyProject = (): EmojiProject => {
  const nowTime = now();
  return {
    uuid: generateUUID(), // <-- ID na raiz!
    title: '',
    meta: {
      version: '1.0.0',
      createdAt: nowTime,
      updatedAt: nowTime,
    },
    config: {
      libraryId: null,
      gridWidth: 8,
      gridHeight: 8,
      startX: 0,
      startY: 0,
      targetCells: {},
      activeChallengeIndex: 0,
      tutorialSavedWorkspaces: {}
    },
    blocksWorkspace: {},
    compiledAST: [],
    assets: {}
  };
};

export const useProjectStore = defineStore('emoji-coder-project', {
  // --- INTEGRAÇÃO COM O PLUGIN DE HISTÓRICO ---
  history: {
    stateKey: 'project',
    telemetry: { appSlug: 'emoji-coder', sessionActions: ['createNew', 'loadProject', 'setupEnvironment'] },
    ignoreActions: ['markAsSaved', 'updateWorkspaceSilent', 'setupEnvironment'],
    clearHistoryActions: ['createNew', 'loadProject'],
    actionLabels: {
      updateConfig: 'emojiCoder.history.updateConfig',
      // Não rastrearemos blocos aqui, pois o Blockly já tem seu próprio Undo/Redo nativo!
    }
  },

  state: () => {
    const initialProject = createEmptyProject();
    return {
      project: initialProject,
      lastSavedState: JSON.stringify(initialProject),
      // Variáveis voláteis para a UI e Motor
      activeBlockId: null as string | null,
      activeChallengeIndex: 0 // Controle de qual passo do tutorial estamos
    };
  },

  getters: {
    hasUnsavedChanges: (state) => JSON.stringify(state.project) !== state.lastSavedState,
    isConfigured: (state) => state.project.config.libraryId !== null,
    isTutorialMode: (state) => state.project.config.libraryId?.includes('tutorial') || false,
  },

  actions: {
    // --- FUNÇÕES DE CONTROLE DE SALVAMENTO ---
    markAsSaved() {
      this.project.meta.updatedAt = now();
      this.lastSavedState = JSON.stringify(this.project);
    },

    createNew() {
      this.project = createEmptyProject();
      this.activeChallengeIndex = 0;
      this.activeBlockId = null;
      this.markAsSaved();
    },

    loadProject(json: any, markAsUnsaved: boolean = false) {
      const nowTime = now();
      
      // HIDRATAÇÃO DO ESTADO COM BLINDAGEM DO PHP:
      json.uuid = json.uuid || (json.meta && json.meta.id) || generateUUID();
      json.title = json.title || ''; 
      json.meta = json.meta || { version: '1.0.0', createdAt: nowTime, updatedAt: nowTime };
      
      // Garante que o PHP não corrompeu os objetos do Blockly
      json.blocksWorkspace = Array.isArray(json.blocksWorkspace) ? {} : (json.blocksWorkspace || {});
      json.compiledAST = Array.isArray(json.compiledAST) ? json.compiledAST : [];
      json.assets = Array.isArray(json.assets) ? {} : (json.assets || {});
      
      if (!json.config.tutorialSavedWorkspaces) json.config.tutorialSavedWorkspaces = {};
      if (!json.config.tutorialSavedASTs) json.config.tutorialSavedASTs = {};
      
      this.project = json;

      // Sincroniza a variável de memória da UI com a do arquivo importado!
      this.activeChallengeIndex = this.project.config.activeChallengeIndex || 0;

      if (markAsUnsaved) {
        this.lastSavedState = 'FORCED_UNSAVED';
      } else {
        this.lastSavedState = JSON.stringify(this.project);
      }
    },

    // --- AÇÕES DO EMOJI CODER ---
    setupEnvironment(libraryId: string, width: number, height: number) {
      this.project.config.libraryId = libraryId;
      this.project.config.gridWidth = width;
      this.project.config.gridHeight = height;
    },

    updateConfig(width: number, height: number) {
      this.project.config.gridWidth = width;
      this.project.config.gridHeight = height;
    },

    loadChallenge(index: number, challengeDef: any) {
      this.activeChallengeIndex = index;
      this.project.config.activeChallengeIndex = index;
      this.project.config.gridWidth = challengeDef.grid.cols;
      this.project.config.gridHeight = challengeDef.grid.rows;
      this.project.config.startX = challengeDef.startPos.x;
      this.project.config.startY = challengeDef.startPos.y;
      this.project.config.targetCells = challengeDef.targetCells || {};

      // INJEÇÃO DO CÓDIGO INICIAL SE ESTIVER VAZIO!
      if (challengeDef.initialWorkspace) {
        if (!this.project.config.tutorialSavedWorkspaces) {
          this.project.config.tutorialSavedWorkspaces = {};
        }
        // Se o usuário ainda não salvou NADA neste desafio, damos a ele o código inicial!
        if (!this.project.config.tutorialSavedWorkspaces[index]) {
          this.project.config.tutorialSavedWorkspaces[index] = challengeDef.initialWorkspace;
        }
      }
    },

    // Ação silenciosa para sincronizar o workspace do Blockly com o Vue sem poluir o histórico
    updateWorkspaceSilent(workspaceJson: any, ast: any[]) {
      this.project.blocksWorkspace = workspaceJson;
      this.project.compiledAST = ast;

      // Se for tutorial, salva o state no slot do desafio atual:
      if (this.isTutorialMode && this.activeChallengeIndex !== undefined) {
        if (!this.project.config.tutorialSavedWorkspaces) {
          this.project.config.tutorialSavedWorkspaces = {};
        }
        if (!this.project.config.tutorialSavedASTs) {
          this.project.config.tutorialSavedASTs = {};
        }
        
        this.project.config.tutorialSavedWorkspaces[this.activeChallengeIndex] = workspaceJson;
        this.project.config.tutorialSavedASTs[this.activeChallengeIndex] = ast;
      }
    }
  }
});