import { createApp } from 'vue';
import { createPinia } from 'pinia';
import RuntimeApp from './RuntimeApp.vue';
import { initMatomo, i18n } from '@clic/shared';

// segurança: runtime é SPA independente
const app = createApp(RuntimeApp);
const pinia = createPinia();
initMatomo({ app: 'Chatbot', context: 'Runtime' });
app.use(pinia);
app.use(i18n);
app.mount('#app');
