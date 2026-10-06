import { reactive } from 'vue';

type MeResponse = {
  logged_in: boolean;
  id?: number;
  name?: string;
  email?: string;
  // campos extras podem existir no futuro
  [key: string]: any;
};

const state = reactive({
  ready: false,       // já fez a checagem inicial
  loggedIn: false,
  showLoginModal: false,
  id: 0,
  name: '',
  email: '',
  error: '' as string | null,
});

export async function checkLogin(): Promise<MeResponse> {
  const auth = typeof window !== 'undefined' ? window.CLIC_AUTH : undefined;
  const isWP = !!auth;

  // --- 1. Fora do WordPress (GitHub Pages) ---
  if (!isWP) {
    state.ready = true;
    state.loggedIn = false;
    return { logged_in: false };
  }

  // --- 2. Está no WordPress: seguir fluxo normal ---
  const root = auth.rest_root;

  try {
    const res = await fetch(root + 'me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-WP-Nonce': getNonce(), // ESSENCIAL
      },
    });

    if (!res.ok) {
      state.error = `HTTP ${res.status}`;
      state.ready = true;
      state.loggedIn = false;
      return { logged_in: false };
    }

    const data = (await res.json()) as MeResponse;
    applyUser(data);
    return data;

  } catch (err: any) {
    state.error = err?.message || String(err);
    state.ready = true;
    state.loggedIn = false;
    return { logged_in: false };
  }
}

/**
 * Nonce atual do WP REST. Lido a cada requisição: o login e a renovação trocam o valor
 * em `window.CLIC_AUTH`, e todo o app passa a usar o novo.
 */
export function getNonce(): string {
  return typeof window !== 'undefined' ? window.CLIC_AUTH?.nonce ?? '' : '';
}

function setNonce(nonce: string) {
  if (window.CLIC_AUTH) window.CLIC_AUTH.nonce = nonce;
}

function adminAjaxUrl() {
  const base = window.CLIC_CORE?.site_url ?? '/';
  return (base.endsWith('/') ? base : base + '/') + 'wp-admin/admin-ajax.php';
}

let pendingRefresh: Promise<boolean> | null = null;

/**
 * Busca um nonce novo pelo `admin-ajax.php?action=rest-nonce` (rota do próprio WP).
 * Devolve false se o usuário não está mais logado. Chamadas simultâneas compartilham
 * a mesma requisição.
 */
export function refreshNonce(): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = (async () => {
      try {
        const res = await fetch(`${adminAjaxUrl()}?action=rest-nonce`, { credentials: 'same-origin' });
        const nonce = (await res.text()).trim();
        // Sem login, o admin-ajax responde "0" com status 400
        if (!res.ok || !nonce || nonce === '0') return false;
        setNonce(nonce);
        return true;
      } catch {
        return false;
      } finally {
        pendingRefresh = null;
      }
    })();
  }
  return pendingRefresh;
}

/**
 * Aplica a resposta de sucesso do `POST clic-auth/v1/login` (mesmos campos do /me,
 * mais o nonce e o logout_url da sessão nova), sem recarregar a página.
 * Devolve false se a resposta não trouxe nonce e ele não pôde ser renovado.
 */
export async function applyLoginResponse(data: MeResponse & { nonce?: string; logout_url?: string }): Promise<boolean> {
  if (data.logout_url && window.CLIC_AUTH) window.CLIC_AUTH.logout_url = data.logout_url;

  if (data.nonce) {
    setNonce(data.nonce);
    applyUser(data);
    return true;
  }

  // Resposta sem nonce (back-end antigo): renova e consulta o /me
  if (!(await refreshNonce())) return false;
  await checkLogin();
  return state.loggedIn;
}

function applyUser(data: MeResponse) {
  state.loggedIn = !!data.logged_in;
  state.id = data.logged_in ? data.id ?? 0 : 0;
  state.name = data.logged_in ? data.name ?? '' : '';
  state.email = data.logged_in ? data.email ?? '' : '';
  state.ready = true;
  state.error = null;
}

export function useAuth() {
  return {
    state,
    checkLogin,
  };
}
