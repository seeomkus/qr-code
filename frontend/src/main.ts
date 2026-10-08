import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Home from './views/Home.vue';
import Generate from './views/Generate.vue';
import Scan from './views/Scan.vue';
import History from './views/History.vue';
import './style.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/buat', component: Generate },
    { path: '/scan', component: Scan },
    { path: '/riwayat', component: History },
  ],
});

createApp(App).use(router).mount('#app');
