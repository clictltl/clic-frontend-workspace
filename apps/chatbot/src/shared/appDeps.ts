import { generateJSON } from '@tiptap/core';
import { generateUUID, i18n } from '@clic/shared';
import type { DomainDeps } from './domain/deps';
import { createRichTextExtensions } from './richText/extensions';

// Schema usado para ler o HTML dos projetos v1 (não há pílulas de variável nesse HTML)
const migrationExtensions = createRichTextExtensions({ variableName: () => undefined });

/** Dependências reais do domínio no app (os testes usam versões determinísticas). */
export const appDomainDeps: DomainDeps = {
  newId: generateUUID,
  t: (key, params) => i18n.global.t(key, params ?? {}),
  htmlToRichText: html => generateJSON(html, migrationExtensions)
};
