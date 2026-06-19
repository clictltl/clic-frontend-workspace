import { createApp } from 'vue';
import { createPinia } from 'pinia';
import RuntimeApp from './RuntimeApp.vue';
import { initMatomo, i18n } from '@clic/shared';

const app = createApp(RuntimeApp);
const pinia = createPinia();

initMatomo({ app: 'Emoji Coder', context: 'Runtime' });

app.use(pinia);
app.use(i18n);
app.mount('#app');