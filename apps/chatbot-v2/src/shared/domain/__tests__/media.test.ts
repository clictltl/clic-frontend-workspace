import { describe, it, expect } from 'vitest';
import { isSafeMediaUrl, isValidMedia, normalizeWebUrl } from '../media';
import { setChoiceMedia, setMediaPosition, setNodeMedia } from '../graph';
import type { Media } from '../../types/chatbot';
import { setup } from './helpers';

const image = (url: string): Media => ({ type: 'image', source: { kind: 'url', url } });

describe('media links', () => {
  it('accepts only http(s) links', () => {
    expect(isSafeMediaUrl('https://example.com/cat.gif')).toBe(true);
    expect(isSafeMediaUrl(' http://example.com/a.png ')).toBe(true);
    expect(isSafeMediaUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeMediaUrl('data:image/png;base64,AAAA')).toBe(false);
    expect(isSafeMediaUrl('not a url')).toBe(false);
  });

  it('completes typed addresses and refuses unsafe or incomplete ones', () => {
    expect(normalizeWebUrl(' www.site.com.br ')).toBe('https://www.site.com.br');
    expect(normalizeWebUrl('site.com/pagina?x=1')).toBe('https://site.com/pagina?x=1');
    expect(normalizeWebUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeWebUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeWebUrl('mailto:a@b.com')).toBeNull();
    expect(normalizeWebUrl('oi')).toBeNull();
    expect(normalizeWebUrl('   ')).toBeNull();
  });

  it('validates uploads and future media types', () => {
    expect(isValidMedia({ type: 'image', source: { kind: 'upload', assetId: 'a1' } })).toBe(true);
    expect(isValidMedia({ type: 'image', source: { kind: 'upload', assetId: '' } })).toBe(false);
    expect(isValidMedia({ type: 'video', url: 'https://youtu.be/abc' })).toBe(true);
    expect(isValidMedia({ type: 'audio', source: { kind: 'url', url: 'ftp://x' } })).toBe(false);
  });
});

describe('node media', () => {
  it('sets media before the text and keeps the position when replacing', () => {
    const { project, message } = setup();
    const data = message.data as { media: unknown };

    expect(setNodeMedia(project, message.id, image('https://a.com/1.png'))).toBe(true);
    expect(data.media).toEqual({ media: image('https://a.com/1.png'), position: 'before' });

    setMediaPosition(project, message.id, 'after');
    setNodeMedia(project, message.id, image('https://a.com/2.png'));
    expect(data.media).toEqual({ media: image('https://a.com/2.png'), position: 'after' });

    setNodeMedia(project, message.id, null);
    expect(data.media).toBeNull();
  });

  it('refuses unsafe links and nodes without text', () => {
    const { project, message, start } = setup();
    expect(setNodeMedia(project, message.id, image('javascript:alert(1)'))).toBe(false);
    expect((message.data as { media: unknown }).media).toBeNull();
    expect(setNodeMedia(project, start.id, image('https://a.com/1.png'))).toBe(false);
    expect(setMediaPosition(project, message.id, 'after')).toBe(false); // sem mídia
  });

  it('refuses unsafe links in choice images', () => {
    const { project, add } = setup();
    const node = add('choice_question');
    const choiceId = node.data.choices[0]!.id;
    expect(setChoiceMedia(project, node.id, choiceId, { kind: 'image', source: { kind: 'url', url: 'javascript:x' } })).toBe(false);
    expect(setChoiceMedia(project, node.id, choiceId, { kind: 'image', source: { kind: 'url', url: 'https://a.com/b.png' } })).toBe(true);
  });
});
