import {
  HANDLE_ELSE, HANDLE_OUT,
  type ChatbotProject, type ChatNode, type ComparisonOperator, type Condition, type NodeMedia, type RichText, type Rule, type Value
} from '../types/chatbot';
import { edgeId } from '../domain/graph';
import { RICH_TEXT_NODES } from '../domain/richText';
import { coerceVariableValue } from '../domain/variables';
import type { ChatMessage, ChatState, ChatValues } from './types';

/**
 * MOTOR DE CONVERSA
 *
 * Funções puras e determinísticas: o mesmo projeto com as mesmas respostas gera
 * sempre a mesma conversa (base para reproduzir testes no session replay).
 * O motor avança até a próxima pausa (pergunta ou fim) e devolve todas as mensagens
 * de uma vez; o ritmo ("digitando…", tempo de espera) é responsabilidade da interface.
 * Nunca altera o projeto nem o estado recebidos.
 */

/** Passos automáticos permitidos sem nenhuma pergunta (protege contra ciclos infinitos). */
export const MAX_AUTO_STEPS = 1000;

export function startChat(project: ChatbotProject): ChatState {
  const values: ChatValues = {};
  for (const variable of Object.values(project.variables)) values[variable.id] = variable.defaultValue;

  const state: ChatState = { status: 'ended', currentNodeId: null, messages: [], choices: [], values, error: null };
  const start = Object.values(project.nodes).find(n => n.type === 'start');
  if (!start) return { ...state, error: 'NO_START_BLOCK' };

  return run(project, state, start.id);
}

export function submitText(project: ChatbotProject, state: ChatState, rawText: string): ChatState {
  const text = rawText.trim();
  const node = state.currentNodeId ? project.nodes[state.currentNodeId] : undefined;
  if (state.status !== 'waiting_text' || !text || node?.type !== 'open_question') return state;

  const next = fork(state);
  pushMessage(next, { from: 'user', text, media: null });

  const variable = node.data.variableId ? project.variables[node.data.variableId] : undefined;
  if (variable) next.values[variable.id] = coerceVariableValue(variable.type, text);

  return run(project, next, target(project, node.id, HANDLE_OUT));
}

export function selectChoice(project: ChatbotProject, state: ChatState, choiceId: string): ChatState {
  const choice = state.choices.find(c => c.id === choiceId);
  if (state.status !== 'waiting_choice' || !choice || !state.currentNodeId) return state;

  const next = fork(state);
  pushMessage(next, { from: 'user', text: choice.label, media: choice.media });
  return run(project, next, target(project, state.currentNodeId, choice.id));
}

// --- EXECUÇÃO ---

function fork(state: ChatState): ChatState {
  return { ...state, messages: [...state.messages], values: { ...state.values }, choices: [], error: null };
}

/** `Omit` distributivo: mantém o union bot/user sem o `id` (gerado aqui). */
type NewMessage = ChatMessage extends infer M ? (M extends unknown ? Omit<M, 'id'> : never) : never;

function pushMessage(state: ChatState, message: NewMessage) {
  state.messages.push({ ...message, id: state.messages.length + 1 } as ChatMessage);
}

/** Destino da saída `handle` do nó; saída sem conexão encerra a conversa. */
function target(project: ChatbotProject, nodeId: string, handle: string): string | null {
  const edge = project.edges[edgeId(nodeId, handle)];
  return edge && project.nodes[edge.targetNode] ? edge.targetNode : null;
}

function run(project: ChatbotProject, state: ChatState, firstNodeId: string | null): ChatState {
  let nodeId = firstNodeId;
  let steps = 0;

  while (nodeId) {
    if (++steps > MAX_AUTO_STEPS) return { ...state, status: 'ended', choices: [], error: 'LOOP_LIMIT' };
    const node: ChatNode | undefined = project.nodes[nodeId];
    if (!node) break;
    state.currentNodeId = node.id;

    switch (node.type) {
      case 'start':
        nodeId = target(project, node.id, HANDLE_OUT);
        break;

      case 'message':
        pushBotMessage(project, state, node.id, node.data.content, node.data.media, node.data.delay);
        nodeId = target(project, node.id, HANDLE_OUT);
        break;

      case 'open_question':
        pushBotMessage(project, state, node.id, node.data.content, node.data.media, 0);
        return { ...state, status: 'waiting_text', choices: [] };

      case 'choice_question':
        pushBotMessage(project, state, node.id, node.data.content, node.data.media, 0);
        return { ...state, status: 'waiting_choice', choices: node.data.choices.map(c => ({ ...c })) };

      case 'condition': {
        const rule = node.data.rules.find(r => matchesRule(project, state.values, r));
        nodeId = target(project, node.id, rule ? rule.id : HANDLE_ELSE);
        break;
      }

      case 'set_variable': {
        const variable = node.data.variableId ? project.variables[node.data.variableId] : undefined;
        const value = resolveValue(state.values, node.data.value);
        if (variable && value !== undefined) state.values[variable.id] = coerceVariableValue(variable.type, value);
        nodeId = target(project, node.id, HANDLE_OUT);
        break;
      }

      case 'math': {
        const variable = node.data.variableId ? project.variables[node.data.variableId] : undefined;
        if (variable) {
          const current = Number(state.values[variable.id]) || 0;
          const operand = Number(resolveValue(state.values, node.data.operand)) || 0;
          state.values[variable.id] = calculate(current, node.data.operator, operand);
        }
        nodeId = target(project, node.id, HANDLE_OUT);
        break;
      }

      case 'end':
        pushBotMessage(project, state, node.id, node.data.content, node.data.media, 0);
        return { ...state, status: 'ended', choices: [] };
    }
  }

  return { ...state, status: 'ended', choices: [] };
}

function pushBotMessage(
  project: ChatbotProject, state: ChatState, nodeId: string,
  content: RichText, media: NodeMedia | null, delayAfter: number
) {
  pushMessage(state, { from: 'bot', nodeId, content: interpolate(project, state.values, content), media, delayAfter });
}

// --- VALORES E CONDIÇÕES ---

function resolveValue(values: ChatValues, value: Value): string | number | undefined {
  return value.kind === 'literal' ? value.value : values[value.variableId];
}

function calculate(current: number, operator: '+' | '-' | '*' | '/', operand: number): number {
  switch (operator) {
    case '+': return current + operand;
    case '-': return current - operand;
    case '*': return current * operand;
    case '/': return operand !== 0 ? current / operand : current; // Divisão por zero mantém o valor
  }
}

function matchesRule(project: ChatbotProject, values: ChatValues, rule: Rule): boolean {
  const check = (condition: Condition) => matchesCondition(project, values, condition);
  return rule.match === 'any' ? rule.conditions.some(check) : rule.conditions.every(check);
}

function matchesCondition(project: ChatbotProject, values: ChatValues, condition: Condition): boolean {
  const variable = condition.variableId ? project.variables[condition.variableId] : undefined;
  if (!variable) return false;
  const left = values[variable.id];
  const right = resolveValue(values, condition.value);
  if (left === undefined || right === undefined) return false;

  if (variable.type === 'number') return compare(Number(left), condition.operator, Number(right));

  // Texto: igualdade ignora maiúsculas e espaços nas pontas (como no v1)
  const a = String(left);
  const b = String(right);
  if (condition.operator === '==' || condition.operator === '!=') {
    const equal = a.trim().toLowerCase() === b.trim().toLowerCase();
    return condition.operator === '==' ? equal : !equal;
  }
  return compare(a, condition.operator, b);
}

function compare<T extends number | string>(a: T, operator: ComparisonOperator, b: T): boolean {
  switch (operator) {
    case '==': return a === b;
    case '!=': return a !== b;
    case '>': return a > b;
    case '<': return a < b;
    case '>=': return a >= b;
    case '<=': return a <= b;
  }
}

// --- TEXTO ---

/** Troca cada pílula de variável pelo valor atual (`?` se a variável foi excluída). */
function interpolate(project: ChatbotProject, values: ChatValues, doc: RichText): RichText {
  const replace = (node: RichText): RichText | null => {
    if (node.type === RICH_TEXT_NODES.variable) {
      const id = node.attrs?.variableId as string | undefined;
      const text = id && project.variables[id] ? String(values[id] ?? '') : '?';
      return text ? { type: 'text', text, ...(node.marks ? { marks: node.marks } : {}) } : null;
    }
    if (!node.content) return { ...node };
    return { ...node, content: node.content.map(replace).filter((n): n is RichText => n !== null) };
  };
  return replace(doc) ?? { type: 'doc', content: [] };
}
