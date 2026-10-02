import type { RichText } from '../types/chatbot';

/**
 * Dependências injetadas nas funções de domínio.
 *
 * O domínio não importa o `@clic/shared` nem o DOM em runtime (o index do shared
 * inicializa telemetria; o parser de HTML do Tiptap precisa de `window`). O app passa
 * as implementações reais; os testes passam versões determinísticas.
 */
export interface DomainDeps {
  newId: () => string;
  t: (key: string, params?: Record<string, unknown>) => string;
  /** Converte HTML (texto dos projetos v1) para o JSON do Tiptap. Usado só na migração. */
  htmlToRichText?: (html: string) => RichText;
}
