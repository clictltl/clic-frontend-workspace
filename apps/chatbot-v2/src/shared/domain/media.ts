import type { ChoiceMedia, Media, MediaSource, NodeMedia } from '../types/chatbot';

/** Só links http(s): bloqueia `javascript:`, `data:` e similares vindos de JSON de terceiros. */
export function isSafeMediaUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url.trim());
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidSource(source: MediaSource): boolean {
  return source.kind === 'upload' ? !!source.assetId : isSafeMediaUrl(source.url);
}

export function isValidMedia(media: Media): boolean {
  return media.type === 'video' ? isSafeMediaUrl(media.url) : isValidSource(media.source);
}

function sourceAssetId(source: MediaSource): string | null {
  return source.kind === 'upload' ? source.assetId : null;
}

/** Asset enviado usado pela mídia (links externos não ocupam assets). */
export function mediaAssetId(media: Media | undefined | null): string | null {
  if (!media || media.type === 'video') return null;
  return sourceAssetId(media.source);
}

export function nodeMediaAssetId(nodeMedia: NodeMedia | null | undefined): string | null {
  return mediaAssetId(nodeMedia?.media);
}

export function choiceMediaAssetId(media: ChoiceMedia | null): string | null {
  return media?.kind === 'image' ? sourceAssetId(media.source) : null;
}
