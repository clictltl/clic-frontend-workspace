import { createApp } from 'vue';
import { createPinia } from 'pinia';
import RuntimeApp from './RuntimeApp.vue';
import { initMatomo, i18n } from '@clic/shared';
import '../shared/richText/richText.css';

const app = createApp(RuntimeApp);
const pinia = createPinia();

initMatomo({ app: 'Chatbot', context: 'Runtime' });

app.use(pinia);
app.use(i18n);
app.mount('#app');