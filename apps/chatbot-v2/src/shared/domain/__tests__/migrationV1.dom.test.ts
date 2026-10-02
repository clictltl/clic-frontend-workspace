// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { generateJSON } from '@tiptap/core';
import { createRichTextExtensions } from '../../richText/extensions';
import { parseProject } from '../project';
import { createDeps, NOW } from './helpers';

/** Conversão real do HTML salvo pelo Tiptap do v1, usando o schema do v2. */
const extensions = createRichTextExtensions({ variableName: () => undefined });
const deps = () => ({ ...createDeps(), htmlToRichText: (html: string) => generateJSON(html, extensions) });

function migrateContent(html: string) {
  const result = parseProject({
    meta: { version: '1.0.0' },
    variables: { nome: { name: 'nome', type: 'string', value: '' } },
    blocks: [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, nextBlockId: 'm' },
      { id: 'm', type: 'message', position: { x: 0, y: 0 }, content: html }
    ]
  }, deps(), NOW);
  if (!result.ok) throw new Error(result.error);
  const node = result.project.nodes.m!;
  if (!('content' in node.data)) throw new Error('sem texto');
  const nomeId = Object.values(result.project.variables)[0]!.id;
  return { content: node.data.content, nomeId };
}

describe('v1 migration with the real Tiptap HTML parser', () => {
  it('keeps formatting, links, emojis and turns {{name}} into a pill', () => {
    const { content, nomeId } = migrateContent(
      '<p>Olá, <strong>{{nome}}</strong>! <span data-emoji="😀" class="clic-emoji">😀</span></p>' +
      '<ul><li><p>item</p></li></ul><p><a href="https://clic.tltlab.org">site</a></p>'
    );

    expect(content).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Olá, ' },
            { type: 'clicVariable', attrs: { variableId: nomeId } },
            { type: 'text', text: '! ' },
            { type: 'clicEmoji', attrs: { emoji: '😀' } }
          ]
        },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }] }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'site', marks: [expect.objectContaining({ type: 'link', attrs: expect.objectContaining({ href: 'https://clic.tltlab.org' }) })] }]
        }
      ]
    });
  });

  it('accepts plain text saved without HTML tags', () => {
    const { content } = migrateContent('Olá mundo');
    expect(content).toEqual({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Olá mundo' }] }] });
  });
});
