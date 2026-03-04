import { createApp } from 'vue';
import App from './App.vue';
import { checkLogin } from './auth';
import { useProjects } from './utils/useProjects';

async function init() {
  const projects = useProjects();

  // 1. Detectar link compartilhado
  const params = new URLSearchParams(window.location.search);
  const shareToken = params.get("share");

  let shareLoadError = false;

if (shareToken) {
    const success = await projects.loadSharedProject(shareToken);
    
    if (!success) {
      shareLoadError = true;
      console.warn("Falha ao carregar projeto compartilhado. Token:", shareToken);
    }
    
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // 2. Verifica login normalmente
  await checkLogin();

  // 3. Monta app somente depois
  const app = createApp(App, { 
    shareLoadError: shareLoadError 
  });
  
  app.mount('#app');
}

init();
