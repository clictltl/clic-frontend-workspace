import { createApp } from 'vue';
import RuntimeApp from './RuntimeApp.vue';
import { initMatomo } from '@clic/shared';

// segurança: runtime é SPA independente
const app = createApp(RuntimeApp);
initMatomo({ app: 'Chatbot', context: 'Runtime' });
app.mount('#app');
