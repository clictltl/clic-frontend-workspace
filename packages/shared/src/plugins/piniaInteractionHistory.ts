import type { PiniaPluginContext, PiniaPlugin } from 'pinia';
import { ref, computed, toRaw } from 'vue';
import * as jsonpatch from 'fast-json-patch';
import { telemetryService } from '../analytics/telemetry';

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    history?: {
      stateKey: keyof S;
      ignoreActions?: string[];
      clearHistoryActions?: string[];
      actionLabels?: Record<string, string>;
      maxLimit?: number;
      telemetry?: {
        appSlug: string;
        sessionActions: string[]; // Ações que iniciam uma nova sessão (Frame Zero)
      };
    };
  }
  
  export interface PiniaCustomProperties {
    undo: () => string | void;
    redo: () => string | void;
    clearHistory: () => void;
    canUndo: boolean;
    canRedo: boolean;
  }
}

export const piniaInteractionHistoryPlugin: PiniaPlugin = ({ store, options }: PiniaPluginContext) => {
  if (!options.history) return;

  const { 
    stateKey, 
    ignoreActions = [], 
    clearHistoryActions =[], 
    actionLabels = {},
    maxLimit = 50
  } = options.history;

  // Pilhas de Deltas
  interface HistoryEntry {
    patch: jsonpatch.Operation[];
    actionName: string;
  }
  const undoStack = ref<HistoryEntry[]>([]);
  const redoStack = ref<HistoryEntry[]>([]);

  // String base para não perdermos a referência ao comparar
  let previousStateStr = JSON.stringify(store.$state[stateKey as keyof typeof store.$state]);

  const clearHistory = () => {
    undoStack.value = [];
    redoStack.value =[];
    previousStateStr = JSON.stringify(store.$state[stateKey as keyof typeof store.$state]);
  };

  store.$onAction(({ name, args, after }) => {
    // 1. Inicia a Sessão Automática (Frame Zero)
    if (options.history?.telemetry?.sessionActions.includes(name)) {
      after(() => {
        const projectData = toRaw(store.$state[stateKey as keyof typeof store.$state]);
        const uuid = projectData.uuid || (projectData as any).meta?.id || '';
        telemetryService.startSession(uuid, options.history!.telemetry!.appSlug, projectData);
      });
    }

    // 2. Ignora ações silenciosas
    if (['undo', 'redo', 'clearHistory', ...ignoreActions].includes(name)) return;
      
    // 3. Limpa o histórico se for uma ação de reset
    if (clearHistoryActions.includes(name)) {
      after(() => clearHistory());
      return;
    }

    // 4. Mutações
    after(() => {
      const currentStateRaw = toRaw(store.$state[stateKey as keyof typeof store.$state]);
      const currentStateStr = JSON.stringify(currentStateRaw);

      if (currentStateStr !== previousStateStr) {
        const previousStateObj = JSON.parse(previousStateStr);
        const currentStateObj = JSON.parse(currentStateStr);

        const forwardPatch = jsonpatch.compare(previousStateObj, currentStateObj);
        const reversePatch = jsonpatch.compare(currentStateObj, previousStateObj);

        if (forwardPatch.length > 0) {
          undoStack.value.push({ patch: reversePatch, actionName: name });
          if (undoStack.value.length > maxLimit) {
            undoStack.value.shift();
          }

          redoStack.value =[]; 
          
          // Despacha o log com a mutação estrutural (Sem poda)
          telemetryService.addMutation(name, {
            args: args,
            mutations: forwardPatch
          });

          previousStateStr = currentStateStr;
        }
      }
    });
  });

  const applyStateUpdate = (patch: jsonpatch.Operation[], isUndo: boolean) => {
    const currentStateObj = JSON.parse(previousStateStr);
    const nextStateObj = jsonpatch.applyPatch(currentStateObj, patch).newDocument;
    
    store.$patch((state: any) => {
      state[stateKey] = nextStateObj;
    });
    previousStateStr = JSON.stringify(nextStateObj);
    
    // Registra a reversão da mutação
    telemetryService.addMutation(isUndo ? 'UNDO' : 'REDO', {
      mutations: patch
    });
  };

   const undo = () => {
    if (undoStack.value.length === 0) return;
    const entry = undoStack.value.pop()!;
    
    // Calcula o patch para o redo antes de voltar o estado
    const currentStateObj = JSON.parse(previousStateStr);
    const nextStateObj = jsonpatch.applyPatch(JSON.parse(previousStateStr), entry.patch).newDocument;
    const forwardPatch = jsonpatch.compare(nextStateObj, currentStateObj);
    
    redoStack.value.push({ patch: forwardPatch, actionName: entry.actionName });
    applyStateUpdate(entry.patch, true);

    return actionLabels[entry.actionName] || entry.actionName;
  };

  const redo = () => {
    if (redoStack.value.length === 0) return;
    const entry = redoStack.value.pop()!;
    
    // Calcula o patch para o undo novamente
    const currentStateObj = JSON.parse(previousStateStr);
    const nextStateObj = jsonpatch.applyPatch(JSON.parse(previousStateStr), entry.patch).newDocument;
    const reversePatch = jsonpatch.compare(nextStateObj, currentStateObj);
    
    undoStack.value.push({ patch: reversePatch, actionName: entry.actionName });
    applyStateUpdate(entry.patch, false);

    return actionLabels[entry.actionName] || entry.actionName;
  };

  return {
    undo,
    redo,
    clearHistory,
    canUndo: computed(() => undoStack.value.length > 0) as unknown as boolean,
    canRedo: computed(() => redoStack.value.length > 0) as unknown as boolean,
  };
}