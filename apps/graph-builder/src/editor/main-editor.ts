import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import '@/styles/index.css';
import App from './App.vue';
import { checkLogin, initMatomo, piniaInteractionHistoryPlugin } from '@clic/shared';
import { useProjects } from '@/editor/utils/useProjects';

async function init() {
  // 1. Inicializa o Pinia globalmente ANTES do App
  // Isso permite que qualquer função use os stores livremente aqui no init
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  setActivePinia(pinia);

  // 2. Verificar Login no WordPress
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
    
    // Limpa a URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // 4. Criamos o App passando a prop calculada
  const app = createApp(App, { 
    shareLoadError 
  });
  
  initMatomo({ app: 'Graph Builder', context: 'Editor' });

  // E avisamos o app para usar o Pinia que já estava rodando
  app.use(pinia);
  app.mount('#app');
}

init();