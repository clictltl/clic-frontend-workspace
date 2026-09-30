import {
  HANDLE_ELSE,
  HANDLE_OUT,
  MESSAGE_DELAY_MAX,
  type ChatbotProject,
  type ChatEdge,
  type ChatNode,
  type ChatNodeOf,
  type Choice,
  type ChoiceMedia,
  type Condition,
  type Media,
  type NodeMedia,
  type NodeType,
  type Position,
  type Rule,
} from '../types/chatbot';
import { isValidMedia, isValidSource } from './media';

/**
 * OPERAÇÕES DO GRAFO
 *
 * Funções puras que alteram o projeto recebido (para serem chamadas dentro das
 * actions do Pinia). Cada uma aplica a regra de negócio completa, incluindo
 * cascatas, para que um gesto do aluno gere uma única mutação no histórico.
 * Retornam `false`/erro quando a operação não é permitida, sem alterar nada.
 */

export function edgeId(sourceNode: string, sourceHandle: string): string {
  return `${sourceNode}:${sourceHandle}`;
}

/** Busca um nó garantindo o tipo (útil para as actions que editam um tipo específico). */
export function getNodeOfType<T extends NodeType>(project: ChatbotProject, nodeId: string, type: T): ChatNodeOf<T> | null {
  const node = project.nodes[nodeId];
  return node && node.type === type ? (node as ChatNodeOf<T>) : null;
}

/** Saídas (handles) que um nó expõe, na ordem em que aparecem. */
export function getOutputHandles(node: ChatNode): string[] {
  switch (node.type) {
    case 'end':
      return [];
    case 'choice_question':
      return node.data.choices.map(c => c.id);
    case 'condition':
      return [...node.data.rules.map(r => r.id), HANDLE_ELSE];
    default:
      return [HANDLE_OUT];
  }
}

// --- NÓS ---

export function addNode(project: ChatbotProject, node: ChatNode) {
  project.nodes[node.id] = node;
}

/** Remove o nó e todas as conexões que entram ou saem dele. O Início nunca é removido. */
export function deleteNode(project: ChatbotProject, nodeId: string): boolean {
  const node = project.nodes[nodeId];
  if (!node || node.type === 'start') return false;

  delete project.nodes[nodeId];
  for (const edge of Object.values(project.edges)) {
    if (edge.sourceNode === nodeId || edge.targetNode === nodeId) delete project.edges[edge.id];
  }
  return true;
}

/** Move vários nós de uma vez (um arraste com seleção múltipla = uma mutação). */
export function moveNodes(project: ChatbotProject, moves: { id: string; position: Position }[]) {
  for (const { id, position } of moves) {
    const node = project.nodes[id];
    if (node) node.position = { x: position.x, y: position.y };
  }
}

/**
 * Define (ou remove, com `null`) a mídia de um nó com texto. Trocar a mídia mantém
 * a posição escolhida; mídia nova começa antes do texto. Links inseguros são recusados.
 */
export function setNodeMedia(project: ChatbotProject, nodeId: string, media: Media | null): boolean {
  const node = project.nodes[nodeId];
  if (!node || !('media' in node.data)) return false;
  if (media && !isValidMedia(media)) return false;

  node.data.media = media ? { media, position: node.data.media?.position ?? 'before' } : null;
  return true;
}

export function setMediaPosition(project: ChatbotProject, nodeId: string, position: NodeMedia['position']): boolean {
  const node = project.nodes[nodeId];
  if (!node || !('media' in node.data) || !node.data.media) return false;
  node.data.media.position = position;
  return true;
}

/** Espera após a mensagem, em segundos inteiros entre 0 e MESSAGE_DELAY_MAX. */
export function setMessageDelay(project: ChatbotProject, nodeId: string, seconds: number): boolean {
  const node = getNodeOfType(project, nodeId, 'message');
  if (!node) return false;
  const value = Number.isFinite(seconds) ? Math.round(seconds) : 0;
  node.data.delay = Math.min(MESSAGE_DELAY_MAX, Math.max(0, value));
  return true;
}

// --- CONEXÕES ---

export type ConnectResult =
  | { ok: true; edge: ChatEdge }
  | { ok: false; error: 'NODE_NOT_FOUND' | 'SELF_CONNECTION' | 'INVALID_HANDLE' | 'TARGET_IS_START' };

/**
 * Liga uma saída a um nó. Como cada saída tem no máximo uma conexão,
 * uma conexão existente na mesma saída é substituída (mantendo a cor).
 */
export function connect(project: ChatbotProject, sourceNode: string, sourceHandle: string, targetNode: string): ConnectResult {
  const source = project.nodes[sourceNode];
  const target = project.nodes[targetNode];
  if (!source || !target) return { ok: false, error: 'NODE_NOT_FOUND' };
  if (sourceNode === targetNode) return { ok: false, error: 'SELF_CONNECTION' };
  if (target.type === 'start') return { ok: false, error: 'TARGET_IS_START' };
  if (!getOutputHandles(source).includes(sourceHandle)) return { ok: false, error: 'INVALID_HANDLE' };

  const id = edgeId(sourceNode, sourceHandle);
  const previous = project.edges[id];
  const edge: ChatEdge = { id, sourceNode, sourceHandle, targetNode };
  if (previous?.color) edge.color = previous.color;

  project.edges[id] = edge;
  return { ok: true, edge };
}

export function disconnect(project: ChatbotProject, id: string): boolean {
  if (!project.edges[id]) return false;
  delete project.edges[id];
  return true;
}

export function setEdgeColor(project: ChatbotProject, id: string, color: string): boolean {
  const edge = project.edges[id];
  if (!edge) return false;
  edge.color = color;
  return true;
}

// --- OPÇÕES (MÚLTIPLA ESCOLHA) ---

export function addChoice(project: ChatbotProject, nodeId: string, choice: Choice): boolean {
  const node = getNodeOfType(project, nodeId, 'choice_question');
  if (!node) return false;
  node.data.choices.push(choice);
  return true;
}

export function renameChoice(project: ChatbotProject, nodeId: string, choiceId: string, label: string): boolean {
  const choice = getNodeOfType(project, nodeId, 'choice_question')?.data.choices.find(c => c.id === choiceId);
  if (!choice) return false;
  choice.label = label;
  return true;
}

export function setChoiceMedia(project: ChatbotProject, nodeId: string, choiceId: string, media: ChoiceMedia | null): boolean {
  const choice = getNodeOfType(project, nodeId, 'choice_question')?.data.choices.find(c => c.id === choiceId);
  if (!choice) return false;
  if (media?.kind === 'image' && !isValidSource(media.source)) return false;
  choice.media = media;
  return true;
}

/** Remove a opção e a conexão da saída dela. A última opção não pode ser removida. */
export function removeChoice(project: ChatbotProject, nodeId: string, choiceId: string): boolean {
  const node = getNodeOfType(project, nodeId, 'choice_question');
  if (!node || node.data.choices.length <= 1) return false;

  const index = node.data.choices.findIndex(c => c.id === choiceId);
  if (index === -1) return false;

  node.data.choices.splice(index, 1);
  delete project.edges[edgeId(nodeId, choiceId)];
  return true;
}

// --- REGRAS E CONDIÇÕES ---

function findRule(project: ChatbotProject, nodeId: string, ruleId: string): Rule | undefined {
  return getNodeOfType(project, nodeId, 'condition')?.data.rules.find(r => r.id === ruleId);
}

export function addRule(project: ChatbotProject, nodeId: string, rule: Rule): boolean {
  const node = getNodeOfType(project, nodeId, 'condition');
  if (!node) return false;
  node.data.rules.push(rule);
  return true;
}

/** Remove a regra e a conexão da saída dela. A última regra não pode ser removida. */
export function removeRule(project: ChatbotProject, nodeId: string, ruleId: string): boolean {
  const node = getNodeOfType(project, nodeId, 'condition');
  if (!node || node.data.rules.length <= 1) return false;

  const index = node.data.rules.findIndex(r => r.id === ruleId);
  if (index === -1) return false;

  node.data.rules.splice(index, 1);
  delete project.edges[edgeId(nodeId, ruleId)];
  return true;
}

export function setRuleMatch(project: ChatbotProject, nodeId: string, ruleId: string, match: Rule['match']): boolean {
  const rule = findRule(project, nodeId, ruleId);
  if (!rule) return false;
  rule.match = match;
  return true;
}

export function addCondition(project: ChatbotProject, nodeId: string, ruleId: string, condition: Condition): boolean {
  const rule = findRule(project, nodeId, ruleId);
  if (!rule) return false;
  rule.conditions.push(condition);
  return true;
}

export function updateCondition(
  project: ChatbotProject, nodeId: string, ruleId: string, conditionId: string,
  changes: Partial<Omit<Condition, 'id'>>
): boolean {
  const condition = findRule(project, nodeId, ruleId)?.conditions.find(c => c.id === conditionId);
  if (!condition) return false;
  Object.assign(condition, changes);
  return true;
}

/** A última condição de uma regra não pode ser removida (remova a regra inteira). */
export function removeCondition(project: ChatbotProject, nodeId: string, ruleId: string, conditionId: string): boolean {
  const rule = findRule(project, nodeId, ruleId);
  if (!rule || rule.conditions.length <= 1) return false;

  const index = rule.conditions.findIndex(c => c.id === conditionId);
  if (index === -1) return false;

  rule.conditions.splice(index, 1);
  return true;
}
