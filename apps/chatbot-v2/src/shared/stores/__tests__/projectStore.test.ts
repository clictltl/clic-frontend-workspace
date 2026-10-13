// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { piniaInteractionHistoryPlugin, telemetryService } from '@clic/shared';
import { HANDLE_OUT } from '../../types/chatbot';
import { useProjectStore } from '../projectStore';
import { v1Project } from '../../domain/__tests__/v1Fixture';

/**
 * Contrato do store com o desfazer e o replay (regra 6): cada gesto é UMA action, que vira
 * uma entrada de undo e um evento de mutação; seleção e gestos inválidos não deixam rastro.
 */
let startSession: ReturnType<typeof vi.spyOn>;
let addMutation: ReturnType<typeof vi.spyOn>;
const loggedActions = () => addMutation.mock.calls.map(call => call[0]);

function freshStore() {
  const store = useProjectStore();
  store.createNew();
  addMutation.mockClear();
  startSession.mockClear();
  return store;
}

beforeEach(() => {
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  createApp({}).use(pinia);
  setActivePinia(pinia);
  startSession = vi.spyOn(telemetryService, 'startSession').mockImplementation(() => {});
  addMutation = vi.spyOn(telemetryService, 'addMutation').mockImplementation(() => {});
});

describe('projectStore: one gesture, one undo step, one log event', () => {
  it('creating a block already connected is undone in a single step', () => {
    const store = freshStore();
    const message = Object.values(store.project.nodes).find(n => n.type === 'message')!;
    const id = store.addConnectedNode('end', { x: 900, y: 150 }, message.id, HANDLE_OUT);

    expect(store.project.nodes[id]).toBeDefined();
    expect(store.project.edges[`${message.id}:${HANDLE_OUT}`]?.targetNode).toBe(id);
    expect(loggedActions()).toEqual(['addConnectedNode']);

    store.undo();
    expect(store.project.nodes[id]).toBeUndefined();
    expect(store.project.edges[`${message.id}:${HANDLE_OUT}`]).toBeUndefined();
    expect(store.canUndo).toBe(false);
  });

  it('deleting a block also removes its connections, and undo brings both back', () => {
    const store = freshStore();
    const before = JSON.stringify(store.project);
    const message = Object.values(store.project.nodes).find(n => n.type === 'message')!;
    store.selectNode(message.id);

    expect(store.deleteNode(message.id)).toBe(true);
    expect(store.selectedNodeId).toBeNull();
    expect(Object.keys(store.project.edges)).toHaveLength(0);

    store.undo();
    expect(JSON.stringify(store.project)).toBe(before);
  });

  it('selection never enters the history or the log', () => {
    const store = freshStore();
    const message = Object.values(store.project.nodes).find(n => n.type === 'message')!;
    store.selectNode(message.id);
    store.selectEdge(Object.keys(store.project.edges)[0]!);
    store.clearSelection();
    expect(store.canUndo).toBe(false);
    expect(addMutation).not.toHaveBeenCalled();
  });

  it('rejected gestures (duplicate or empty variable name) leave no trace', () => {
    const store = freshStore();
    const id = store.addVariable('nome');
    expect(id).not.toBeNull();
    expect(store.addVariable(' nome ')).toBeNull();
    expect(store.addVariable('   ')).toBeNull();
    expect(store.renameVariable(id!, '')).toBe(false);
    expect(loggedActions()).toEqual(['addVariable']);
  });

  it('duplicating copies the block beside the original, without connections, in one step', () => {
    const store = freshStore();
    const message = Object.values(store.project.nodes).find(n => n.type === 'message')!;
    const copyId = store.duplicateNode(message.id)!;
    const copy = store.project.nodes[copyId]!;
    expect(copy.type).toBe('message');
    expect(copy.position).toEqual({ x: message.position.x + 40, y: message.position.y + 40 });
    expect(Object.values(store.project.edges).some(e => e.sourceNode === copyId || e.targetNode === copyId)).toBe(false);
    expect(store.selectedNodeId).toBe(copyId);
    expect(loggedActions()).toEqual(['duplicateNode']);
  });
});

describe('projectStore: sessions (Frame Zero) and saving', () => {
  it('a new project starts a telemetry session and clears the history', () => {
    const store = freshStore();
    store.renameProject('Antes');
    store.createNew();
    expect(startSession).toHaveBeenCalledTimes(1);
    expect(store.canUndo).toBe(false);
    expect(store.hasUnsavedChanges).toBe(false);
  });

  it('an invalid file keeps the current project, its history and session', () => {
    const store = freshStore();
    store.renameProject('Meu projeto');
    const before = JSON.stringify(store.project);

    expect(() => store.loadProject({ nada: true })).toThrow();
    expect(JSON.stringify(store.project)).toBe(before);
    expect(store.canUndo).toBe(true);
    expect(startSession).not.toHaveBeenCalled();
  });

  it('loading a project starts a session; a converted v1 project opens as unsaved', () => {
    const store = freshStore();
    const v2 = JSON.parse(JSON.stringify(store.project));
    v2.uuid = 'outro';
    expect(store.loadProject(v2)).toBeNull();
    expect(store.hasUnsavedChanges).toBe(false);

    const migration = store.loadProject(v1Project());
    expect(migration?.from).toBe('1.0.0');
    expect(store.hasUnsavedChanges).toBe(true);
    expect(startSession).toHaveBeenCalledTimes(2);

    store.markAsSaved();
    expect(store.hasUnsavedChanges).toBe(false);
    expect(loggedActions()).toEqual([]); // salvar não é gesto de edição
  });

  it('the saved JSON drops unused uploads without touching the open project', () => {
    const store = freshStore();
    store.project.assets.sobra = { id: 'sobra', type: 'image/png', originalName: 'x.png', size: 1, hash: 'h', source: 'local' } as never;
    const data = store.getProjectData();
    expect(data.assets).toEqual({});
    expect(store.project.assets.sobra).toBeDefined();
  });
});
