import type { RichText } from '../types/chatbot';

/** Nomes dos nós customizados do Tiptap (devem bater com as extensões do editor). */
export const RICH_TEXT_NODES = {
  variable: 'clicVariable',
  emoji: 'clicEmoji',
  image: 'clicImage',
} as const;

/** Cria um documento com um único parágrafo de texto simples. */
export function createRichText(text = ''): RichText {
  return {
    type: 'doc',
    content: [
      // O ProseMirror não aceita nós de texto vazios: parágrafo vazio fica sem content
      text ? { type: 'paragraph', content: [{ type: 'text', text }] } : { type: 'paragraph' }
    ]
  };
}

/** Percorre todos os nós do documento em profundidade. */
export function walkRichText(doc: RichText | undefined, visit: (node: RichText) => void) {
  if (!doc) return;
  visit(doc);
  doc.content?.forEach(child => walkRichText(child, visit));
}

function collectAttr(doc: RichText | undefined, nodeType: string, attr: string): string[] {
  const ids = new Set<string>();
  walkRichText(doc, node => {
    const value = node.type === nodeType ? node.attrs?.[attr] : undefined;
    if (typeof value === 'string' && value) ids.add(value);
  });
  return [...ids];
}

export function collectVariableIds(doc: RichText | undefined): string[] {
  return collectAttr(doc, RICH_TEXT_NODES.variable, 'variableId');
}

export function collectAssetIds(doc: RichText | undefined): string[] {
  return collectAttr(doc, RICH_TEXT_NODES.image, 'assetId');
}

/** Vazio = sem texto visível e sem nós atômicos (variável, emoji, imagem). */
export function isRichTextEmpty(doc: RichText | undefined): boolean {
  const atoms: string[] = Object.values(RICH_TEXT_NODES);
  let empty = true;
  walkRichText(doc, node => {
    if (!empty) return;
    if (node.type === 'text' && node.text?.trim()) empty = false;
    else if (node.type && atoms.includes(node.type)) empty = false;
  });
  return empty;
}
