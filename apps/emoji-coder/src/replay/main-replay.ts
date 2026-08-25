import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ReplayApp from './ReplayApp.vue';
import { initMatomo, i18n } from '@clic/shared';

const app = createApp(ReplayApp);
const pinia = createPinia();

initMatomo({ app: 'Emoji Coder', context: 'Replay' });

app.use(pinia);
app.use(i18n);
app.mount('#app');