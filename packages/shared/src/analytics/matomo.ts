/// <reference types="vite/client" />

declare global {
  interface Window {
    _paq: any[];
  }
}

interface MatomoConfig {
  app: string;
  context: string;
}

// A turma inteira abre o app ao mesmo tempo: espalha os acessos ao matomo.php
const PAGEVIEW_DELAY_MIN_MS = 2_000;
const PAGEVIEW_DELAY_MAX_MS = 15_000;

// Segmentos de caminho seguidos de um token (runtime publicado e formulário)
const TOKEN_SEGMENTS = ['p', 'form'];

/**
 * URL registrada sem tokens: descarta a query (?share=, ?remix=, ?preview=) e o hash,
 * e troca o token de /p/{token} e /form/{token} por ":token".
 */
export function sanitizeTrackedUrl(href: string): string {
  const url = new URL(href);
  const parts = url.pathname.split('/');
  for (let i = 0; i < parts.length - 1; i++) {
    if (TOKEN_SEGMENTS.includes(parts[i]!) && parts[i + 1]) parts[i + 1] = ':token';
  }
  return url.origin + parts.join('/');
}

export function initMatomo(config: MatomoConfig) {
  window._paq = window._paq || [];
  window._paq.push(['disableCookies']);
  window._paq.push(['enableLinkTracking']);

  // 1. Lemos os dados do WordPress diretamente
  const clicCore = window.CLIC_CORE;

  // 2. Trava de Segurança Silenciosa:
  // Se não estivermos rodando no WP, ou se o Matomo estiver desativado no painel, pare aqui.
  // Isso evita que o navegador tente baixar o script e gere erro vermelho de 404 no F12.
  if (!clicCore?.site_url || !clicCore?.matomo_active) {
    return;
  }

  // URL e título capturados agora: o app pode trocar a URL (replaceState) antes do envio
  const pageTitle = `CLIC / ${config.app} / ${config.context}`;
  const trackedUrl = sanitizeTrackedUrl(window.location.href);
  // O referrer também pode carregar token (ex.: "Editar" no runtime abre o editor a partir de /p/{token})
  const trackedReferrer = document.referrer ? sanitizeTrackedUrl(document.referrer) : '';
  const delay = PAGEVIEW_DELAY_MIN_MS + Math.random() * (PAGEVIEW_DELAY_MAX_MS - PAGEVIEW_DELAY_MIN_MS);
  setTimeout(() => {
    window._paq.push(['setCustomUrl', trackedUrl]);
    if (trackedReferrer) window._paq.push(['setReferrerUrl', trackedReferrer]);
    window._paq.push(['setDocumentTitle', pageTitle]);
    window._paq.push(['trackPageView']);
  }, delay);

  // 3. Injeção Dinâmica: O WP confirmou que o Matomo está ligado.
  // Montamos a URL do Matomo usando o endereço base do próprio WordPress.
  (function() {
    const u = clicCore.site_url.endsWith('/') ? clicCore.site_url : clicCore.site_url + '/';
    const trackerUrl = u + 'wp-content/plugins/matomo/app/';
    
    window._paq.push(['setTrackerUrl', trackerUrl + 'matomo.php']);
    window._paq.push(['setSiteId', '1']); // O padrão de sites no WP é 1
    
    const d = document;
    const g = d.createElement('script');
    const s = d.getElementsByTagName('script')[0];
    
    // Evita injetar em duplicidade caso mude de tela no SPA
    if (document.querySelector('script[src*="matomo.js"]')) return;

    g.async = true;
    g.src = trackerUrl + 'matomo.js';
    
    if (s && s.parentNode) {
      s.parentNode.insertBefore(g, s);
    } else {
      d.head.appendChild(g);
    }
  })();
}

export function trackEvent(category: string, action: string, name?: string) {
  if (window._paq) {
    window._paq.push(['trackEvent', category, action, name]);
  }
}