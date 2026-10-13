import { describe, it, expect } from 'vitest';
import { PROJECT_VERSION, HANDLE_OUT } from '../../types/chatbot';
import { createNode, createProject, parseProject } from '../project';
import { edgeId } from '../graph';
import { createDeps, NOW } from './helpers';

describe('createProject', () => {
  it('starts with a Start node connected to a first message', () => {
    const project = createProject(createDeps(), NOW);
    const nodes = Object.values(project.nodes);
    const start = nodes.find(n => n.type === 'start')!;
    const message = nodes.find(n => n.type === 'message')!;

    expect(project.meta.version).toBe(PROJECT_VERSION);
    expect(nodes).toHaveLength(2);
    expect(project.edges[edgeId(start.id, HANDLE_OUT)]).toEqual({
      id: edgeId(start.id, HANDLE_OUT), sourceNode: start.id, sourceHandle: HANDLE_OUT, targetNode: message.id
    });
  });
});

describe('createNode', () => {
  it('creates a choice question with one translated default choice', () => {
    const node = createNode('choice_question', { x: 1, y: 2 }, createDeps());
    expect(node.data.choices).toHaveLength(1);
    expect(node.data.choices[0]!.label).toBe('chatbot.properties.default_choice:{"n":1}');
  });

  it('creates a condition with one "all" rule and one empty condition', () => {
    const node = createNode('condition', { x: 0, y: 0 }, createDeps());
    expect(node.data.rules).toHaveLength(1);
    expect(node.data.rules[0]!.match).toBe('all');
    expect(node.data.rules[0]!.conditions[0]).toMatchObject({ variableId: null, operator: '==', value: { kind: 'literal', value: '' } });
  });
});

describe('parseProject', () => {
  it('rejects non-objects and unknown versions', () => {
    const deps = createDeps();
    expect(parseProject(null, deps, NOW)).toEqual({ ok: false, error: 'INVALID_PROJECT' });
    expect(parseProject([], deps, NOW)).toEqual({ ok: false, error: 'INVALID_PROJECT' });
    expect(parseProject({ meta: { version: '3.0.0' }, nodes: {} }, deps, NOW)).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
    expect(parseProject({ nodes: {} }, deps, NOW)).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
  });

  it('converts v1 projects (with or without version) and reports the migration', () => {
    const deps = createDeps();
    for (const json of [{ meta: { version: '1.0.0' }, blocks: [] }, { blocks: [] }]) {
      const result = parseProject(json, deps, NOW);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.project.meta.version).toBe('2.0.0');
      expect(result.migration).toEqual({ from: '1.0.0', warnings: [] });
    }
  });

  it('normalizes PHP empty arrays into objects without mutating the input', () => {
    const deps = createDeps();
    const original = createProject(deps, NOW);
    const input = { ...JSON.parse(JSON.stringify(original)), edges: [], variables: [], assets: [] };

    const result = parseProject(input, deps, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.edges).toEqual({});
    expect(result.project.variables).toEqual({});
    expect(result.project.assets).toEqual({});
    expect(input.edges).toEqual([]);
  });

  it('fills defaults for fields added during 2.x', () => {
    const deps = createDeps();
    const input = {
      meta: { version: '2.0.0' },
      nodes: {
        s: { id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
        m: { id: 'm', type: 'message', position: { x: 0, y: 0 }, data: { content: { type: 'doc' } } },
        c: { id: 'c', type: 'choice_question', position: { x: 0, y: 0 }, data: { content: { type: 'doc' }, choices: [{ id: 'o', label: 'A' }] } }
      }
    };
    const result = parseProject(input, deps, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.nodes.m).toMatchObject({ data: { delay: 0, media: null } });
    expect(result.project.nodes.c).toMatchObject({ data: { choices: [{ id: 'o', label: 'A', media: null }] } });
    expect(result.project.appearance).toEqual({ avatar: null, theme: 'classic', font: 'system', fontSize: 'medium', welcomeTitle: '' });
  });

  it('keeps a valid appearance and resets invalid fields', () => {
    const deps = createDeps();
    const parse = (appearance: unknown) => {
      const result = parseProject({ meta: { version: '2.0.0' }, appearance }, deps, NOW);
      return result.ok ? result.project.appearance : null;
    };

    const valid = { avatar: { kind: 'emoji', emoji: '🦉' }, theme: 'space', font: 'andika', fontSize: 'large', welcomeTitle: 'Oi!' };
    expect(parse(valid)).toEqual(valid);
    expect(parse({
      avatar: { kind: 'image', source: { kind: 'url', url: 'javascript:alert(1)' } },
      theme: '#ff0000', font: 'Papyrus', fontSize: 40, welcomeTitle: 'x'.repeat(200)
    })).toEqual({ avatar: null, theme: 'classic', font: 'system', fontSize: 'medium', welcomeTitle: 'x'.repeat(60) });
  });

  it('recreates a missing Start node', () => {
    const deps = createDeps();
    const input = { meta: { version: '2.0.0' }, nodes: {} };
    const result = parseProject(input, deps, NOW);
    expect(result.ok && Object.values(result.project.nodes).map(n => n.type)).toEqual(['start']);
  });
});
