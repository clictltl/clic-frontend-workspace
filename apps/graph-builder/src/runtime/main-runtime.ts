import { createApp } from 'vue';
import { createPinia } from 'pinia';
import RuntimeApp from './RuntimeApp.vue';
import { initMatomo } from '@clic/shared';

const app = createApp(RuntimeApp);
const pinia = createPinia();

initMatomo({ app: 'Graph Builder', context: 'Editor' });

app.use(pinia);
app.mount('#app'); // Em produção, o container pode ter outro ID