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
 * - clicImage:    { assetId }     → imagem do projeto (URL resolvida pelo assetStore)
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

export type ComparisonOperator = '==' | '!=' | '>' | '<' | '>=' | '<=';
export type MathOperator = '+' | '-' | '*' | '/';

// --- ESTRUTURAS INTERNAS DOS NÓS ---

export interface Choice {
  id: string; // Também é o ID da saída (handle) da opção
  label: string;
}

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
  message: { content: RichText };
  open_question: { content: RichText; variableId: string | null };
  choice_question: { content: RichText; choices: Choice[] };
  condition: { rules: Rule[] };
  set_variable: { variableId: string | null; value: Value };
  math: { variableId: string | null; operator: MathOperator; operand: Value };
  end: { content: RichText };
}

export type NodeType = keyof NodeDataMap;

export interface Position {
  x: number;
  y: number;
}

export interface ChatNodeOf<T extends NodeType> {
  id: string;
  type: T;
  position: Position;
  data: NodeDataMap[T];
}

/** Union discriminado: `node.type` estreita o tipo de `node.data`. */
export type ChatNode = { [T in NodeType]: ChatNodeOf<T> }[NodeType];

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
