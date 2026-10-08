import { describe, it, expect } from 'vitest';
import { HANDLE_ELSE, HANDLE_OUT, type ChatNodeOf } from '../../types/chatbot';
import { connect, edgeId } from '../graph';
import { findAssetUsages, findVariableUsages, withoutUnusedAssets } from '../usages';
import { validateFlow } from '../validate';
import { setup } from './helpers';

describe('validateFlow', () => {
  it('only warns about the open end of a fresh project', () => {
    const { project, message } = setup();
    expect(validateFlow(project)).toEqual([
      { code: 'UNCONNECTED_OUTPUT', severity: 'warning', nodeId: message.id, handle: HANDLE_OUT }
    ]);
  });

  it('reports an unconnected Start as an error', () => {
    const { project, start } = setup();
    delete project.edges[edgeId(start.id, HANDLE_OUT)];
    expect(validateFlow(project)).toContainEqual({ code: 'START_NOT_CONNECTED', severity: 'error', nodeId: start.id });
  });

  it('reports unreachable nodes and every open output of a condition', () => {
    const { project, add } = setup();
    const condition = add('condition');
    const issues = validateFlow(project);
    expect(issues).toContainEqual({ code: 'UNREACHABLE_NODE', severity: 'warning', nodeId: condition.id });
    expect(issues).toContainEqual({ code: 'UNCONNECTED_OUTPUT', severity: 'warning', nodeId: condition.id, handle: condition.data.rules[0]!.id });
    expect(issues).toContainEqual({ code: 'UNCONNECTED_OUTPUT', severity: 'warning', nodeId: condition.id, handle: HANDLE_ELSE });
  });

  it('warns about choices without label and media only', () => {
    const { project, add } = setup();
    const node = add('choice_question');
    const [first] = node.data.choices;
    first!.label = '  ';
    expect(validateFlow(project)).toContainEqual({ code: 'EMPTY_CHOICE', severity: 'warning', nodeId: node.id, choiceId: first!.id });

    first!.media = { kind: 'emoji', emoji: '⭐' };
    expect(validateFlow(project).some(i => i.code === 'EMPTY_CHOICE')).toBe(false);
  });

  it('reports corrupted edges', () => {
    const { project, message } = setup();
    project.edges['bad'] = { id: 'bad', sourceNode: message.id, sourceHandle: 'nope', targetNode: 'ghost' };
    expect(validateFlow(project)).toContainEqual({ code: 'INVALID_EDGE', severity: 'error', edgeId: 'bad' });
  });

  it('checks variable selection, existence and numeric type', () => {
    const { project, message, add, addVariable } = setup();
    const name = addVariable('nome', 'text');
    const setVar = add('set_variable');
    const math = add('math') as ChatNodeOf<'math'>;
    connect(project, message.id, HANDLE_OUT, setVar.id);
    connect(project, setVar.id, HANDLE_OUT, math.id);

    math.data.variableId = name.id; // texto não pode receber conta
    math.data.operand = { kind: 'variable', variableId: 'deleted' };
    (message.data as { content: unknown }).content = {
      type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'clicVariable', attrs: { variableId: 'deleted' } }] }]
    };

    const issues = validateFlow(project);
    expect(issues).toContainEqual({ code: 'VARIABLE_NOT_SELECTED', severity: 'error', nodeId: setVar.id });
    expect(issues).toContainEqual({ code: 'VARIABLE_NOT_NUMBER', severity: 'error', nodeId: math.id, variableId: name.id });
    expect(issues).toContainEqual({ code: 'MISSING_VARIABLE', severity: 'error', nodeId: math.id, variableId: 'deleted' });
    expect(issues).toContainEqual({ code: 'MISSING_VARIABLE', severity: 'error', nodeId: message.id, variableId: 'deleted' });
  });

  it('warns about a random pick without filled options', () => {
    const { project, add, addVariable } = setup();
    const v = addVariable('v');
    const pick = add('set_variable');
    pick.data = { variableId: v.id, value: { kind: 'random', options: ['', ' '] } };
    expect(validateFlow(project)).toContainEqual({ code: 'EMPTY_RANDOM', severity: 'warning', nodeId: pick.id });

    pick.data.value = { kind: 'random', options: ['', 'x'] };
    expect(validateFlow(project).some(i => i.code === 'EMPTY_RANDOM')).toBe(false);
  });
});

describe('usages', () => {
  it('finds variables in text, selectors and values', () => {
    const { project, message, add, addVariable } = setup();
    const score = addVariable('pontos', 'number');
    const condition = add('condition');
    const setVar = add('set_variable');

    condition.data.rules[0]!.conditions[0]!.variableId = score.id;
    setVar.data.value = { kind: 'variable', variableId: score.id };
    (message.data as { content: unknown }).content = {
      type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'clicVariable', attrs: { variableId: score.id } }] }]
    };

    expect(findVariableUsages(project, score.id).sort()).toEqual([message.id, condition.id, setVar.id].sort());
  });

  it('finds uploaded files in node media and choice media, ignoring links', () => {
    const { project, message, add } = setup();
    const choice = add('choice_question');
    const end = add('end');
    (message.data as { media: unknown }).media = { media: { type: 'image', source: { kind: 'upload', assetId: 'a1' } }, position: 'before' };
    choice.data.choices[0]!.media = { kind: 'image', source: { kind: 'upload', assetId: 'a2' } };
    end.data.media = { media: { type: 'image', source: { kind: 'url', url: 'https://example.com/a3.gif' } }, position: 'after' };

    expect(findAssetUsages(project, 'a1')).toEqual([message.id]);
    expect(findAssetUsages(project, 'a2')).toEqual([choice.id]);
    expect(findAssetUsages(project, 'a3')).toEqual([]);
  });

  it('drops unused assets from a copy without touching the project', () => {
    const { project, message } = setup();
    const asset = (id: string) => ({ id, type: 'image/png', originalName: `${id}.png`, size: 1, hash: id, source: 'local' as const });
    project.assets = { used: asset('used'), orphan: asset('orphan') };
    (message.data as { media: unknown }).media = { media: { type: 'image', source: { kind: 'upload', assetId: 'used' } }, position: 'before' };

    const clean = withoutUnusedAssets(project);
    expect(Object.keys(clean.assets)).toEqual(['used']);
    expect(Object.keys(project.assets)).toEqual(['used', 'orphan']);
  });
});
