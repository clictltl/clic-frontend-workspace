import {
  HANDLE_OUT,
  PROJECT_VERSION,
  type ChatbotProject,
  type ChatNode,
  type ComparisonOperator,
  type MathOperator,
  type RichText,
  type Value,
  type Variable,
} from '../../types/chatbot';
import type { DomainDeps } from '../deps';
import { connect } from '../graph';
import { createRichText, RICH_TEXT_NODES } from '../richText';
import { createAppearance } from '../appearance';

/**
 * MIGRAÇÃO DO CHATBOT v1 → v2
 *
 * Converte o JSON salvo pelo editor v1 (`blocks[]` + `nextBlockId`) no modelo v2.
 * Mantém ids e posições dos blocos. Só textos que o v1 realmente exibia são convertidos.
 * Casos sem equivalente exato geram avisos para o aluno revisar.
 */

// --- FORMATO DO v1 (somente leitura, campos opcionais por segurança) ---

interface V1Choice { id: string; label?: string; nextBlockId?: string }
interface V1Condition { id: string; variableName?: string; operator?: ComparisonOperator; value?: string | number; nextBlockId?: string }

interface V1Block {
  id: string;
  type: string;
  position?: { x: number; y: number };
  content?: string;
  choices?: V1Choice[];
  variableName?: string;
  variableValue?: string;
  conditions?: V1Condition[];
  mathOperation?: MathOperator;
  mathValue?: string;
  imageUrl?: string;
  assetId?: string;
  nextBlockId?: string;
}

interface V1Variable { name?: string; type?: 'string' | 'number'; value?: string | number | null }

export type MigrationWarning = { code: 'MIXED_ASSIGNMENT' | 'MIXED_MATH_OPERAND'; nodeId: string };

export interface MigrationResult {
  project: ChatbotProject;
  from: string;
  warnings: MigrationWarning[];
}

/** Projeto do v1: sem versão ou versão 1.x, com a lista de blocos. */
export function isV1Project(json: Record<string, any>): boolean {
  const version = json.meta?.version;
  const isV1Version = version === undefined || (typeof version === 'string' && version.split('.')[0] === '1');
  return isV1Version && Array.isArray(json.blocks);
}

/** Mesma regra de interpolação do v1 (`interpolateText`): nomes com letras, números e _. */
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;
const ONLY_VARIABLE = /^\s*\{\{(\w+)\}\}\s*$/;

export function migrateV1(json: Record<string, any>, deps: DomainDeps, now: string): MigrationResult {
  const warnings: MigrationWarning[] = [];
  const blocks: V1Block[] = Array.isArray(json.blocks) ? json.blocks.filter((b: any) => b && typeof b.id === 'string') : [];

  // --- VARIÁVEIS: o v1 indexa por nome; o v2 por id ---
  const variables: Record<string, Variable> = {};
  const idByName = new Map<string, string>();
  const v1Variables: Record<string, V1Variable> = json.variables && typeof json.variables === 'object' ? json.variables : {};

  for (const [key, v1] of Object.entries(v1Variables)) {
    const name = v1?.name || key;
    const type = v1?.type === 'number' ? 'number' : 'text';
    const id = deps.newId();
    const value = v1?.value ?? '';
    variables[id] = { id, name, type, defaultValue: type === 'number' ? (Number(value) || 0) : String(value) };
    idByName.set(key, id);
    idByName.set(name, id);
  }
  const variableId = (name?: string) => (name ? idByName.get(name.trim()) ?? null : null);

  // --- TEXTO: HTML do Tiptap v1 → JSON v2, com {{nome}} virando pílula de variável ---
  const toRichText = (html?: string): RichText => {
    if (!html?.trim()) return createRichText();
    const doc = deps.htmlToRichText ? deps.htmlToRichText(html) : createRichText(html.replace(/<[^>]*>/g, ''));
    return replaceVariableMarkers(doc, variableId);
  };

  // --- VALORES: "{{x}}" vira variável; texto misto não tem equivalente ---
  const toAssignmentValue = (raw: string | undefined, nodeId: string): Value => {
    const text = raw ?? '';
    const only = ONLY_VARIABLE.exec(text);
    const onlyId = only ? variableId(only[1]) : null;
    if (onlyId) return { kind: 'variable', variableId: onlyId };
    if (new RegExp(VARIABLE_PATTERN.source).test(text)) warnings.push({ code: 'MIXED_ASSIGNMENT', nodeId });
    return { kind: 'literal', value: text };
  };

  const toMathOperand = (raw: string | undefined, nodeId: string): Value => {
    const text = (raw ?? '').trim();
    const only = ONLY_VARIABLE.exec(text);
    const onlyId = only ? variableId(only[1]) : null;
    if (onlyId) return { kind: 'variable', variableId: onlyId };
    if (new RegExp(VARIABLE_PATTERN.source).test(text)) warnings.push({ code: 'MIXED_MATH_OPERAND', nodeId });
    return { kind: 'literal', value: Number(text) || 0 }; // No v1, valor inválido virava 0
  };

  // --- NÓS ---
  const nodes: Record<string, ChatNode> = {};
  for (const block of blocks) {
    const node = migrateBlock(block, { toRichText, toAssignmentValue, toMathOperand, variableId, newId: deps.newId });
    if (node) nodes[node.id] = node;
  }

  const project: ChatbotProject = {
    uuid: typeof json.uuid === 'string' && json.uuid ? json.uuid : deps.newId(),
    title: typeof json.title === 'string' ? json.title : '',
    appearance: createAppearance(), // O v1 não tinha aparência
    meta: {
      ...(json.meta && typeof json.meta === 'object' ? json.meta : {}),
      createdAt: json.meta?.createdAt ?? now,
      updatedAt: now,
      version: PROJECT_VERSION,
      migratedFrom: json.meta?.version ?? '1.0.0'
    },
    nodes,
    edges: {},
    variables,
    assets: json.assets && typeof json.assets === 'object' && !Array.isArray(json.assets) ? json.assets : {}
  };

  // --- CONEXÕES: o runtime do v1 seguia o nextBlockId (fonte da verdade) ---
  for (const block of blocks) {
    if (!nodes[block.id]) continue;
    if (block.type === 'choiceQuestion') {
      for (const choice of block.choices ?? []) {
        if (choice.nextBlockId) connect(project, block.id, choice.id, choice.nextBlockId);
      }
    } else if (block.type === 'condition') {
      for (const condition of block.conditions ?? []) {
        if (condition.nextBlockId) connect(project, block.id, condition.id, condition.nextBlockId);
      }
    } else if (block.nextBlockId) {
      connect(project, block.id, HANDLE_OUT, block.nextBlockId); // Destino inexistente é ignorado
    }
  }

  return { project, from: String(json.meta?.version ?? '1.0.0'), warnings };
}

// --- BLOCOS ---

interface BlockHelpers {
  toRichText: (html?: string) => RichText;
  toAssignmentValue: (raw: string | undefined, nodeId: string) => Value;
  toMathOperand: (raw: string | undefined, nodeId: string) => Value;
  variableId: (name?: string) => string | null;
  newId: () => string;
}

function migrateBlock(block: V1Block, h: BlockHelpers): ChatNode | null {
  const { id } = block;
  const position = { x: Number(block.position?.x) || 0, y: Number(block.position?.y) || 0 };

  switch (block.type) {
    case 'start':
      return { id, type: 'start', position, data: {} };

    case 'message':
      return { id, type: 'message', position, data: { content: h.toRichText(block.content), media: null, delay: 0 } };

    case 'openQuestion':
      return { id, type: 'open_question', position, data: { content: h.toRichText(block.content), media: null, variableId: h.variableId(block.variableName) } };

    case 'choiceQuestion':
      return {
        id, type: 'choice_question', position,
        data: {
          content: h.toRichText(block.content),
          media: null,
          choices: (block.choices ?? []).map(c => ({ id: c.id, label: c.label ?? '', media: null }))
        }
      };

    case 'condition': {
      // No v1 cada condição era uma rota (vale a primeira verdadeira): cada uma vira uma regra
      const rules = (block.conditions ?? []).map(c => ({
        id: c.id,
        match: 'all' as const,
        conditions: [{ id: h.newId(), variableId: h.variableId(c.variableName), operator: c.operator ?? '==', value: { kind: 'literal' as const, value: c.value ?? '' } }]
      }));
      if (rules.length === 0) {
        rules.push({ id: h.newId(), match: 'all', conditions: [{ id: h.newId(), variableId: null, operator: '==', value: { kind: 'literal', value: '' } }] });
      }
      return { id, type: 'condition', position, data: { rules } };
    }

    case 'setVariable':
      return { id, type: 'set_variable', position, data: { variableId: h.variableId(block.variableName), value: h.toAssignmentValue(block.variableValue, id) } };

    case 'math':
      return {
        id, type: 'math', position,
        data: { variableId: h.variableId(block.variableName), operator: block.mathOperation ?? '+', operand: h.toMathOperand(block.mathValue, id) }
      };

    case 'image': {
      // O v2 não tem bloco de imagem: vira uma mensagem só com a mídia
      const source = block.assetId
        ? { kind: 'upload' as const, assetId: block.assetId }
        : block.imageUrl ? { kind: 'url' as const, url: block.imageUrl } : null;
      return {
        id, type: 'message', position,
        data: { content: createRichText(), media: source ? { media: { type: 'image', source }, position: 'before' } : null, delay: 0 }
      };
    }

    case 'end':
      return { id, type: 'end', position, data: { content: h.toRichText(block.content), media: null } };

    default:
      return null;
  }
}

/** Troca `{{nome}}` dentro dos textos por pílulas `clicVariable`. Nomes desconhecidos ficam como texto. */
function replaceVariableMarkers(doc: RichText, variableId: (name: string) => string | null): RichText {
  const visit = (node: RichText): RichText[] => {
    if (node.type === 'text' && typeof node.text === 'string') {
      const parts: RichText[] = [];
      let last = 0;
      for (const match of node.text.matchAll(VARIABLE_PATTERN)) {
        const id = variableId(match[1]!);
        if (!id) continue;
        const start = match.index ?? 0;
        if (start > last) parts.push({ ...node, text: node.text.slice(last, start) });
        parts.push({ type: RICH_TEXT_NODES.variable, attrs: { variableId: id } });
        last = start + match[0].length;
      }
      if (parts.length === 0) return [node];
      if (last < node.text.length) parts.push({ ...node, text: node.text.slice(last) });
      return parts;
    }
    return [node.content ? { ...node, content: node.content.flatMap(visit) } : node];
  };
  return visit(doc)[0] ?? createRichText();
}
