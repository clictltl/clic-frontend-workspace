import { inject, provide, type InjectionKey } from 'vue';
import type { MediaSource } from '../types/chatbot';

/** Converte a origem de uma mídia na URL exibível. Cada entrypoint fornece a sua. */
export type MediaResolver = (source: MediaSource) => string | undefined;

const MEDIA_RESOLVER: InjectionKey<MediaResolver> = Symbol('mediaResolver');

/**
 * - Editor: arquivos enviados vêm do assetStore (blob local ou URL pública).
 * - Runtime: só existem arquivos já publicados (URL pública em `project.assets`).
 */
export function provideMediaResolver(resolver: MediaResolver) {
  provide(MEDIA_RESOLVER, resolver);
}

export function useMediaResolver(): MediaResolver {
  return inject(MEDIA_RESOLVER, source => (source.kind === 'url' ? source.url : undefined));
}
