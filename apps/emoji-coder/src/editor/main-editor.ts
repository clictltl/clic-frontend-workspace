import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import App from './App.vue';
import { checkLogin, initMatomo, piniaInteractionHistoryPlugin, i18n } from '@clic/shared';

async function init() {
  // 1. Inicializa o Pinia globalmente
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  setActivePinia(pinia);

  // 2. Verificar Login no WordPress
  await checkLogin();

  // 3. Montagem do App
  const app = createApp(App);
  
  initMatomo({ app: 'Emoji Coder', context: 'Editor' });

  app.use(pinia);
  app.use(i18n);
  app.mount('#app');
}

init();