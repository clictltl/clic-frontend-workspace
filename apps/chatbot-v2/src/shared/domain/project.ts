import {
  PROJECT_VERSION,
  HANDLE_OUT,
  type ChatbotProject,
  type ChatNode,
  type ChatNodeOf,
  type Choice,
  type Condition,
  type NodeType,
  type Position,
  type Rule,
} from '../types/chatbot';
import type { DomainDeps } from './deps';
import { createRichText } from './richText';
import { edgeId } from './graph';

// --- FÁBRICAS ---

export function createCondition(deps: DomainDeps): Condition {
  return { id: deps.newId(), variableId: null, operator: '==', value: { kind: 'literal', value: '' } };
}

export function createRule(deps: DomainDeps): Rule {
  return { id: deps.newId(), match: 'all', conditions: [createCondition(deps)] };
}

export function createChoice(deps: DomainDeps, n: number): Choice {
  return { id: deps.newId(), label: deps.t('chatbot.properties.default_choice', { n }), media: null };
}

/** Cria um nó com o conteúdo padrão do tipo (textos vêm do i18n no idioma atual). */
export function createNode<T extends NodeType>(type: T, position: Position, deps: DomainDeps): ChatNodeOf<T> {
  const { t, newId } = deps;
  const id = newId();
  const node = ((): ChatNode => {
    switch (type) {
      case 'start':
        return { id, type, position, data: {} };
      case 'message':
        return { id, type, position, data: { content: createRichText(t('chatbot.blocks.default_content.message')), media: null, delay: 0 } };
      case 'open_question':
        return { id, type, position, data: { content: createRichText(t('chatbot.blocks.default_content.openQuestion')), media: null, variableId: null } };
      case 'choice_question':
        return {
          id, type, position,
          data: {
            content: createRichText(t('chatbot.blocks.default_content.choiceQuestion')),
            media: null,
            choices: [createChoice(deps, 1)]
          }
        };
      case 'condition':
        return { id, type, position, data: { rules: [createRule(deps)] } };
      case 'set_variable':
        return { id, type, position, data: { variableId: null, value: { kind: 'literal', value: '' } } };
      case 'math':
        return { id, type, position, data: { variableId: null, operator: '+', operand: { kind: 'literal', value: 1 } } };
      case 'end':
        return { id, type, position, data: { content: createRichText(t('chatbot.blocks.default_content.end')), media: null } };
      default:
        throw new Error(`Unknown node type: ${type satisfies never}`);
    }
  })();
  return node as ChatNodeOf<T>;
}

/** Projeto novo: Início ligado a uma primeira mensagem. */
export function createProject(deps: DomainDeps, now: string): ChatbotProject {
  const start = createNode('start', { x: 250, y: 150 }, deps);
  const message = createNode('message', { x: 250, y: 300 }, deps);
  const id = edgeId(start.id, HANDLE_OUT);

  return {
    uuid: deps.newId(),
    title: '',
    meta: { version: PROJECT_VERSION, createdAt: now, updatedAt: now },
    nodes: { [start.id]: start, [message.id]: message },
    edges: { [id]: { id, sourceNode: start.id, sourceHandle: HANDLE_OUT, targetNode: message.id } },
    variables: {},
    assets: {}
  };
}

// --- LEITURA DE JSON EXTERNO ---

export type ParseProjectResult =
  | { ok: true; project: ChatbotProject }
  | { ok: false; error: 'INVALID_PROJECT' | 'UNSUPPORTED_VERSION' };

const isObject = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** O PHP serializa objetos vazios como `[]`: normaliza para `{}`. */
const asRecord = (v: unknown): Record<string, any> => (isObject(v) ? v : {});

/**
 * Valida e normaliza um JSON vindo do banco, de um arquivo importado ou de um link.
 * Não altera o objeto recebido. Projetos do v1 (ou de versões futuras) são recusados.
 */
export function parseProject(json: unknown, deps: DomainDeps, now: string): ParseProjectResult {
  if (!isObject(json)) return { ok: false, error: 'INVALID_PROJECT' };

  const version = json.meta?.version;
  if (typeof version !== 'string' || version.split('.')[0] !== PROJECT_VERSION.split('.')[0]) {
    return { ok: false, error: 'UNSUPPORTED_VERSION' };
  }

  const data = JSON.parse(JSON.stringify(json));
  const project: ChatbotProject = {
    ...data,
    uuid: typeof data.uuid === 'string' && data.uuid ? data.uuid : deps.newId(),
    title: typeof data.title === 'string' ? data.title : '',
    meta: { createdAt: now, updatedAt: now, ...data.meta },
    nodes: asRecord(data.nodes),
    edges: asRecord(data.edges),
    variables: asRecord(data.variables),
    assets: asRecord(data.assets)
  };

  // Campos adicionados ao longo da versão 2.x recebem o valor padrão
  for (const node of Object.values(project.nodes)) {
    if ('content' in node.data) node.data.media ??= null;
    if (node.type === 'message' && typeof node.data.delay !== 'number') node.data.delay = 0;
    if (node.type === 'choice_question') {
      for (const choice of node.data.choices) choice.media ??= null;
    }
  }

  // Todo fluxo precisa de um Início: recria se o JSON veio corrompido
  if (!Object.values(project.nodes).some(n => n.type === 'start')) {
    const start = createNode('start', { x: 250, y: 150 }, deps);
    project.nodes[start.id] = start;
  }

  return { ok: true, project };
}
