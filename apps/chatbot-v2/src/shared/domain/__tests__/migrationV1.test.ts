import { describe, it, expect } from 'vitest';
import type { ChatNode, RichText } from '../../types/chatbot';
import { createRichText, walkRichText } from '../richText';
import { parseProject } from '../project';
import { validateFlow } from '../validate';
import { startChat, submitText, selectChoice } from '../../engine/engine';
import { createDeps, NOW } from './helpers';
import { v1Project } from './v1Fixture';

/** Conversor de HTML simplificado (o real, do Tiptap, é testado em migrationV1.dom.test.ts). */
function deps() {
  return { ...createDeps(), htmlToRichText: (html: string) => createRichText(html.replace(/<[^>]*>/g, '')) };
}

function migrate() {
  const result = parseProject(v1Project(), deps(), NOW);
  if (!result.ok) throw new Error(result.error);
  return result;
}

function inline(doc: RichText): RichText[] {
  const items: RichText[] = [];
  walkRichText(doc, node => { if (node.type === 'text' || node.type === 'clicVariable') items.push(node); });
  return items;
}

const node = <T extends ChatNode['type']>(nodes: Record<string, ChatNode>, id: string, type: T) => {
  const found = nodes[id];
  expect(found?.type).toBe(type);
  return found as Extract<ChatNode, { type: T }>;
};

describe('v1 migration', () => {
  it('keeps ids, positions and metadata and marks the source version', () => {
    const { project, migration } = migrate();
    expect(project.uuid).toBe('project-v1');
    expect(project.meta).toMatchObject({ version: '2.0.0', migratedFrom: '1.0.0', createdAt: '2025-03-01T10:00:00.000Z' });
    expect(Object.keys(project.nodes).sort()).toEqual(['add', 'ask', 'copy', 'cond', 'end', 'hello', 'img', 'img-url', 'mixed', 'msg', 'mul', 'pick', 'start'].sort());
    expect(project.nodes.msg!.position).toEqual({ x: 420, y: 180 });
    expect(project.assets).toEqual(v1Project().assets);
    expect(migration?.from).toBe('1.0.0');
  });

  it('turns variables keyed by name into variables keyed by id', () => {
    const { project } = migrate();
    const byName = Object.fromEntries(Object.values(project.variables).map(v => [v.name, v]));
    expect(byName.nome).toMatchObject({ type: 'text', defaultValue: '' });
    expect(byName.idade).toMatchObject({ type: 'number', defaultValue: 0 });
    expect(byName.bonus).toMatchObject({ type: 'number', defaultValue: 2 });
    expect(node(project.nodes, 'ask', 'open_question').data.variableId).toBe(byName.nome!.id);
  });

  it('replaces {{name}} with variable pills, creating a text variable for unknown names', () => {
    const { project } = migrate();
    const byName = Object.fromEntries(Object.values(project.variables).map(v => [v.name, v]));
    expect(byName.desconhecida).toMatchObject({ type: 'text', defaultValue: '' });
    expect(inline(node(project.nodes, 'hello', 'message').data.content)).toEqual([
      { type: 'text', text: 'Olá, ' },
      { type: 'clicVariable', attrs: { variableId: byName.nome!.id } },
      { type: 'text', text: '! ' },
      { type: 'clicVariable', attrs: { variableId: byName.desconhecida!.id } }
    ]);
  });

  it('creates each missing variable once, also for open questions, assignments and conditions', () => {
    const json = v1Project();
    (json.blocks as Record<string, unknown>[]).push(
      { id: 'ask2', type: 'openQuestion', position: { x: 0, y: 0 }, content: '<p>Cor?</p>', variableName: 'cor', nextBlockId: 'say' },
      { id: 'say', type: 'message', position: { x: 0, y: 0 }, content: '<p>{{cor}} e {{cor}}</p>' },
      { id: 'set2', type: 'setVariable', position: { x: 0, y: 0 }, content: '', variableName: ' cor ', variableValue: '{{fruta}}' },
      { id: 'cond2', type: 'condition', position: { x: 0, y: 0 }, content: '', conditions: [{ id: 'k', variableName: 'fruta', operator: '==', value: 'uva' }, { id: 'k2', variableName: '', operator: '==', value: '' }] }
    );
    const result = parseProject(json, deps(), NOW);
    if (!result.ok) throw new Error(result.error);
    const { project } = result;
    const named = (name: string) => Object.values(project.variables).filter(v => v.name === name);
    expect(named('cor')).toHaveLength(1);
    expect(named('fruta')).toHaveLength(1);
    const cor = named('cor')[0]!.id;
    const fruta = named('fruta')[0]!.id;
    expect(node(project.nodes, 'ask2', 'open_question').data.variableId).toBe(cor);
    expect(inline(node(project.nodes, 'say', 'message').data.content).filter(i => i.type === 'clicVariable')).toHaveLength(2);
    expect(node(project.nodes, 'set2', 'set_variable').data).toMatchObject({ variableId: cor, value: { kind: 'variable', variableId: fruta } });
    const rules = node(project.nodes, 'cond2', 'condition').data.rules;
    expect(rules.map(r => r.conditions[0]!.variableId)).toEqual([fruta, null]);
  });

  it('follows nextBlockId to create edges and ignores missing targets', () => {
    const { project } = migrate();
    expect(Object.keys(project.edges).sort()).toEqual([
      'add:out', 'ask:out', 'copy:out', 'cond:r1', 'hello:out', 'img:out', 'mixed:out', 'msg:out', 'mul:out', 'pick:c1', 'start:out'
    ].sort());
    expect(project.edges['cond:r1']!.targetNode).toBe('copy');
  });

  it('converts conditions into one rule each, image blocks into media messages', () => {
    const { project } = migrate();
    const cond = node(project.nodes, 'cond', 'condition');
    expect(cond.data.rules.map(r => [r.id, r.match, r.conditions[0]!.operator, r.conditions[0]!.value])).toEqual([
      ['r1', 'all', '>=', { kind: 'literal', value: 18 }],
      ['r2', 'all', '<', { kind: 'literal', value: 18 }]
    ]);

    expect(node(project.nodes, 'img', 'message').data.media).toEqual({ media: { type: 'image', source: { kind: 'upload', assetId: 'img1' } }, position: 'before' });
    expect(node(project.nodes, 'img-url', 'message').data.media).toEqual({ media: { type: 'image', source: { kind: 'url', url: 'https://site/cao.gif' } }, position: 'before' });
  });

  it('converts values and warns only about mixed text assignments', () => {
    const { project, migration } = migrate();
    const vars = Object.fromEntries(Object.values(project.variables).map(v => [v.name, v.id]));
    expect(node(project.nodes, 'copy', 'set_variable').data.value).toEqual({ kind: 'variable', variableId: vars.nome });
    expect(node(project.nodes, 'mixed', 'set_variable').data.value).toEqual({ kind: 'literal', value: 'Olá {{nome}}' });
    expect(node(project.nodes, 'add', 'math').data.operand).toEqual({ kind: 'variable', variableId: vars.bonus });
    expect(node(project.nodes, 'mul', 'math').data.operand).toEqual({ kind: 'literal', value: 3 });
    expect(migration?.warnings).toEqual([{ code: 'MIXED_ASSIGNMENT', nodeId: 'mixed' }]);
  });

  it('produces a valid flow that the engine can run', () => {
    const { project } = migrate();
    const errors = validateFlow(project).filter(i => i.severity === 'error');
    expect(errors).toEqual([]);

    let state = startChat(project);
    expect(state.status).toBe('waiting_text');
    state = submitText(project, state, 'Ana');
    expect(state.status).toBe('waiting_choice');
    state = selectChoice(project, state, 'c1');

    // idade = 0 → regra r2, cujo destino não existia no v1: a conversa termina após a imagem
    const bots = state.messages.filter(m => m.from === 'bot');
    expect(bots.map(m => m.from === 'bot' && m.nodeId)).toEqual(['msg', 'ask', 'hello', 'pick', 'img']);
    expect(state).toMatchObject({ status: 'ended', currentNodeId: 'cond', error: null });
  });
});
