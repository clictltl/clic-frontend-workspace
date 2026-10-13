import { i18n } from '../i18n';

/**
 * Códigos de erro das rotas REST (clic-core, clic-auth e WordPress) e a mensagem de cada um.
 *
 * Formatos: CLIC `{ success: false, error: 'CODIGO' }`; WordPress `{ code, message, data: { status } }`.
 * Os códigos antigos ficam na lista enquanto a produção puder ter o back-end anterior.
 * Vários códigos dividem a mesma mensagem: quem lê é aluno ou professor, não precisa do detalhe técnico.
 */
export type ApiErrorCode =
  // comuns às rotas que recebem projeto
  | 'NOT_FOUND' | 'FORBIDDEN'
  // projetos
  | 'APP_NOT_REGISTERED' | 'INVALID_PAYLOAD' | 'MISSING_NAME' | 'NAME_TOO_LONG' | 'MISSING_DATA'
  | 'INVALID_JSON' | 'EMPTY_DATA' | 'DATA_TOO_LARGE' | 'NAME_ALREADY_EXISTS'
  | 'CORRUPTED_DATA' | 'EMPTY_OR_CORRUPTED_DATA' | 'FORBIDDEN_PREVIEW'
  // links e formulários
  | 'INVALID_TOKEN' | 'PROJECT_NOT_FOUND' | 'PAYLOAD_TOO_LARGE'
  // mídia
  | 'MISSING_FILE' | 'UPLOAD_FAILED' | 'ATTACHMENT_CREATION_FAILED'
  // telemetria (não aparecem para o usuário, mas ficam no tipo)
  | 'TOO_MANY_EVENTS' | 'MISSING_DATE_FILTERS' | 'INVALID_DATE_FORMAT'
  // clic-auth
  | 'MISSING_CREDENTIALS' | 'TOO_MANY_ATTEMPTS' | 'LGPD_REQUIRED' | 'ACCOUNT_BLOCKED' | 'LOGIN_FAILED'
  // WordPress
  | 'rest_forbidden' | 'rest_cookie_invalid_nonce' | 'rest_no_route' | 'rest_invalid_param'
  // do próprio front
  | 'PROJECT_NOT_SAVED';

export const API_ERROR_KEYS: Record<ApiErrorCode, string> = {
  NOT_FOUND: 'errors.not_found',
  PROJECT_NOT_FOUND: 'errors.not_found',
  FORBIDDEN: 'errors.forbidden',
  FORBIDDEN_PREVIEW: 'errors.forbidden',
  rest_forbidden: 'errors.forbidden',

  NAME_ALREADY_EXISTS: 'errors.name_exists',
  MISSING_NAME: 'modals.save_as.error_empty',
  NAME_TOO_LONG: 'errors.name_too_long',
  DATA_TOO_LARGE: 'errors.too_large',
  CORRUPTED_DATA: 'errors.corrupted',
  EMPTY_OR_CORRUPTED_DATA: 'errors.corrupted',
  PROJECT_NOT_SAVED: 'errors.not_saved',

  INVALID_TOKEN: 'errors.invalid_link',
  PAYLOAD_TOO_LARGE: 'errors.answer_too_large',

  MISSING_FILE: 'errors.upload',
  UPLOAD_FAILED: 'errors.upload',
  ATTACHMENT_CREATION_FAILED: 'errors.upload',

  // Erros de requisição: o usuário não tem o que corrigir além de recarregar
  APP_NOT_REGISTERED: 'errors.request',
  INVALID_PAYLOAD: 'errors.request',
  INVALID_JSON: 'errors.request',
  MISSING_DATA: 'errors.request',
  EMPTY_DATA: 'errors.request',
  TOO_MANY_EVENTS: 'errors.request',
  MISSING_DATE_FILTERS: 'errors.request',
  INVALID_DATE_FORMAT: 'errors.request',
  rest_no_route: 'errors.request',
  rest_invalid_param: 'errors.request',

  MISSING_CREDENTIALS: 'auth.fill_fields',
  LOGIN_FAILED: 'auth.invalid_credentials',
  TOO_MANY_ATTEMPTS: 'auth.too_many_attempts',
  LGPD_REQUIRED: 'auth.blocked_terms',
  ACCOUNT_BLOCKED: 'auth.blocked_teacher',
  rest_cookie_invalid_nonce: 'messages.session_expired',
};

function isApiErrorCode(code: string): code is ApiErrorCode {
  return Object.prototype.hasOwnProperty.call(API_ERROR_KEYS, code);
}

/**
 * Mensagem traduzida para um código de erro do servidor.
 * Código vazio ou desconhecido: `fallbackKey` (padrão: mensagem genérica); o código vai para o console.
 */
export function apiErrorMessage(code: string | null | undefined, fallbackKey = 'errors.unknown'): string {
  if (code && isApiErrorCode(code)) return i18n.global.t(API_ERROR_KEYS[code]);
  if (code) console.warn('[CLIC] Código de erro sem mensagem:', code);
  return i18n.global.t(fallbackKey);
}

/** Falha de rede (o fetch nem obteve resposta). Lançada pelo clicFetch. */
export class NetworkError extends Error {
  constructor() {
    super(i18n.global.t('errors.network'));
    this.name = 'NetworkError';
  }
}

/** Erro com mensagem já traduzida, lançado pelo clicFetch (sessão expirada, sem permissão). */
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Mensagem para uma exceção capturada em volta de uma requisição.
 * NetworkError, ApiError e os Error lançados pelo próprio shared já vêm traduzidos.
 * Erros de programação (TypeError etc.) viram a mensagem genérica, em vez de texto técnico em inglês.
 */
export function requestErrorMessage(err: unknown): string {
  if (err instanceof TypeError || err instanceof ReferenceError || err instanceof SyntaxError) {
    console.error(err);
    return i18n.global.t('errors.unknown');
  }
  if (err instanceof Error && err.message) return err.message;
  return i18n.global.t('errors.unknown');
}
