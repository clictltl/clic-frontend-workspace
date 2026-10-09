import { describe, it, expect } from 'vitest';
import type { ChatNodeOf, RichText } from '../../types/chatbot';
import { cloneNode } from '../clone';
import { createProject } from '../project';
import { createDeps, NOW, setup } from './helpers';

const doc = (...parts: RichText[]): RichText => ({ type: 'doc', content: [{ type: 'paragraph', content: parts }] });
const pill = (variableId: string): RichText => ({ type: 'clicVariable', attrs: { variableId } });
const asset = (id: string) => ({ id, type: 'image/png', originalName: `${id}.png`, size: 1, hash: id, source: 'local' as const });

describe('cloneNode', () => {
  it('copies content with new ids for the node, choices, rules and conditions', () => {
    const { project, deps, add } = setup();
    const choice = add('choice_question') as ChatNodeOf<'choice_question'>;
    choice.data.choices.push({ id: 'c2', label: 'B', media: null });
    const condition = add('condition') as ChatNodeOf<'condition'>;

    const choiceCopy = cloneNode(choice, project, { x: 50, y: 60 }, deps) as ChatNodeOf<'choice_question'>;
    expect(choiceCopy.id).not.toBe(choice.id);
    expect(choiceCopy.position).toEqual({ x: 50, y: 60 });
    expect(choiceCopy.data.choices.map(c => c.label)).toEqual(choice.data.choices.map(c => c.label));
    expect(choiceCopy.data.choices.map(c => c.id)).not.toContain('c2');
    expect(choice.data.choices[1]!.id).toBe('c2'); // original intacto

    const conditionCopy = cloneNode(condition, project, { x: 0, y: 0 }, deps) as ChatNodeOf<'condition'>;
    expect(conditionCopy.data.rules[0]!.id).not.toBe(condition.data.rules[0]!.id);
    expect(conditionCopy.data.rules[0]!.conditions[0]!.id).not.toBe(condition.data.rules[0]!.conditions[0]!.id);
  });

  it('keeps variables and uploaded images in the same project', () => {
    const { project, deps, add, addVariable, message } = setup();
    const name = addVariable('nome');
    project.assets = { img: asset('img') };
    (message.data as { content: RichText }).content = doc({ type: 'text', text: 'Oi ' }, pill(name.id));
    (message.data as { media: unknown }).media = { media: { type: 'image', source: { kind: 'upload', assetId: 'img' } }, position: 'before' };
    const ask = add('open_question') as ChatNodeOf<'open_question'>;
    ask.data.variableId = name.id;

    const messageCopy = cloneNode(message, project, { x: 0, y: 0 }, deps)!;
    expect(messageCopy.data).toEqual(message.data);
    expect((cloneNode(ask, project, { x: 0, y: 0 }, deps) as ChatNodeOf<'open_question'>).data.variableId).toBe(name.id);
  });

  it('drops variables and uploaded images missing in another project, keeping links', () => {
    const { project, deps, add, addVariable, message } = setup();
    const name = addVariable('nome');
    project.assets = { img: asset('img') };
    (message.data as { content: RichText }).content = doc({ type: 'text', text: 'Oi ' }, pill(name.id));
    (message.data as { media: unknown }).media = { media: { type: 'image', source: { kind: 'upload', assetId: 'img' } }, position: 'before' };

    const choice = add('choice_question') as ChatNodeOf<'choice_question'>;
    choice.data.choices[0]!.media = { kind: 'image', source: { kind: 'upload', assetId: 'img' } };
    choice.data.choices.push({ id: 'c2', label: 'B', media: { kind: 'image', source: { kind: 'url', url: 'https://example.com/a.png' } } });

    const condition = add('condition') as ChatNodeOf<'condition'>;
    Object.assign(condition.data.rules[0]!.conditions[0]!, { variableId: name.id, operator: '>', value: { kind: 'variable', variableId: name.id } });

    const setVar = add('set_variable') as ChatNodeOf<'set_variable'>;
    setVar.data = { variableId: name.id, value: { kind: 'random', options: ['a', 'b'] } };

    const other = createProject(createDeps(), NOW); // projeto sem variáveis nem assets

    const messageCopy = cloneNode(message, other, { x: 0, y: 0 }, deps)!;
    expect('content' in messageCopy.data && messageCopy.data.content).toEqual(doc({ type: 'text', text: 'Oi ' }));
    expect('media' in messageCopy.data && messageCopy.data.media).toBeNull();

    const choiceCopy = cloneNode(choice, other, { x: 0, y: 0 }, deps) as ChatNodeOf<'choice_question'>;
    expect(choiceCopy.data.choices[0]!.media).toBeNull();
    expect(choiceCopy.data.choices[1]!.media).toEqual({ kind: 'image', source: { kind: 'url', url: 'https://example.com/a.png' } });

    const conditionCopy = cloneNode(condition, other, { x: 0, y: 0 }, deps) as ChatNodeOf<'condition'>;
    expect(conditionCopy.data.rules[0]!.conditions[0]).toMatchObject({ variableId: null, operator: '>', value: { kind: 'literal', value: '' } });

    const setCopy = cloneNode(setVar, other, { x: 0, y: 0 }, deps) as ChatNodeOf<'set_variable'>;
    expect(setCopy.data).toEqual({ variableId: null, value: { kind: 'random', options: ['a', 'b'] } });
  });

  it('removes a pill-only paragraph content and never clones the Start', () => {
    const { project, deps, message, start } = setup();
    (message.data as { content: RichText }).content = doc(pill('missing'));
    const copy = cloneNode(message, project, { x: 0, y: 0 }, deps)!;
    expect('content' in copy.data && copy.data.content).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
    expect(cloneNode(start, project, { x: 0, y: 0 }, deps)).toBeNull();
  });
});
