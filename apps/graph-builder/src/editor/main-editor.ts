import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/styles/index.css'
import App from './App.vue'
import { checkLogin } from '@clic/shared';

async function init() {
  await checkLogin();

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.mount('#app')
}

init();