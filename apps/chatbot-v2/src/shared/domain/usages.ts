import type { ChatbotProject, ChatNode, RichText, Value } from '../types/chatbot';
import { collectAssetIds, collectVariableIds } from './richText';

const valueVariableId = (value: Value): string | null => (value.kind === 'variable' ? value.variableId : null);

function nodeContent(node: ChatNode): RichText | undefined {
  return 'content' in node.data ? node.data.content : undefined;
}

/** Todas as variáveis que um nó referencia (texto, seletores e valores). */
export function getNodeVariableIds(node: ChatNode): string[] {
  const ids = new Set<string>(collectVariableIds(nodeContent(node)));
  const add = (id: string | null) => { if (id) ids.add(id); };

  switch (node.type) {
    case 'open_question':
      add(node.data.variableId);
      break;
    case 'set_variable':
      add(node.data.variableId);
      add(valueVariableId(node.data.value));
      break;
    case 'math':
      add(node.data.variableId);
      add(valueVariableId(node.data.operand));
      break;
    case 'condition':
      for (const rule of node.data.rules) {
        for (const condition of rule.conditions) {
          add(condition.variableId);
          add(valueVariableId(condition.value));
        }
      }
      break;
  }
  return [...ids];
}

/** IDs dos nós que usam a variável (para avisar antes de excluir). */
export function findVariableUsages(project: ChatbotProject, variableId: string): string[] {
  return Object.values(project.nodes)
    .filter(node => getNodeVariableIds(node).includes(variableId))
    .map(node => node.id);
}

/** IDs dos nós que exibem o asset (alimenta o `isAssetUsed` do assetStore). */
export function findAssetUsages(project: ChatbotProject, assetId: string): string[] {
  return Object.values(project.nodes)
    .filter(node => collectAssetIds(nodeContent(node)).includes(assetId))
    .map(node => node.id);
}
