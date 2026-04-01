import type { PiniaPluginContext, PiniaPlugin } from 'pinia';
import { ref, computed, toRaw } from 'vue';
import * as jsonpatch from 'fast-json-patch';

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    history?: {
      stateKey: keyof S;
      ignoreActions?: string[];
      clearHistoryActions?: string[];
      actionLabels?: Record<string, string>;
    };
  }
  
  export interface PiniaCustomProperties {
    undo: () => string | void;
    redo: () => string | void;
    clearHistory: () => void;
    flushLogs: () => any[];
    canUndo: boolean;
    canRedo: boolean;
    interactionLogs: any[];
  }
}

export const piniaInteractionHistoryPlugin: PiniaPlugin = ({ store, options }: PiniaPluginContext) => {
  if (!options.history) return;

  const { stateKey, ignoreActions = [], clearHistoryActions =[], actionLabels = {} } = options.history;

  // Pilhas de Deltas
  interface HistoryEntry {
    patch: jsonpatch.Operation[];
    actionName: string;
  }
  const undoStack = ref<HistoryEntry[]>([]);
  const redoStack = ref<HistoryEntry[]>([]);
  const interactionLogs = ref<any[]>([]);

  // String base para não perdermos a referência ao comparar
  let previousStateStr = JSON.stringify(store.$state[stateKey as keyof typeof store.$state]);

  const clearHistory = () => {
    undoStack.value = [];
    redoStack.value =[];
    previousStateStr = JSON.stringify(store.$state[stateKey as keyof typeof store.$state]);
  };

  store.$onAction(({ name, args, after }) => {
    if (['undo', 'redo', 'clearHistory', 'flushLogs', ...ignoreActions].includes(name)) return;

    if (clearHistoryActions.includes(name)) {
      after(() => clearHistory());
      return;
    }

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
          redoStack.value =[]; 
          
          interactionLogs.value.push({
            action: name,
            args: JSON.parse(JSON.stringify(args)),
            mutations: forwardPatch,
            timestamp: new Date().toISOString()
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
    
    interactionLogs.value.push({ 
      action: isUndo ? 'UNDO' : 'REDO', 
      timestamp: new Date().toISOString() 
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

  const flushLogs = () => {
    const logsToSend =[...interactionLogs.value];
    interactionLogs.value =[];
    return logsToSend;
  };

  return {
    undo,
    redo,
    clearHistory,
    flushLogs,
    canUndo: computed(() => undoStack.value.length > 0) as unknown as boolean,
    canRedo: computed(() => redoStack.value.length > 0) as unknown as boolean,
    interactionLogs: computed(() => interactionLogs.value) as unknown as any[],
  };
}