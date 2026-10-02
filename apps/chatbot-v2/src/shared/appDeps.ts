import { generateUUID, i18n } from '@clic/shared';
import type { DomainDeps } from './domain/deps';

/** Dependências reais do domínio no app (os testes usam versões determinísticas). */
export const appDomainDeps: DomainDeps = {
  newId: generateUUID,
  t: (key, params) => i18n.global.t(key, params ?? {})
};
