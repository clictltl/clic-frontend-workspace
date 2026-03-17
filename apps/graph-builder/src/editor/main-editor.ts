import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import '@/styles/index.css';
import App from './App.vue';
import { checkLogin, initMatomo } from '@clic/shared';
import { useProjects } from '@/editor/utils/useProjects';
import { useProjectStore } from '@/shared/stores/projectStore';
import { assetStore } from '@/shared/stores/assetStore';

async function init() {
  // 1. Inicializa o Pinia globalmente ANTES do App
  // Isso permite que qualquer função use os stores livremente aqui no init
  const pinia = createPinia();
  setActivePinia(pinia);

  // 2. Verificar Login no WordPress
  await checkLogin();

  // 3. Restaurar Backup Pós-Login
  const loginBackup = sessionStorage.getItem('clic-graph-builder:login-backup');
  if (loginBackup) {
    try {
      const parsedSaved = JSON.parse(loginBackup);
      const projects = useProjects();
      
      useProjectStore().loadProject(parsedSaved.data, !!parsedSaved.wasDirty);
      projects.currentProjectId.value = parsedSaved.id;
      projects.currentProjectName.value = parsedSaved.name || '';
            
      await assetStore.restoreFromDisk();

      sessionStorage.removeItem('clic-graph-builder:login-backup');
      await assetStore.clearDisk();
    } catch (e) {
      console.error("Erro ao restaurar backup local:", e);
    }
  }

  // 4. Detectar link compartilhado (?share=TOKEN)
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

  // 5. Criamos o App passando a prop calculada
  const app = createApp(App, { 
    shareLoadError 
  });
  
  initMatomo({ app: 'Graph Builder', context: 'Editor' });

  // E avisamos o app para usar o Pinia que já estava rodando
  app.use(pinia);
  app.mount('#app');
}

init();