import type { MediaSource } from '../../shared/types/chatbot';
import { assetStore } from '../../shared/stores/assetStore';

/** URL exibível de uma mídia: blob/URL pública do asset enviado, ou o link externo. Reativo em `computed`. */
export function resolveMediaSource(source: MediaSource): string | undefined {
  return source.kind === 'upload' ? assetStore.getAssetSrc(source.assetId) : source.url;
}
