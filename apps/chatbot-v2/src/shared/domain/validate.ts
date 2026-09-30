import type { ChatbotProject, ChatNode, Value } from '../types/chatbot';
import { edgeId, getOutputHandles } from './graph';
import { collectVariableIds } from './richText';

/**
 * VALIDAÇÃO DO FLUXO
 *
 * Lista problemas que impedem ou prejudicam a execução do chatbot.
 * - error:   o runtime não consegue seguir (ex.: variável inexistente)
 * - warning: o fluxo roda, mas provavelmente não como o aluno espera
 * A UI traduz os códigos (`code`) via i18n; o domínio não tem texto visível.
 */

export type FlowIssue =
  | { code: 'NO_START'; severity: 'error' }
  | { code: 'START_NOT_CONNECTED'; severity: 'error'; nodeId: string }
  | { code: 'UNCONNECTED_OUTPUT'; severity: 'warning'; nodeId: string; handle: string }
  | { code: 'UNREACHABLE_NODE'; severity: 'warning'; nodeId: string }
  | { code: 'VARIABLE_NOT_SELECTED'; severity: 'error'; nodeId: string; conditionId?: string }
  | { code: 'MISSING_VARIABLE'; severity: 'error'; nodeId: string; variableId: string }
  | { code: 'VARIABLE_NOT_NUMBER'; severity: 'error'; nodeId: string; variableId: string }
  | { code: 'INVALID_EDGE'; severity: 'error'; edgeId: string };

export function validateFlow(project: ChatbotProject): FlowIssue[] {
  const issues: FlowIssue[] = [];
  const { nodes, edges, variables } = project;
  const nodeList = Object.values(nodes);

  const start = nodeList.find(n => n.type === 'start');
  if (!start) issues.push({ code: 'NO_START', severity: 'error' });

  // 1. Conexões corrompidas (origem/destino inexistentes ou saída que o nó não tem)
  const validEdges = Object.values(edges).filter(edge => {
    const source = nodes[edge.sourceNode];
    const target = nodes[edge.targetNode];
    const valid = !!source && !!target && target.type !== 'start'
      && edge.id === edgeId(edge.sourceNode, edge.sourceHandle)
      && getOutputHandles(source).includes(edge.sourceHandle);
    if (!valid) issues.push({ code: 'INVALID_EDGE', severity: 'error', edgeId: edge.id });
    return valid;
  });
  const connected = new Set(validEdges.map(e => e.id));

  // 2. Saídas sem destino
  for (const node of nodeList) {
    for (const handle of getOutputHandles(node)) {
      if (connected.has(edgeId(node.id, handle))) continue;
      issues.push(node.type === 'start'
        ? { code: 'START_NOT_CONNECTED', severity: 'error', nodeId: node.id }
        : { code: 'UNCONNECTED_OUTPUT', severity: 'warning', nodeId: node.id, handle });
    }
  }

  // 3. Nós que nunca são alcançados a partir do Início
  if (start) {
    const reached = new Set([start.id]);
    const queue = [start.id];
    while (queue.length) {
      const current = queue.shift()!;
      for (const edge of validEdges) {
        if (edge.sourceNode === current && !reached.has(edge.targetNode)) {
          reached.add(edge.targetNode);
          queue.push(edge.targetNode);
        }
      }
    }
    for (const node of nodeList) {
      if (!reached.has(node.id)) issues.push({ code: 'UNREACHABLE_NODE', severity: 'warning', nodeId: node.id });
    }
  }

  // 4. Variáveis
  for (const node of nodeList) issues.push(...validateNodeVariables(node, variables));

  return issues;
}

function validateNodeVariables(node: ChatNode, variables: ChatbotProject['variables']): FlowIssue[] {
  const issues: FlowIssue[] = [];
  const reported = new Set<string>();

  const exists = (variableId: string) => {
    if (variables[variableId]) return true;
    if (!reported.has(variableId)) {
      reported.add(variableId);
      issues.push({ code: 'MISSING_VARIABLE', severity: 'error', nodeId: node.id, variableId });
    }
    return false;
  };
  const checkNumber = (variableId: string) => {
    if (exists(variableId) && variables[variableId]!.type !== 'number') {
      issues.push({ code: 'VARIABLE_NOT_NUMBER', severity: 'error', nodeId: node.id, variableId });
    }
  };
  const checkValue = (value: Value, mustBeNumber = false) => {
    if (value.kind !== 'variable') return;
    if (mustBeNumber) checkNumber(value.variableId);
    else exists(value.variableId);
  };

  if ('content' in node.data) collectVariableIds(node.data.content).forEach(exists);

  switch (node.type) {
    case 'open_question':
      if (node.data.variableId) exists(node.data.variableId);
      break;
    case 'set_variable':
      if (!node.data.variableId) issues.push({ code: 'VARIABLE_NOT_SELECTED', severity: 'error', nodeId: node.id });
      else exists(node.data.variableId);
      checkValue(node.data.value);
      break;
    case 'math':
      if (!node.data.variableId) issues.push({ code: 'VARIABLE_NOT_SELECTED', severity: 'error', nodeId: node.id });
      else checkNumber(node.data.variableId);
      checkValue(node.data.operand, true);
      break;
    case 'condition':
      for (const rule of node.data.rules) {
        for (const condition of rule.conditions) {
          if (!condition.variableId) {
            issues.push({ code: 'VARIABLE_NOT_SELECTED', severity: 'error', nodeId: node.id, conditionId: condition.id });
          } else {
            exists(condition.variableId);
          }
          checkValue(condition.value);
        }
      }
      break;
  }
  return issues;
}
