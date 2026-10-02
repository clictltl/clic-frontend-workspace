import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import App from './App.vue';
import { checkLogin, initMatomo, piniaInteractionHistoryPlugin, i18n } from '@clic/shared';

import '@clic/shared/src/styles/base.css';
// Já importamos o CSS base do Vue Flow aqui para garantir que o motor gráfico funcione depois
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '../shared/richText/richText.css';
import './styles/properties.css';

async function init() {
  const pinia = createPinia();
  pinia.use(piniaInteractionHistoryPlugin);
  setActivePinia(pinia);

  await checkLogin();

  const app = createApp(App);
  
  initMatomo({ app: 'Chatbot', context: 'Editor' });

  app.use(pinia);
  app.use(i18n);
  app.mount('#app');
}

init();