import { useAuth, getNonce, refreshNonce } from '../auth/auth';
import { i18n } from '../i18n';
import { ApiError, NetworkError, apiErrorMessage } from './apiErrors';

/** Lê o código de erro do WP (`code`) ou do clic-core (`error`) sem consumir a resposta. */
async function readErrorCode(res: Response): Promise<{ code: string; fromClic: boolean }> {
  try {
    const data = await res.clone().json();
    // clic-core/clic-auth: { success: false, error }; WordPress: { code, message, data }
    return { code: data.error ?? data.code ?? '', fromClic: typeof data.error === 'string' };
  } catch (e) {
    // Ignora falhas de parse de JSON (ex: se o servidor retornou HTML)
    return { code: '', fromClic: false };
  }
}

/** fetch que transforma falha de rede em NetworkError (mensagem traduzida). */
async function send(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch {
    throw new NetworkError();
  }
}

/** Repete as opções da requisição trocando o nonce pelo atual. */
function withCurrentNonce(options: RequestInit): RequestInit {
  const headers = new Headers(options.headers);
  headers.set('X-WP-Nonce', getNonce());
  return { ...options, headers };
}

export async function clicFetch(url: string, options?: RequestInit) {
  let res = await send(url, options);

  if ((res.status === 401 || res.status === 403) && window.CLIC_AUTH) {
    let { code, fromClic } = await readErrorCode(res);

    // Nonce vencido (sessão longa ou login em outra aba): renova e tenta de novo uma vez
    const sentNonce = new Headers(options?.headers).has('X-WP-Nonce');
    if (res.status === 403 && code === 'rest_cookie_invalid_nonce' && sentNonce && await refreshNonce()) {
      res = await send(url, withCurrentNonce(options!));
      if (res.status !== 401 && res.status !== 403) return res;
      ({ code, fromClic } = await readErrorCode(res));
    }

    // 403 que não é de nonce: falta de permissão, não de sessão (não abre o login).
    // Do CLIC (FORBIDDEN, FORBIDDEN_PREVIEW...): devolve a resposta, e quem chamou traduz data.error.
    // Do WordPress (rest_forbidden): não há corpo do CLIC para ler, então lança a mensagem pronta.
    if (res.status === 403 && code !== 'rest_cookie_invalid_nonce') {
      if (fromClic) return res;
      throw new ApiError(code, apiErrorMessage(code, 'errors.forbidden'));
    }

    // Só cai aqui se for 401, ou se for 403 com nonce inválido que não pôde ser renovado
    const auth = useAuth();
    auth.state.showLoginModal = true;
    throw new ApiError(code, i18n.global.t('messages.session_expired'));
  }

  return res;
}
