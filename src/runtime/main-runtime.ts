import { createApp } from 'vue';
import { createPinia } from 'pinia';
import RuntimeApp from './RuntimeApp.vue';

const app = createApp(RuntimeApp);
const pinia = createPinia();

app.use(pinia);
app.mount('#app'); // Em produção, o container pode ter outro ID