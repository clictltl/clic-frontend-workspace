import { Node, mergeAttributes, type Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { RICH_TEXT_NODES } from '../domain/richText';

export interface RichTextOptions {
  /** Resolve o nome atual da variável (o documento guarda só o ID). */
  variableName: (variableId: string) => string | undefined;
}

/**
 * Schema do texto rico, compartilhado por editor, visualização e runtime.
 * Qualquer nó novo precisa ser adicionado aqui e em `RICH_TEXT_NODES`.
 */
export function createRichTextExtensions(options: RichTextOptions): Extensions {
  const ClicVariable = Node.create({
    name: RICH_TEXT_NODES.variable,
    group: 'inline',
    inline: true,
    atom: true,
    addAttributes() {
      return {
        variableId: {
          default: null,
          parseHTML: el => el.getAttribute('data-variable-id'),
          renderHTML: attrs => ({ 'data-variable-id': attrs.variableId })
        }
      };
    },
    parseHTML() {
      return [{ tag: 'span[data-variable-id]' }];
    },
    renderHTML({ node, HTMLAttributes }) {
      const name = options.variableName(node.attrs.variableId);
      const className = name ? 'clic-variable' : 'clic-variable is-missing';
      return ['span', mergeAttributes(HTMLAttributes, { class: className }), `{ ${name ?? '?'} }`];
    },
    renderText({ node }) {
      return `{${options.variableName(node.attrs.variableId) ?? '?'}}`;
    }
  });

  const ClicEmoji = Node.create({
    name: RICH_TEXT_NODES.emoji,
    group: 'inline',
    inline: true,
    atom: true,
    addAttributes() {
      return {
        emoji: {
          default: '',
          parseHTML: el => el.getAttribute('data-emoji'),
          renderHTML: attrs => ({ 'data-emoji': attrs.emoji })
        }
      };
    },
    parseHTML() {
      return [{ tag: 'span[data-emoji]' }];
    },
    renderHTML({ node, HTMLAttributes }) {
      return ['span', mergeAttributes(HTMLAttributes, { class: 'clic-emoji' }), node.attrs.emoji];
    },
    renderText({ node }) {
      return node.attrs.emoji;
    }
  });

  return [
    // O Tiptap 3 já inclui Link no StarterKit; usamos o nosso configurado abaixo
    StarterKit.configure({ link: false, heading: { levels: [3] } }),
    ClicEmoji,
    ClicVariable,
    Link.configure({ openOnClick: false })
  ];
}
