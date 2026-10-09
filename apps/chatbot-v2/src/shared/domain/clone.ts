import type { AssignmentValue, ChatbotProject, ChatNode, ChoiceMedia, NodeMedia, Position, RichText, Value } from '../types/chatbot';
import type { DomainDeps } from './deps';
import { RICH_TEXT_NODES } from './richText';
import { choiceMediaAssetId, nodeMediaAssetId } from './media';
import { fillNodeDefaults } from './project';

/**
 * CÓPIA DE BLOCOS (duplicar, copiar e colar)
 *
 * A cópia ganha IDs novos para o nó e para tudo que também é ID de saída (opções,
 * regras) ou de item interno (condições): senão as conexões se confundiriam.
 * Conexões não vêm junto (cada saída tem uma só conexão).
 * O que não existe no projeto de destino é removido: variáveis voltam para "nenhuma"
 * e imagens enviadas somem; links (URL) continuam. No mesmo projeto, nada é removido.
 */
export function cloneNode(source: ChatNode, target: ChatbotProject, position: Position, deps: DomainDeps): ChatNode | null {
  if (source.type === 'start') return null;
  const node = JSON.parse(JSON.stringify(source)) as ChatNode;
  node.id = deps.newId();
  node.position = { ...position };
  fillNodeDefaults(node);

  const hasVariable = (id: string | null | undefined): id is string => !!id && !!target.variables[id];
  const keepVariable = (id: string | null) => (hasVariable(id) ? id : null);
  const keepValue = <T extends AssignmentValue>(value: T, fallback: Value): T | Value =>
    value.kind === 'variable' && !hasVariable(value.variableId) ? fallback : value;
  const keepNodeMedia = (media: NodeMedia | null) => {
    const assetId = nodeMediaAssetId(media);
    return assetId && !target.assets[assetId] ? null : media;
  };
  const keepChoiceMedia = (media: ChoiceMedia | null) => {
    const assetId = choiceMediaAssetId(media);
    return assetId && !target.assets[assetId] ? null : media;
  };

  if ('content' in node.data) {
    node.data.content = withoutMissingVariables(node.data.content, hasVariable);
    node.data.media = keepNodeMedia(node.data.media);
  }

  switch (node.type) {
    case 'open_question':
      node.data.variableId = keepVariable(node.data.variableId);
      break;
    case 'choice_question':
      for (const choice of node.data.choices) {
        choice.id = deps.newId();
        choice.media = keepChoiceMedia(choice.media);
      }
      break;
    case 'condition':
      for (const rule of node.data.rules) {
        rule.id = deps.newId();
        for (const condition of rule.conditions) {
          condition.id = deps.newId();
          condition.variableId = keepVariable(condition.variableId);
          condition.value = keepValue(condition.value, { kind: 'literal', value: '' }) as Value;
        }
      }
      break;
    case 'set_variable':
      node.data.variableId = keepVariable(node.data.variableId);
      node.data.value = keepValue(node.data.value, { kind: 'literal', value: '' });
      break;
    case 'math':
      node.data.variableId = keepVariable(node.data.variableId);
      node.data.operand = keepValue(node.data.operand, { kind: 'literal', value: 0 }) as Value;
      break;
  }
  return node;
}

/** Remove do texto as pílulas de variáveis que não existem no projeto. */
function withoutMissingVariables(doc: RichText, exists: (id: string) => boolean): RichText {
  const visit = (node: RichText): RichText | null => {
    if (node.type === RICH_TEXT_NODES.variable && !exists(node.attrs?.variableId)) return null;
    if (!node.content) return node;
    const content = node.content.map(visit).filter((n): n is RichText => !!n);
    // Parágrafo que ficou vazio fica sem `content`, como os vazios criados pelo editor
    if (content.length) return { ...node, content };
    const { content: _removed, ...rest } = node;
    return rest;
  };
  return visit(doc) ?? doc;
}
