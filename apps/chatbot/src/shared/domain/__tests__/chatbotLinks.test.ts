import { describe, it, expect } from 'vitest';
import { HANDLE_OUT, type ChatNodeOf, type ChoiceMedia } from '../../types/chatbot';
import { tokenFromPublishedLink, publishedLinkUrl } from '../publishedLink';
import { addChoice, getOutputHandles, removeChoice, renameChoice, setChoiceLink, setChoiceMedia } from '../graph';
import { cloneNode } from '../clone';
import { getNodeAssetIds } from '../usages';
import { parseProject } from '../project';
import { validateFlow } from '../validate';
import { NOW, setup } from './helpers';

describe('published chatbot links', () => {
  it('extracts the token from a full link, a link without domain, or the token alone', () => {
    expect(tokenFromPublishedLink('https://clic.tltlab.org/app/novelo/p/6ffece9d8e96')).toBe('6ffece9d8e96');
    expect(tokenFromPublishedLink('  http://localhost/meu-site/app/novelo/p/6ffece9d8e96/?x=1#y ')).toBe('6ffece9d8e96');
    expect(tokenFromPublishedLink('/app/novelo/p/abc123')).toBe('abc123');
    expect(tokenFromPublishedLink('abc123')).toBe('abc123');
  });

  it('rejects anything that is not a published link (e.g. a share link)', () => {
    expect(tokenFromPublishedLink('')).toBeNull();
    expect(tokenFromPublishedLink('http://localhost/meu-site/app/novelo/editor?share=b4e8c4096e54')).toBeNull();
    expect(tokenFromPublishedLink('https://site.com/uma pagina')).toBeNull();
    expect(tokenFromPublishedLink('https://clic.tltlab.org/app/novelo/p/')).toBeNull();
  });

  it('builds the link on the current site from the token', () => {
    expect(publishedLinkUrl('abc123', 'http://localhost/meu-site/app/novelo/')).toBe('http://localhost/meu-site/app/novelo/p/abc123');
  });
});

describe('"open another chatbot" block', () => {
  const linksNode = () => {
    const ctx = setup();
    const node = ctx.add('chatbot_links') as ChatNodeOf<'chatbot_links'>;
    return { ...ctx, node };
  };

  it('is created with one empty link option and only the "Continue" output', () => {
    const { node } = linksNode();
    expect(node.data.choices).toHaveLength(1);
    expect(node.data.choices[0]!.token).toBe('');
    expect(getOutputHandles(node)).toEqual([HANDLE_OUT]);
  });

  it('reuses the choice operations and stores the link token', () => {
    const { project, node } = linksNode();
    expect(addChoice(project, node.id, { id: 'c2', label: 'B', media: null })).toBe(true);
    expect(node.data.choices[1]).toEqual({ id: 'c2', label: 'B', media: null, token: '', target: null });
    expect(renameChoice(project, node.id, 'c2', 'Bia')).toBe(true);
    expect(setChoiceMedia(project, node.id, 'c2', { kind: 'emoji', emoji: '🦉' })).toBe(true);
    expect(setChoiceLink(project, node.id, 'c2', 'abc123', { title: 'Dona Coruja', emoji: '🦉' })).toBe(true);
    expect(node.data.choices[1]).toMatchObject({ label: 'Bia', token: 'abc123', target: { title: 'Dona Coruja', emoji: '🦉' } });
    setChoiceLink(project, node.id, 'c2', '', { title: 'x', emoji: null }); // sem link, sem destino salvo
    expect(node.data.choices[1]!.target).toBeNull();
    expect(removeChoice(project, node.id, 'c2')).toBe(true);
    expect(node.data.choices).toHaveLength(1);
  });

  it('setChoiceLink only applies to this block', () => {
    const { project, add } = setup();
    const choice = add('choice_question') as ChatNodeOf<'choice_question'>;
    expect(setChoiceLink(project, choice.id, choice.data.choices[0]!.id, 'abc', null)).toBe(false);
  });

  it('copies get new option ids and keep the links; option images count as used', () => {
    const { project, deps, node } = linksNode();
    const image: ChoiceMedia = { kind: 'image', source: { kind: 'upload', assetId: 'a1' } };
    node.data.choices[0]!.token = 'abc123';
    node.data.choices[0]!.media = image;
    const copy = cloneNode(node, project, { x: 0, y: 0 }, deps) as ChatNodeOf<'chatbot_links'>;
    expect(copy.data.choices[0]!.id).not.toBe(node.data.choices[0]!.id);
    expect(copy.data.choices[0]!.token).toBe('abc123');
    expect(getNodeAssetIds(node)).toEqual(['a1']);
  });

  it('loading fills missing token and media; validation warns about options without a link', () => {
    const { project, deps, node } = linksNode();
    const json = JSON.parse(JSON.stringify(project));
    delete json.nodes[node.id].data.choices[0].token;
    delete json.nodes[node.id].data.choices[0].media;
    delete json.nodes[node.id].data.choices[0].target;
    const result = parseProject(json, deps, NOW);
    if (!result.ok) throw new Error(result.error);
    const loaded = result.project.nodes[node.id] as ChatNodeOf<'chatbot_links'>;
    expect(loaded.data.choices[0]).toMatchObject({ token: '', media: null, target: null });
    expect(validateFlow(result.project).some(i => i.code === 'NO_LINK' && i.nodeId === node.id)).toBe(true);
  });
});
