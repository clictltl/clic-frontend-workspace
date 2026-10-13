import type { AssignmentValue, ChatbotProject, ChatNode, RichText } from '../types/chatbot';
import { collectVariableIds } from './richText';
import { choiceMediaAssetId, nodeMediaAssetId } from './media';

const valueVariableId = (value: AssignmentValue): string | null => (value.kind === 'variable' ? value.variableId : null);

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

/** Todos os arquivos enviados que um nó exibe (mídia do nó e das opções). */
export function getNodeAssetIds(node: ChatNode): string[] {
  const ids = new Set<string>();
  const add = (id: string | null) => { if (id) ids.add(id); };

  if ('media' in node.data) add(nodeMediaAssetId(node.data.media));
  if (node.type === 'choice_question') {
    for (const choice of node.data.choices) add(choiceMediaAssetId(choice.media));
  }
  return [...ids];
}

/** Elemento que representa o avatar em `findAssetUsages` (não é um nó). */
export const APPEARANCE_ELEMENT_ID = 'appearance';

/** Todos os arquivos enviados em uso no projeto: nós e avatar. */
function usedAssetIds(project: ChatbotProject): Set<string> {
  const ids = new Set(Object.values(project.nodes).flatMap(getNodeAssetIds));
  const avatarId = choiceMediaAssetId(project.appearance?.avatar ?? null);
  if (avatarId) ids.add(avatarId);
  return ids;
}

/**
 * Cópia do projeto sem assets que nada usa mais (para salvar/exportar).
 * O estado do editor não é alterado: o undo ainda pode trazer a mídia de volta.
 */
export function withoutUnusedAssets(project: ChatbotProject): ChatbotProject {
  const used = usedAssetIds(project);
  const copy: ChatbotProject = JSON.parse(JSON.stringify(project));
  for (const id of Object.keys(copy.assets)) {
    if (!used.has(id)) delete copy.assets[id];
  }
  return copy;
}

/** IDs dos nós (e `APPEARANCE_ELEMENT_ID`, se for o avatar) que exibem o asset. Alimenta o `isAssetUsed` do assetStore. */
export function findAssetUsages(project: ChatbotProject, assetId: string): string[] {
  const usages = Object.values(project.nodes)
    .filter(node => getNodeAssetIds(node).includes(assetId))
    .map(node => node.id);
  if (choiceMediaAssetId(project.appearance?.avatar ?? null) === assetId) usages.push(APPEARANCE_ELEMENT_ID);
  return usages;
}
