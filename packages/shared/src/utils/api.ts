import { useAuth, getNonce, refreshNonce } from '../auth/auth';
import { i18n } from '../i18n';

/** Lê o código de erro do WP (`code`) ou do clic-core (`error`) sem consumir a resposta. */
async function readErrorCode(res: Response): Promise<{ code: string; message: string }> {
  try {
    const data = await res.clone().json();
    return { code: data.code ?? data.error ?? '', message: data.message ?? '' };
  } catch (e) {
    // Ignora falhas de parse de JSON (ex: se o servidor retornou HTML)
    return { code: '', message: '' };
  }
}

/** Repete as opções da requisição trocando o nonce pelo atual. */
function withCurrentNonce(options: RequestInit): RequestInit {
  const headers = new Headers(options.headers);
  headers.set('X-WP-Nonce', getNonce());
  return { ...options, headers };
}

export async function clicFetch(url: string, options?: RequestInit) {
  let res = await fetch(url, options);

  if ((res.status === 401 || res.status === 403) && window.CLIC_AUTH) {
    let { code, message } = await readErrorCode(res);

    // Nonce vencido (sessão longa ou login em outra aba): renova e tenta de novo uma vez
    const sentNonce = new Headers(options?.headers).has('X-WP-Nonce');
    if (res.status === 403 && code === 'rest_cookie_invalid_nonce' && sentNonce && await refreshNonce()) {
      res = await fetch(url, withCurrentNonce(options!));
      if (res.status !== 401 && res.status !== 403) return res;
      ({ code, message } = await readErrorCode(res));
    }

    // Se for 403 e NÃO for falha de autenticação/nonce, é falta de permissão
    if (res.status === 403 && code !== 'rest_cookie_invalid_nonce') {
      throw new Error(message || 'Acesso negado. Privilégios insuficientes.');
    }

    // Só cai aqui se for 401, ou se for 403 com nonce inválido que não pôde ser renovado
    const auth = useAuth();
    auth.state.showLoginModal = true;
    throw new Error(i18n.global.t('messages.session_expired'));
  }

  return res;
}
