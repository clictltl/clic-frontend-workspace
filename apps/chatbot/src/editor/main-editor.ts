import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import App from './App.vue';
import { checkLogin, initMatomo, piniaInteractionHistoryPlugin } from '@clic/shared';
import { useProjects } from '@/editor/composables/useProjects';

async function init() {
  // 1. Inicializa o Pinia globalmente ANTES de tudo (Evita crash de Lazy Evaluation)
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  setActivePinia(pinia);

  // 2. Verifica login no WordPress normalmente
  await checkLogin();

  // 3. Detectar link compartilhado (?share=TOKEN)
  const params = new URLSearchParams(window.location.search);
  const shareToken = params.get("share");
  let shareLoadError = false;

  if (shareToken) {
    const projects = useProjects();
    const success = await projects.loadSharedProject(shareToken);
    
    if (!success) {
      shareLoadError = true;
      console.warn("Falha ao carregar projeto compartilhado. Token:", shareToken);
    }
    
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // 4. Monta app somente depois de todos os dados estarem resolvidos
  const app = createApp(App, { 
    shareLoadError 
  });

  initMatomo({ app: 'Chatbot', context: 'Editor' });
  
  app.use(pinia);
  app.mount('#app');
}

init();
