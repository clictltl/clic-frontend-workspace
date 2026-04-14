import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import '@/styles/index.css';
import App from './App.vue';
import { checkLogin, initMatomo, piniaInteractionHistoryPlugin } from '@clic/shared';

async function init() {
  // 1. Inicializa o Pinia globalmente ANTES do App
  // Isso permite que qualquer função use os stores livremente aqui no init
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  setActivePinia(pinia);

  // 2. Verificar Login no WordPress
  await checkLogin();

  // 3. Criamos o App passando a prop calculada
  const app = createApp(App);
  
  initMatomo({ app: 'Graph Builder', context: 'Editor' });

  // E avisamos o app para usar o Pinia que já estava rodando
  app.use(pinia);
  app.mount('#app');
}

init();