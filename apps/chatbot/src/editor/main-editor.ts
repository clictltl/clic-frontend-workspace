import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import App from './App.vue';
import { checkLogin, initMatomo } from '@clic/shared';
import { useProjects } from '@/editor/composables/useProjects';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useAssetStore } from '@/editor/composables/useAssetStore';

async function init() {
  // 1. Inicializa o Pinia globalmente ANTES de tudo (Evita crash de Lazy Evaluation)
  const pinia = createPinia();
  setActivePinia(pinia);

  // 2. Verifica login no WordPress normalmente
  await checkLogin();

  // 3. Restaurar Backup Pós-Login
  const loginBackup = sessionStorage.getItem('clic-chatbot:login-backup');
  if (loginBackup) {
    try {
      const parsedSaved = JSON.parse(loginBackup);
      const projects = useProjects();
      const assetStore = useAssetStore();
      
      await assetStore.restoreFromDisk();
      useProjectStore().setProjectData(parsedSaved.data, !!parsedSaved.wasDirty);
      projects.currentProjectId.value = parsedSaved.id;
      projects.currentProjectName.value = parsedSaved.name || '';
            
      sessionStorage.removeItem('clic-chatbot:login-backup');
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
    
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // 5. Monta app somente depois de todos os dados estarem resolvidos
  const app = createApp(App, { 
    shareLoadError 
  });

  initMatomo({ app: 'Chatbot', context: 'Editor' });
  
  app.use(pinia);
  app.mount('#app');
}

init();
