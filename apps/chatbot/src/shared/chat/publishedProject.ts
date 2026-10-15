import type { ChatbotProject, MediaSource } from '../types/chatbot';
import { parseProject } from '../domain/project';
import { appDomainDeps } from '../appDeps';

/**
 * Chatbot publicado, buscado pelo token na rota pública do app (runtime e "Abrir outro chatbot").
 * Lança erro se o link não existir mais ou o projeto for inválido.
 */
export async function fetchPublishedProject(token: string): Promise<ChatbotProject> {
  const restRoot = window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/chatbot/';
  const res = await fetch(restRoot + 'publish/' + encodeURIComponent(token));
  if (!res.ok) throw new Error('INVALID_TOKEN');
  const json = await res.json();
  const result = parseProject(json?.project?.data, appDomainDeps, new Date().toISOString());
  if (!result.ok) throw new Error(result.error);
  return result.project;
}

/** Mídia de um projeto publicado: só existem arquivos já enviados (URL pública em `project.assets`). */
export function publishedMediaUrl(project: ChatbotProject | null, source: MediaSource): string | undefined {
  if (source.kind === 'url') return source.url;
  const asset = project?.assets[source.assetId];
  return asset?.source === 'remote' ? asset.url : undefined;
}
