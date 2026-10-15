/**
 * LINKS DE CHATBOTS PUBLICADOS ("Abrir outro chatbot")
 *
 * O projeto guarda só o token do chatbot de destino: o endereço é montado no site atual,
 * então trocar de domínio não quebra os projetos. O autor cola o link completo.
 */

const TOKEN = /^[A-Za-z0-9_-]{4,64}$/;

/**
 * Token de um link publicado (`…/app/{slug}/p/{token}`, com ou sem domínio, com ou sem `/` final),
 * ou o próprio token colado sozinho. Devolve null para qualquer outra coisa (ex.: link de compartilhamento).
 */
export function tokenFromPublishedLink(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  const path = text.replace(/[?#].*$/, '').replace(/\/+$/, '');
  const match = /\/p\/([^/]+)$/.exec(path);
  const token = match ? match[1]! : text;
  return TOKEN.test(token) ? token : null;
}

/** Endereço do chatbot publicado no site atual (`appBaseUrl` = endereço do app, ex.: `…/app/novelo`). */
export function publishedLinkUrl(token: string, appBaseUrl: string): string {
  return `${appBaseUrl.replace(/\/+$/, '')}/p/${token}`;
}
