import { describe, it, expect } from 'vitest';
import { collectAssetIds, collectVariableIds, createRichText, isRichTextEmpty } from '../richText';

const doc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Olá ' },
        { type: 'clicVariable', attrs: { variableId: 'v1' } },
        { type: 'clicEmoji', attrs: { emoji: '👋' } },
        { type: 'clicVariable', attrs: { variableId: 'v1' } }
      ]
    },
    { type: 'paragraph', content: [{ type: 'clicImage', attrs: { assetId: 'a1' } }] }
  ]
};

describe('richText', () => {
  it('creates a paragraph doc without empty text nodes', () => {
    expect(createRichText('Oi')).toEqual({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Oi' }] }] });
    expect(createRichText()).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });

  it('collects unique variable and asset references', () => {
    expect(collectVariableIds(doc)).toEqual(['v1']);
    expect(collectAssetIds(doc)).toEqual(['a1']);
  });

  it('treats whitespace-only docs as empty and atoms as content', () => {
    expect(isRichTextEmpty(createRichText())).toBe(true);
    expect(isRichTextEmpty(createRichText('   '))).toBe(true);
    expect(isRichTextEmpty(undefined)).toBe(true);
    expect(isRichTextEmpty({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'clicEmoji', attrs: { emoji: '😀' } }] }] })).toBe(false);
  });

  it('survives a JSON round-trip with emojis intact', () => {
    const roundTrip = JSON.parse(JSON.stringify(doc));
    expect(roundTrip.content[0].content[2].attrs.emoji).toBe('👋');
  });
});
