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

export function initMatomo(config: MatomoConfig) {
  window._paq = window._paq || [];
  window._paq.push(['disableCookies']);

  const pageTitle = `CLIC / ${config.app} / ${config.context}`;
  window._paq.push(['setDocumentTitle', pageTitle]);
  window._paq.push(['trackPageView']);
  window._paq.push(['enableLinkTracking']);

  // 1. Lemos os dados do WordPress diretamente
  const clicCore = window.CLIC_CORE;

  // 2. Trava de Segurança Silenciosa: 
  // Se não estivermos rodando no WP, ou se o Matomo estiver desativado no painel, pare aqui.
  // Isso evita que o navegador tente baixar o script e gere erro vermelho de 404 no F12.
  if (!clicCore?.site_url || !clicCore?.matomo_active) {
    return;
  }

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