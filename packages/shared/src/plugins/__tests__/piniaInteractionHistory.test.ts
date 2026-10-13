import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import { createApp } from 'vue';
import { piniaInteractionHistoryPlugin } from '../piniaInteractionHistory';
import { telemetryService } from '../../analytics/telemetry';

/**
 * O plugin é a base do desfazer/refazer e dos logs de replay de todos os apps:
 * cada action que muda o estado vira uma entrada de undo e um evento de mutação.
 */
const useDoc = defineStore('history-test-doc', {
  history: {
    stateKey: 'doc',
    ignoreActions: ['select'],
    clearHistoryActions: ['load'],
    actionLabels: { rename: 'labels.rename' },
    maxLimit: 3,
    telemetry: { appSlug: 'test', sessionActions: ['load'] }
  },
  state: () => ({ doc: { uuid: 'd1', title: 'a', items: [] as string[] }, selected: null as string | null }),
  actions: {
    rename(title: string) { this.doc.title = title; },
    addItem(item: string) { this.doc.items.push(item); },
    noop() { /* não muda nada */ },
    select(id: string) { this.selected = id; },
    load(doc: { uuid: string; title: string; items: string[] }) { this.doc = doc; }
  }
});

let startSession: ReturnType<typeof vi.spyOn>;
let addMutation: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  createApp({}).use(pinia); // plugins do Pinia só rodam com a pinia instalada num app
  setActivePinia(pinia);
  startSession = vi.spyOn(telemetryService, 'startSession').mockImplementation(() => {});
  addMutation = vi.spyOn(telemetryService, 'addMutation').mockImplementation(() => {});
});

describe('piniaInteractionHistoryPlugin', () => {
  it('undoes and redoes each action as one step, with its label', () => {
    const store = useDoc();
    store.rename('b');
    store.addItem('x');
    expect(store.canUndo).toBe(true);
    expect(store.nextUndoLabel).toBe('addItem'); // sem rótulo: o nome da action

    expect(store.undo()).toBe('addItem');
    expect(store.doc.items).toEqual([]);
    expect(store.undo()).toBe('labels.rename');
    expect(store.doc.title).toBe('a');
    expect(store.canUndo).toBe(false);

    expect(store.nextRedoLabel).toBe('labels.rename');
    store.redo();
    store.redo();
    expect(store.doc).toEqual({ uuid: 'd1', title: 'b', items: ['x'] });
    expect(store.canRedo).toBe(false);
  });

  it('logs each mutation with its args and patch, and undo/redo as UNDO/REDO', () => {
    const store = useDoc();
    store.rename('b');
    expect(addMutation).toHaveBeenLastCalledWith('rename', {
      args: ['b'],
      mutations: [{ op: 'replace', path: '/title', value: 'b' }]
    });
    store.undo();
    expect(addMutation).toHaveBeenLastCalledWith('UNDO', { mutations: [{ op: 'replace', path: '/title', value: 'a' }] });
    store.redo();
    expect(addMutation).toHaveBeenLastCalledWith('REDO', { mutations: [{ op: 'replace', path: '/title', value: 'b' }] });
  });

  it('skips actions that change nothing and ignored actions', () => {
    const store = useDoc();
    store.noop();
    store.select('n1'); // ignorada (estado de UI, fora do documento)
    expect(store.selected).toBe('n1');
    expect(store.canUndo).toBe(false);
    expect(addMutation).not.toHaveBeenCalled();
  });

  it('a new action clears the redo stack', () => {
    const store = useDoc();
    store.rename('b');
    store.undo();
    expect(store.canRedo).toBe(true);
    store.addItem('x');
    expect(store.canRedo).toBe(false);
  });

  it('keeps at most maxLimit undo steps', () => {
    const store = useDoc();
    ['1', '2', '3', '4'].forEach(item => store.addItem(item));
    let steps = 0;
    while (store.canUndo) { store.undo(); steps++; }
    expect(steps).toBe(3);
    expect(store.doc.items).toEqual(['1']);
  });

  it('session actions clear the history and start a telemetry session (Frame Zero)', () => {
    const store = useDoc();
    store.rename('b');
    store.load({ uuid: 'd2', title: 'novo', items: [] });
    expect(store.canUndo).toBe(false);
    expect(startSession).toHaveBeenCalledTimes(1);
    const [uuid, app, data, getCurrent] = startSession.mock.calls[0]!;
    expect([uuid, app, data]).toEqual(['d2', 'test', { uuid: 'd2', title: 'novo', items: [] }]);
    store.rename('depois');
    expect((getCurrent as () => { title: string })().title).toBe('depois'); // o getter acompanha o estado atual
    store.undo();
    expect(store.doc.title).toBe('novo'); // não desfaz para antes do load
  });
});
