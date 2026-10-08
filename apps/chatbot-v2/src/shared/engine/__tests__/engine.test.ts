import { describe, it, expect } from 'vitest';
import { HANDLE_ELSE, HANDLE_OUT, type ChatNode, type RichText } from '../../types/chatbot';
import { connect, edgeId } from '../../domain/graph';
import { createCondition, createRule } from '../../domain/project';
import { walkRichText } from '../../domain/richText';
import { MAX_AUTO_STEPS, selectChoice, startChat, submitText } from '../engine';
import type { ChatState } from '../types';
import { setup } from '../../domain/__tests__/helpers';

/** Texto simples de um documento (para comparar mensagens). */
function plain(doc: RichText): string {
  let text = '';
  walkRichText(doc, node => { if (node.type === 'text') text += node.text; });
  return text;
}

const doc = (...parts: RichText[]): RichText => ({ type: 'doc', content: [{ type: 'paragraph', content: parts }] });
const text = (value: string): RichText => ({ type: 'text', text: value });
const variable = (id: string): RichText => ({ type: 'clicVariable', attrs: { variableId: id } });

/** Item contado a partir do fim (1 = último). */
const fromEnd = <T>(items: T[], n = 1): T | undefined => items[items.length - n];

function botTexts(state: ChatState) {
  return state.messages.filter(m => m.from === 'bot').map(m => plain(m.content));
}

/** Projeto Início → Mensagem, com helpers para encadear nós a partir da mensagem. */
function flow() {
  const ctx = setup();
  const link = (from: ChatNode, to: ChatNode, handle = HANDLE_OUT) => connect(ctx.project, from.id, handle, to.id);
  const setText = (node: ChatNode, content: RichText) => { (node.data as { content: RichText }).content = content; };
  return { ...ctx, link, setText };
}

describe('start and messages', () => {
  it('runs messages until the end and stops when an output is not connected', () => {
    const { project, message, add, link, setText } = flow();
    const second = add('message');
    setText(message, doc(text('Oi')));
    setText(second, doc(text('Tudo bem?')));
    link(message, second);

    const state = startChat(project);
    expect(botTexts(state)).toEqual(['Oi', 'Tudo bem?']);
    expect(state.status).toBe('ended');
    expect(state.error).toBeNull();
    expect(state.currentNodeId).toBe(second.id);
  });

  it('ends with an error when there is no Start node', () => {
    const { project, start } = flow();
    delete project.nodes[start.id];
    expect(startChat(project)).toMatchObject({ status: 'ended', error: 'NO_START_BLOCK', messages: [] });
  });

  it('ends silently when Start is not connected', () => {
    const { project, start } = flow();
    delete project.edges[edgeId(start.id, HANDLE_OUT)];
    expect(startChat(project)).toMatchObject({ status: 'ended', error: null, messages: [] });
  });

  it('passes delay and media of message nodes to the interface', () => {
    const { project, message } = flow();
    const data = message.data as { delay: number; media: unknown };
    data.delay = 3;
    data.media = { media: { type: 'image', source: { kind: 'url', url: 'https://a.com/x.gif' } }, position: 'after' };

    const [bot] = startChat(project).messages;
    expect(bot).toMatchObject({ from: 'bot', nodeId: message.id, delayAfter: 3, media: data.media });
  });

  it('stops infinite loops without questions', () => {
    const { project, message, add, link } = flow();
    const other = add('message');
    link(message, other);
    link(other, message);

    const state = startChat(project);
    expect(state).toMatchObject({ status: 'ended', error: 'LOOP_LIMIT' });
    expect(state.messages.length).toBe(MAX_AUTO_STEPS - 1); // todos os passos menos o Início
  });
});

describe('open question', () => {
  it('waits for text, stores it and continues', () => {
    const { project, message, add, addVariable, link, setText } = flow();
    const name = addVariable('nome');
    const question = add('open_question');
    const reply = add('message');
    question.data.variableId = name.id;
    setText(reply, doc(text('Olá, '), variable(name.id), text('!')));
    link(message, question);
    link(question, reply);

    let state = startChat(project);
    expect(state.status).toBe('waiting_text');
    expect(state.currentNodeId).toBe(question.id);

    expect(submitText(project, state, '   ')).toBe(state); // vazio é ignorado
    state = submitText(project, state, '  Ana ');
    expect(fromEnd(state.messages, 2)).toMatchObject({ from: 'user', text: 'Ana' });
    expect(state.values[name.id]).toBe('Ana');
    expect(fromEnd(botTexts(state))).toBe('Olá, Ana!');
    expect(state.status).toBe('ended');
  });

  it('coerces answers for number variables (invalid number becomes 0)', () => {
    const { project, message, add, addVariable, link } = flow();
    const age = addVariable('idade', 'number');
    const question = add('open_question');
    question.data.variableId = age.id;
    link(message, question);

    const start = startChat(project);
    expect(submitText(project, start, '12').values[age.id]).toBe(12);
    expect(submitText(project, start, 'doze').values[age.id]).toBe(0);
  });

  it('does not change the previous state (pure)', () => {
    const { project, message, add, link } = flow();
    const question = add('open_question');
    link(message, question);
    const state = startChat(project);
    const snapshot = JSON.stringify(state);
    submitText(project, state, 'oi');
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('choice question', () => {
  it('offers choices and follows the chosen one, echoing label and media', () => {
    const { project, message, add, link, setText } = flow();
    const question = add('choice_question');
    const choice = question.data.choices[0]!;
    choice.label = 'Cachorro';
    choice.media = { kind: 'emoji', emoji: '🐶' };
    const dog = add('message');
    setText(dog, doc(text('Au au')));
    link(message, question);
    link(question, dog, choice.id);

    let state = startChat(project);
    expect(state.status).toBe('waiting_choice');
    expect(state.choices.map(c => c.label)).toEqual(['Cachorro']);

    expect(selectChoice(project, state, 'nope')).toBe(state);
    state = selectChoice(project, state, choice.id);
    expect(fromEnd(state.messages, 2)).toMatchObject({ from: 'user', text: 'Cachorro', media: { kind: 'emoji', emoji: '🐶' } });
    expect(fromEnd(botTexts(state))).toBe('Au au');
    expect(state.choices).toEqual([]);
  });
});

describe('condition', () => {
  function conditionFlow(type: 'text' | 'number' = 'number') {
    const ctx = flow();
    const v = ctx.addVariable('v', type);
    const node = ctx.add('condition');
    const yes = ctx.add('message');
    const no = ctx.add('message');
    ctx.setText(yes, doc(text('sim')));
    ctx.setText(no, doc(text('não')));
    ctx.link(ctx.message, node);
    ctx.link(node, yes, node.data.rules[0]!.id);
    ctx.link(node, no, HANDLE_ELSE);
    return { ...ctx, v, node, rule: node.data.rules[0]! };
  }

  it('follows the first matching rule or else', () => {
    const { project, v, rule } = conditionFlow();
    Object.assign(rule.conditions[0]!, { variableId: v.id, operator: '>=', value: { kind: 'literal', value: 10 } });

    project.variables[v.id]!.defaultValue = 10;
    expect(fromEnd(botTexts(startChat(project)))).toBe('sim');
    project.variables[v.id]!.defaultValue = 9;
    expect(fromEnd(botTexts(startChat(project)))).toBe('não');
  });

  it('compares text ignoring case and surrounding spaces', () => {
    const { project, v, rule } = conditionFlow('text');
    project.variables[v.id]!.defaultValue = '  AZUL ';
    Object.assign(rule.conditions[0]!, { variableId: v.id, operator: '==', value: { kind: 'literal', value: 'azul' } });
    expect(fromEnd(botTexts(startChat(project)))).toBe('sim');
  });

  it('compares text variables as numbers when both sides look like numbers', () => {
    const { project, v, rule } = conditionFlow('text');
    const check = (current: string, operator: string, value: string | number) => {
      project.variables[v.id]!.defaultValue = current;
      Object.assign(rule.conditions[0]!, { variableId: v.id, operator, value: { kind: 'literal', value } });
      return fromEnd(botTexts(startChat(project)));
    };

    expect(check('10', '>', '9')).toBe('sim'); // Como texto, "10" < "9"
    expect(check('1,5', '<', '2')).toBe('sim');
    expect(check(' 10 ', '==', '10.0')).toBe('sim');
    expect(check('12', '>', 10)).toBe('sim');
    expect(check('abc', '<', 'abd')).toBe('sim'); // Não numérico: segue como texto
    expect(check('', '==', '0')).toBe('não'); // Vazio não é número
  });

  it('supports all/any matching and values read from another variable', () => {
    const { deps, project, v, rule, addVariable } = conditionFlow();
    const limit = addVariable('limite', 'number');
    project.variables[v.id]!.defaultValue = 5;
    project.variables[limit.id]!.defaultValue = 3;

    Object.assign(rule.conditions[0]!, { variableId: v.id, operator: '>', value: { kind: 'variable', variableId: limit.id } });
    const second = createCondition(deps);
    Object.assign(second, { variableId: v.id, operator: '==', value: { kind: 'literal', value: 100 } });
    rule.conditions.push(second);

    expect(fromEnd(botTexts(startChat(project)))).toBe('não'); // all: 5 > 3 E 5 == 100
    rule.match = 'any';
    expect(fromEnd(botTexts(startChat(project)))).toBe('sim'); // any
  });

  it('treats conditions without a valid variable as false', () => {
    const { deps, project, node, rule } = conditionFlow();
    rule.conditions[0]!.variableId = 'deleted';
    node.data.rules.push(createRule(deps));
    expect(fromEnd(botTexts(startChat(project)))).toBe('não');
  });
});

describe('set variable and math', () => {
  it('assigns literal or copied values converted to the target type', () => {
    const { project, message, add, addVariable, link, setText } = flow();
    const a = addVariable('a', 'number');
    const b = addVariable('b', 'text');
    const setA = add('set_variable');
    const setB = add('set_variable');
    const show = add('message');
    setA.data = { variableId: a.id, value: { kind: 'literal', value: '7' } };
    setB.data = { variableId: b.id, value: { kind: 'variable', variableId: a.id } };
    setText(show, doc(variable(a.id), text('/'), variable(b.id)));
    link(message, setA);
    link(setA, setB);
    link(setB, show);

    const state = startChat(project);
    expect(state.values[a.id]).toBe(7);
    expect(state.values[b.id]).toBe('7');
    expect(fromEnd(botTexts(state))).toBe('7/7');
  });

  it('calculates and keeps the value on division by zero', () => {
    const { project, message, add, addVariable, link } = flow();
    const n = addVariable('n', 'number');
    project.variables[n.id]!.defaultValue = 10;
    const ops = (['+', '*', '/', '-'] as const).map((operator, i) => {
      const node = add('math');
      node.data = { variableId: n.id, operator, operand: { kind: 'literal', value: [5, 2, 0, 1][i]! } };
      return node;
    });
    link(message, ops[0]!);
    ops.slice(1).forEach((node, i) => link(ops[i]!, node));

    expect(startChat(project).values[n.id]).toBe(29); // ((10 + 5) * 2) / 0 → 30, - 1
  });

  /** Mensagem → sorteio → pergunta aberta que volta para o sorteio. */
  function randomLoop(options: string[], type: 'text' | 'number' = 'text') {
    const ctx = flow();
    const v = ctx.addVariable('v', type);
    const pick = ctx.add('set_variable');
    const ask = ctx.add('open_question');
    pick.data = { variableId: v.id, value: { kind: 'random', options } };
    ctx.link(ctx.message, pick);
    ctx.link(pick, ask);
    ctx.link(ask, pick);
    return { ...ctx, v };
  }

  it('picks one of the filled options, reproducibly for the same seed', () => {
    const { project, v } = randomLoop(['pedra', ' ', 'papel', 'tesoura']);
    const picked = new Set<string | number>();
    for (let seed = 0; seed < 50; seed++) {
      const state = startChat(project, seed);
      expect(startChat(project, seed).values[v.id]).toBe(state.values[v.id]);
      picked.add(state.values[v.id]!);
    }
    expect([...picked].sort()).toEqual(['papel', 'pedra', 'tesoura']);
  });

  it('draws again each time the conversation passes through the block', () => {
    const { project, v } = randomLoop(['a', 'b', 'c', 'd', 'e']);
    let state = startChat(project, 123);
    const draws = [state.values[v.id]];
    for (let i = 0; i < 9; i++) {
      const before = state.rng;
      state = submitText(project, state, 'de novo');
      expect(state.rng).not.toBe(before);
      draws.push(state.values[v.id]);
    }
    expect(new Set(draws).size).toBeGreaterThan(1);

    // Mesmas respostas e mesma semente: mesmos sorteios
    let replay = startChat(project, 123);
    const replayed = [replay.values[v.id]];
    for (let i = 0; i < 9; i++) {
      replay = submitText(project, replay, 'de novo');
      replayed.push(replay.values[v.id]);
    }
    expect(replayed).toEqual(draws);
  });

  it('keeps the variable when there is no filled option', () => {
    const { project, v } = randomLoop(['', '  ']);
    project.variables[v.id]!.defaultValue = 'antes';
    const state = startChat(project, 1);
    expect(state.values[v.id]).toBe('antes');
    expect(state.rng).toBe(1);
  });

  it('converts the picked option for old number variables', () => {
    const { project, v } = randomLoop(['3', '3,5'], 'number');
    expect([3, 3.5]).toContain(startChat(project, 5).values[v.id]);
  });

  it('skips nodes whose variable was deleted and shows ? in text', () => {
    const { project, message, add, link, setText } = flow();
    const setVar = add('set_variable');
    const show = add('message');
    setVar.data = { variableId: 'deleted', value: { kind: 'literal', value: 'x' } };
    setText(show, doc(text('['), variable('deleted'), text(']')));
    link(message, setVar);
    link(setVar, show);

    const state = startChat(project);
    expect(state.error).toBeNull();
    expect(fromEnd(botTexts(state))).toBe('[?]');
  });
});

describe('end', () => {
  it('shows the final message and ends', () => {
    const { project, message, add, link, setText } = flow();
    const end = add('end');
    setText(end, doc(text('Tchau')));
    link(message, end);
    const state = startChat(project);
    expect(fromEnd(botTexts(state))).toBe('Tchau');
    expect(state).toMatchObject({ status: 'ended', currentNodeId: end.id, error: null });
  });
});
