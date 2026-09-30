/**
 * Dependências injetadas nas funções de domínio.
 *
 * O domínio não importa o `@clic/shared` em runtime (o index dele inicializa
 * telemetria e DOM). O store passa `generateUUID` e `i18n.global.t`; os testes
 * passam geradores determinísticos.
 */
export interface DomainDeps {
  newId: () => string;
  t: (key: string, params?: Record<string, unknown>) => string;
}
