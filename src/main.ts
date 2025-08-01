import './assets/css/main.css';

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueFeather from 'vue-feather';
import PageHeaderVue from './components/ui/PageHeader.vue';
import Icon from '@/components/ui/Icon.vue';

import App from './App.vue'
import router from './router'

// Sécurité et performance Electron
import { setupRendererSecurity, performanceMonitor } from '@/utils/electron-security'

const app = createApp(App)

app.component(VueFeather.name, VueFeather);
app.component('PageHeader', PageHeaderVue);
app.component('Icon', Icon);
app.use(createPinia())
app.use(router)

// Configurer la sécurité pour Electron
if (window.electronAPI) {
  setupRendererSecurity()
  performanceMonitor.startMonitoring()
  
  // Nettoyer lors de la fermeture
  window.addEventListener('beforeunload', () => {
    performanceMonitor.stopMonitoring()
  })
}

app.mount('#app')
