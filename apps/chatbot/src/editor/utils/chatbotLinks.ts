import type { LinkTarget } from '../../shared/types/chatbot';
import { publishedLinkUrl } from '../../shared/domain/publishedLink';
import { fetchPublishedProject } from '../../shared/chat/publishedProject';

/** Endereço do app no site atual (ex.: `…/app/novelo/`). Fora do WordPress (dev, GitHub Pages) não há. */
export function appBaseUrl(): string | null {
  return window.CLIC_CORE?.app_url ?? null;
}

/** Link completo do chatbot publicado no site atual, ou null fora do WordPress. */
export function linkUrlFor(token: string): string | null {
  const base = appBaseUrl();
  return base ? publishedLinkUrl(token, base) : null;
}

/**
 * Título e emoji do chatbot de destino, para o autor reconhecer o link (null = não encontrado).
 * Só sob demanda (ao colar o link ou no botão de atualizar): a rota devolve o projeto inteiro,
 * e o resultado fica salvo na opção para não consultar de novo a cada abertura do painel.
 */
export async function checkLink(token: string): Promise<LinkTarget | null> {
  try {
    const project = await fetchPublishedProject(token);
    const avatar = project.appearance.avatar;
    return { title: project.title, emoji: avatar?.kind === 'emoji' ? avatar.emoji : null };
  } catch {
    return null;
  }
}
