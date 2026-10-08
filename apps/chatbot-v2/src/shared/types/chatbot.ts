import type { JSONContent } from '@tiptap/core';
import type { ClicAsset, ClicBaseProject } from '@clic/shared';

/**
 * MODELO DE DADOS DO CHATBOT v2
 *
 * Este é o formato do JSON do projeto (fonte da verdade, regra 1 do CLAUDE.md).
 * Tudo aqui precisa ser portável e serializável: nada de URLs de infraestrutura,
 * tokens ou IDs de banco. Referências entre entidades são sempre por ID.
 */

export const PROJECT_VERSION = '2.0.0';

// --- TEXTO RICO ---

/**
 * Documento do Tiptap (ProseMirror JSON). Nós customizados:
 * - clicVariable: { variableId }  → referência a uma variável (resolvida no runtime)
 * - clicEmoji:    { emoji }       → emoji como nó atômico
 * Imagens e outras mídias não entram no texto: ficam em `data.media` do nó.
 */
export type RichText = JSONContent;

// --- VARIÁVEIS E VALORES ---

export type VariableType = 'text' | 'number';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: string | number;
}

/** Valor usado em comparações e atribuições: fixo ou lido de uma variável. */
export type Value =
  | { kind: 'literal'; value: string | number }
  | { kind: 'variable'; variableId: string };

/** Uma das opções é sorteada a cada passagem pelo bloco (opções vazias são ignoradas). */
export type RandomValue = { kind: 'random'; options: string[] };

/** Valor atribuído pelo bloco "Definir variável": além de `Value`, aceita sorteio. */
export type AssignmentValue = Value | RandomValue;

export type ComparisonOperator = '==' | '!=' | '>' | '<' | '>=' | '<=';
export type MathOperator = '+' | '-' | '*' | '/';

// --- ESTRUTURAS INTERNAS DOS NÓS ---

// --- MÍDIA ---

/** Origem de um arquivo: enviado pelo aluno (asset do projeto) ou link externo. */
export type MediaSource =
  | { kind: 'upload'; assetId: string }
  | { kind: 'url'; url: string };

/**
 * Mídia exibida junto ao texto de um nó. Novos tipos entram como novos casos deste
 * union, sem mudar o formato do JSON. Hoje o editor cria apenas 'image' (inclui GIF);
 * 'video' (link do YouTube/Vimeo) e 'audio' estão reservados para o futuro.
 */
export type Media =
  | { type: 'image'; source: MediaSource }
  | { type: 'video'; url: string }
  | { type: 'audio'; source: MediaSource };

export interface NodeMedia {
  media: Media;
  position: 'before' | 'after'; // Antes ou depois do texto
}

/** Emoji ou imagem exibidos no botão da opção (com ou sem rótulo). */
export type ChoiceMedia =
  | { kind: 'emoji'; emoji: string }
  | { kind: 'image'; source: MediaSource };

export interface Choice {
  id: string; // Também é o ID da saída (handle) da opção
  label: string; // Pode ficar vazio quando há mídia
  media: ChoiceMedia | null;
}

/** Limites da espera após uma mensagem (segundos). */
export const MESSAGE_DELAY_MAX = 10;

export interface Condition {
  id: string;
  variableId: string | null;
  operator: ComparisonOperator;
  value: Value;
}

export interface Rule {
  id: string; // Também é o ID da saída (handle) da regra
  match: 'all' | 'any'; // 'all' = todas as condições (E) | 'any' = qualquer uma (OU)
  conditions: Condition[];
}

// --- NÓS ---

export interface NodeDataMap {
  start: Record<string, never>;
  message: { content: RichText; media: NodeMedia | null; delay: number }; // delay: segundos antes do próximo nó
  open_question: { content: RichText; media: NodeMedia | null; variableId: string | null };
  choice_question: { content: RichText; media: NodeMedia | null; choices: Choice[] };
  condition: { rules: Rule[] };
  set_variable: { variableId: string | null; value: AssignmentValue };
  math: { variableId: string | null; operator: MathOperator; operand: Value };
  end: { content: RichText; media: NodeMedia | null };
}

export type NodeType = keyof NodeDataMap;

export interface Position {
  x: number;
  y: number;
}

/** Distributivo: `ChatNodeOf<'a' | 'b'>` vira `ChatNodeOf<'a'> | ChatNodeOf<'b'>`. */
export type ChatNodeOf<T extends NodeType> = T extends NodeType
  ? { id: string; type: T; position: Position; data: NodeDataMap[T] }
  : never;

/** Union discriminado: `node.type` estreita o tipo de `node.data`. */
export type ChatNode = ChatNodeOf<NodeType>;

// --- CONEXÕES ---

/** Saída padrão dos nós com um único caminho. */
export const HANDLE_OUT = 'out';
/** Saída "caso contrário" do nó de condição. */
export const HANDLE_ELSE = 'else';

/**
 * Cada saída tem no máximo uma conexão: o ID é derivado da saída
 * (`${sourceNode}:${sourceHandle}`), então reconectar substitui a anterior.
 * Todo nó tem uma única entrada, por isso não há `targetHandle`.
 */
export interface ChatEdge {
  id: string;
  sourceNode: string;
  sourceHandle: string;
  targetNode: string;
  color?: string;
}

// --- PROJETO ---

export interface ChatbotProject extends ClicBaseProject {
  title: string;
  nodes: Record<string, ChatNode>;
  edges: Record<string, ChatEdge>;
  variables: Record<string, Variable>;
  assets: Record<string, ClicAsset>;
}
