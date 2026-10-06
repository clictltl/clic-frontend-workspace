import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyLoginResponse, getNonce, refreshNonce, useAuth } from '../auth';
import { clicFetch } from '../../utils/api';

const fetchMock = vi.fn();
const json = (status: number, body: any) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const invalidNonce = () => json(403, { code: 'rest_cookie_invalid_nonce', message: 'Cookie check failed' });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  (window as any).CLIC_AUTH = { nonce: 'old', rest_root: '/wp-json/clic-auth/v1/', logged_in: false, logout_url: '' };
  (window as any).CLIC_CORE = { site_url: 'https://clic.org' };
  const { state } = useAuth();
  Object.assign(state, { ready: true, loggedIn: false, showLoginModal: false, id: 0, name: '', email: '' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as any).CLIC_AUTH;
  delete (window as any).CLIC_CORE;
});

describe('refreshNonce', () => {
  it('grava o nonce novo vindo do admin-ajax', async () => {
    fetchMock.mockResolvedValue(new Response('new-nonce', { status: 200 }));

    expect(await refreshNonce()).toBe(true);
    expect(getNonce()).toBe('new-nonce');
    expect(fetchMock.mock.calls[0]![0]).toBe('https://clic.org/wp-admin/admin-ajax.php?action=rest-nonce');
  });

  it('devolve false sem login (admin-ajax responde "0")', async () => {
    fetchMock.mockResolvedValue(new Response('0', { status: 400 }));

    expect(await refreshNonce()).toBe(false);
    expect(getNonce()).toBe('old');
  });

  it('compartilha uma única requisição entre chamadas simultâneas', async () => {
    fetchMock.mockResolvedValue(new Response('new-nonce', { status: 200 }));

    await Promise.all([refreshNonce(), refreshNonce(), refreshNonce()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('applyLoginResponse', () => {
  it('aplica nonce, logout_url e usuário sem chamar o servidor', async () => {
    const ok = await applyLoginResponse({
      success: true, nonce: 'login-nonce', logout_url: 'https://clic.org/wp-login.php?action=logout&amp;_wpnonce=x',
      logged_in: true, id: 7, name: 'Ana Souza', email: 'ana@escola.br'
    });

    expect(ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getNonce()).toBe('login-nonce');
    expect(window.CLIC_AUTH!.logout_url).toContain('&amp;_wpnonce=x');
    expect(useAuth().state).toMatchObject({ loggedIn: true, id: 7, name: 'Ana Souza', email: 'ana@escola.br' });
  });

  it('sem nonce na resposta, renova pelo admin-ajax e consulta o /me', async () => {
    fetchMock.mockImplementation(async (url: string) => url.includes('admin-ajax.php')
      ? new Response('ajax-nonce', { status: 200 })
      : json(200, { logged_in: true, id: 3, name: 'Bia', email: 'bia@escola.br' }));

    expect(await applyLoginResponse({ logged_in: true })).toBe(true);
    expect(getNonce()).toBe('ajax-nonce');
    expect(useAuth().state.name).toBe('Bia');
  });

  it('devolve false se não há nonce e a renovação falha', async () => {
    fetchMock.mockResolvedValue(new Response('0', { status: 400 }));

    expect(await applyLoginResponse({ logged_in: true })).toBe(false);
  });
});

describe('clicFetch', () => {
  const request = () => clicFetch('/wp-json/clic/v1/chatbot/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': getNonce() },
    body: '{}'
  });

  it('renova o nonce vencido e repete a requisição, sem abrir o login', async () => {
    fetchMock.mockImplementation(async (url: string, init: any) => {
      if (url.includes('admin-ajax.php')) return new Response('new-nonce', { status: 200 });
      return new Headers(init.headers).get('X-WP-Nonce') === 'new-nonce' ? json(200, { success: true }) : invalidNonce();
    });

    const res = await request();

    expect(res.status).toBe(200);
    expect(useAuth().state.showLoginModal).toBe(false);
  });

  it('abre o login quando o usuário saiu', async () => {
    fetchMock.mockImplementation(async (url: string) => url.includes('admin-ajax.php')
      ? new Response('0', { status: 400 })
      : invalidNonce());

    await expect(request()).rejects.toThrow();
    expect(useAuth().state.showLoginModal).toBe(true);
  });

  it('mantém o erro de permissão (403 sem ser de nonce) sem renovar nem abrir o login', async () => {
    fetchMock.mockResolvedValue(json(403, { code: 'rest_forbidden', message: 'Sem permissão' }));

    await expect(request()).rejects.toThrow('Sem permissão');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useAuth().state.showLoginModal).toBe(false);
  });
});
