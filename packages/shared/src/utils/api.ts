import { useAuth } from '../auth/auth';
import { i18n } from '../i18n';

export async function clicFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  
  if ((res.status === 401 || res.status === 403) && window.CLIC_AUTH) {
    let isPermissionError = false;
    let errorMessage = 'Acesso negado. Privilégios insuficientes.';

    try {
      const clone = res.clone();
      const data = await clone.json();
      
      // Se for 403 e NÃO for falha de autenticação/nonce, é falta de permissão
      if (res.status === 403 && data.code !== 'rest_cookie_invalid_nonce') {
        isPermissionError = true;
        errorMessage = data.message || errorMessage;
      }
    } catch (e) {
      // Ignora falhas de parse de JSON (ex: se o servidor retornou HTML)
    }

    if (isPermissionError) {
      throw new Error(errorMessage);
    }

    // Só cai aqui se for 401, ou se for 403 com nonce inválido
    const auth = useAuth();
    auth.state.showLoginModal = true;
    throw new Error(i18n.global.t('messages.session_expired'));
  }
  
  return res;
}