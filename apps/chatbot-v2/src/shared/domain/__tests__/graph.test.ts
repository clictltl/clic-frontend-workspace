import { describe, it, expect } from 'vitest';
import { HANDLE_ELSE, HANDLE_OUT, MESSAGE_DELAY_MAX } from '../../types/chatbot';
import {
  addChoice, addCondition, addRule, connect, deleteNode, edgeId, getOutputHandles, moveNodes,
  removeChoice, removeCondition, removeRule, renameChoice, setChoiceMedia, setEdgeColor, setMessageDelay, updateCondition
} from '../graph';
import { createCondition, createRule } from '../project';
import { setup } from './helpers';

describe('getOutputHandles', () => {
  it('exposes one output per choice and per rule plus else', () => {
    const { add } = setup();
    const choice = add('choice_question');
    const condition = add('condition');
    expect(getOutputHandles(add('message'))).toEqual([HANDLE_OUT]);
    expect(getOutputHandles(add('end'))).toEqual([]);
    expect(getOutputHandles(choice)).toEqual([choice.data.choices[0]!.id]);
    expect(getOutputHandles(condition)).toEqual([condition.data.rules[0]!.id, HANDLE_ELSE]);
  });
});

describe('connect', () => {
  it('replaces the existing connection of the same output and keeps its color', () => {
    const { project, start, message, add } = setup();
    const other = add('message');
    const id = edgeId(start.id, HANDLE_OUT);
    setEdgeColor(project, id, '#ef4444');

    const result = connect(project, start.id, HANDLE_OUT, other.id);

    expect(result.ok).toBe(true);
    expect(Object.values(project.edges)).toHaveLength(1);
    expect(project.edges[id]).toEqual({ id, sourceNode: start.id, sourceHandle: HANDLE_OUT, targetNode: other.id, color: '#ef4444' });
    expect(project.edges[id]!.targetNode).not.toBe(message.id);
  });

  it('refuses invalid connections without changing the project', () => {
    const { project, start, message, add } = setup();
    const choice = add('choice_question');
    const before = JSON.stringify(project);

    expect(connect(project, message.id, HANDLE_OUT, message.id)).toEqual({ ok: false, error: 'SELF_CONNECTION' });
    expect(connect(project, message.id, HANDLE_OUT, start.id)).toEqual({ ok: false, error: 'TARGET_IS_START' });
    expect(connect(project, choice.id, HANDLE_OUT, message.id)).toEqual({ ok: false, error: 'INVALID_HANDLE' });
    expect(connect(project, 'nope', HANDLE_OUT, message.id)).toEqual({ ok: false, error: 'NODE_NOT_FOUND' });
    expect(JSON.stringify(project)).toBe(before);
  });
});

describe('deleteNode', () => {
  it('removes the node with incoming and outgoing edges', () => {
    const { project, start, message, add } = setup();
    const end = add('end');
    connect(project, message.id, HANDLE_OUT, end.id);

    expect(deleteNode(project, message.id)).toBe(true);
    expect(project.nodes[message.id]).toBeUndefined();
    expect(project.edges).toEqual({});
    expect(project.nodes[start.id]).toBeDefined();
  });

  it('never removes the Start node', () => {
    const { project, start } = setup();
    expect(deleteNode(project, start.id)).toBe(false);
    expect(project.nodes[start.id]).toBeDefined();
  });
});

describe('moveNodes', () => {
  it('moves several nodes and ignores unknown ids', () => {
    const { project, start, message } = setup();
    moveNodes(project, [
      { id: start.id, position: { x: 10, y: 20 } },
      { id: message.id, position: { x: 30, y: 40 } },
      { id: 'nope', position: { x: 0, y: 0 } }
    ]);
    expect(project.nodes[start.id]!.position).toEqual({ x: 10, y: 20 });
    expect(project.nodes[message.id]!.position).toEqual({ x: 30, y: 40 });
  });
});

describe('setMessageDelay', () => {
  it('rounds and clamps the delay between 0 and the maximum', () => {
    const { project, message } = setup();
    const data = message.data as { delay: number };
    setMessageDelay(project, message.id, 2.6);
    expect(data.delay).toBe(3);
    setMessageDelay(project, message.id, 99);
    expect(data.delay).toBe(MESSAGE_DELAY_MAX);
    setMessageDelay(project, message.id, -5);
    expect(data.delay).toBe(0);
    setMessageDelay(project, message.id, Number.NaN);
    expect(data.delay).toBe(0);
  });
});

describe('choices', () => {
  it('adds, renames and removes a choice together with its connection', () => {
    const { project, message, add } = setup();
    const node = add('choice_question');
    addChoice(project, node.id, { id: 'c2', label: 'B', media: null });
    renameChoice(project, node.id, 'c2', 'Bee');
    connect(project, node.id, 'c2', message.id);

    expect(node.data.choices.map(c => c.label)).toEqual([node.data.choices[0]!.label, 'Bee']);
    expect(removeChoice(project, node.id, 'c2')).toBe(true);
    expect(node.data.choices).toHaveLength(1);
    expect(project.edges[edgeId(node.id, 'c2')]).toBeUndefined();
  });

  it('sets and clears choice media', () => {
    const { project, add } = setup();
    const node = add('choice_question');
    const choiceId = node.data.choices[0]!.id;

    expect(setChoiceMedia(project, node.id, choiceId, { kind: 'emoji', emoji: '🐶' })).toBe(true);
    expect(node.data.choices[0]!.media).toEqual({ kind: 'emoji', emoji: '🐶' });
    setChoiceMedia(project, node.id, choiceId, null);
    expect(node.data.choices[0]!.media).toBeNull();
    expect(setChoiceMedia(project, node.id, 'nope', null)).toBe(false);
  });

  it('keeps at least one choice', () => {
    const { project, add } = setup();
    const node = add('choice_question');
    expect(removeChoice(project, node.id, node.data.choices[0]!.id)).toBe(false);
    expect(node.data.choices).toHaveLength(1);
  });
});

describe('rules and conditions', () => {
  it('removes a rule with its connection and keeps at least one', () => {
    const { deps, project, message, add } = setup();
    const node = add('condition');
    const second = createRule(deps);
    addRule(project, node.id, second);
    connect(project, node.id, second.id, message.id);

    expect(removeRule(project, node.id, second.id)).toBe(true);
    expect(project.edges[edgeId(node.id, second.id)]).toBeUndefined();
    expect(removeRule(project, node.id, node.data.rules[0]!.id)).toBe(false);
  });

  it('updates and removes conditions but keeps at least one per rule', () => {
    const { deps, project, add, addVariable } = setup();
    const node = add('condition');
    const rule = node.data.rules[0]!;
    const extra = createCondition(deps);
    const age = addVariable('idade', 'number');

    addCondition(project, node.id, rule.id, extra);
    updateCondition(project, node.id, rule.id, extra.id, { variableId: age.id, operator: '>=', value: { kind: 'literal', value: 18 } });
    expect(rule.conditions[1]).toEqual({ id: extra.id, variableId: age.id, operator: '>=', value: { kind: 'literal', value: 18 } });

    expect(removeCondition(project, node.id, rule.id, extra.id)).toBe(true);
    expect(removeCondition(project, node.id, rule.id, rule.conditions[0]!.id)).toBe(false);
  });
});
