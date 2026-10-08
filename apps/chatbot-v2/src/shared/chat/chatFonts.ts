import type { ChatFont } from '../types/chatbot';

/**
 * Carrega sob demanda os arquivos da fonte (latin: cobre os acentos do português).
 * As fontes vêm no build do app, sem CDN: nenhuma requisição a terceiros.
 */
const LOADERS: Record<Exclude<ChatFont, 'system'>, () => Promise<unknown>> = {
  andika: () => Promise.all([
    import('@fontsource/andika/latin-400.css'),
    import('@fontsource/andika/latin-700.css'),
    import('@fontsource/andika/latin-400-italic.css')
  ]),
  nunito: () => Promise.all([
    import('@fontsource/nunito/latin-400.css'),
    import('@fontsource/nunito/latin-700.css'),
    import('@fontsource/nunito/latin-400-italic.css')
  ]),
  atkinson: () => Promise.all([
    import('@fontsource/atkinson-hyperlegible/latin-400.css'),
    import('@fontsource/atkinson-hyperlegible/latin-700.css'),
    import('@fontsource/atkinson-hyperlegible/latin-400-italic.css')
  ]),
  comic: () => Promise.all([
    import('@fontsource/comic-neue/latin-400.css'),
    import('@fontsource/comic-neue/latin-700.css'),
    import('@fontsource/comic-neue/latin-400-italic.css')
  ])
};

const loaded = new Map<ChatFont, Promise<unknown>>();

/** Idempotente: cada fonte é baixada uma vez por página. Falha não impede o chat (usa a do sistema). */
export function loadChatFont(font: ChatFont): Promise<unknown> {
  if (font === 'system') return Promise.resolve();
  if (!loaded.has(font)) {
    loaded.set(font, LOADERS[font]().catch(err => {
      loaded.delete(font);
      console.warn('[Chatbot] Fonte indisponível', font, err);
    }));
  }
  return loaded.get(font)!;
}
