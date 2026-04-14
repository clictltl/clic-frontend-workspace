import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import App from './App.vue';
import { checkLogin, initMatomo, piniaInteractionHistoryPlugin } from '@clic/shared';

async function init() {
  // 1. Inicializa o Pinia globalmente ANTES de tudo (Evita crash de Lazy Evaluation)
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  setActivePinia(pinia);

  // 2. Verifica login no WordPress normalmente
  await checkLogin();

  // 3. Monta app somente depois de todos os dados estarem resolvidos
  const app = createApp(App);

  initMatomo({ app: 'Chatbot', context: 'Editor' });
  
  app.use(pinia);
  app.mount('#app');
}

init();
