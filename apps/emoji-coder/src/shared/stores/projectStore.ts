import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { EmojiProject } from '../types';

const now = () => new Date().toISOString();

const createEmptyProject = (): EmojiProject => ({
  title: '',
  meta: {
    id: uuidv4(),
    name: 'Novo Projeto',
    version: '1.0.0',
    createdAt: now(),
    updatedAt: now(),
  },
  config: {
    libraryId: null,
    gridWidth: 8,
    gridHeight: 8
  },
  blocksWorkspace: {},
  compiledAST: [],
  assets: {}
});

export const useProjectStore = defineStore('emoji-coder-project', {
  // --- INTEGRAÇÃO COM O PLUGIN DE HISTÓRICO ---
  history: {
    stateKey: 'project',
    ignoreActions: ['markAsSaved', 'updateWorkspaceSilent', 'setupEnvironment'],
    clearHistoryActions: ['createNew', 'loadProject'],
    actionLabels: {
      updateConfig: 'Alteração na Grade',
      // Não rastrearemos blocos aqui, pois o Blockly já tem seu próprio Undo/Redo nativo!
    }
  },

  state: () => {
    const initialProject = createEmptyProject();
    return {
      project: initialProject,
      lastSavedState: JSON.stringify(initialProject),
      // Variável volátil para a UI (O Histórico e o JSON ignoram isso)
      activeBlockId: null as string | null
    };
  },

  getters: {
    hasUnsavedChanges: (state) => JSON.stringify(state.project) !== state.lastSavedState,
    isConfigured: (state) => state.project.config.libraryId !== null,
  },

  actions: {
    // --- FUNÇÕES DE CONTROLE DE SALVAMENTO ---
    markAsSaved() {
      this.project.meta.updatedAt = now();
      this.lastSavedState = JSON.stringify(this.project);
    },

    createNew() {
      this.project = createEmptyProject();
      this.markAsSaved();
    },

    loadProject(json: any, markAsUnsaved: boolean = false) {
      // HIDRATAÇÃO DO ESTADO COM BLINDAGEM DO PHP:
      json.title = json.title || ''; 
      
      // Garante que o PHP não corrompeu os objetos do Blockly
      json.blocksWorkspace = Array.isArray(json.blocksWorkspace) ? {} : (json.blocksWorkspace || {});
      json.compiledAST = Array.isArray(json.compiledAST) ? [] : (json.compiledAST || []);
      json.assets = Array.isArray(json.assets) ? {} : (json.assets || {});
      
      this.project = json;

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

    // Ação silenciosa para sincronizar o workspace do Blockly com o Vue sem poluir o histórico
    updateWorkspaceSilent(workspaceJson: any, ast: any[]) {
      this.project.blocksWorkspace = workspaceJson;
      this.project.compiledAST = ast;
    }
  }
});