<script setup lang="ts">
import { mdiHome, mdiQrcode, mdiQrcodeScan, mdiHistory } from '@mdi/js';
import Icon from './components/Icon.vue';

const nav = [
  { to: '/', label: 'Beranda', icon: mdiHome, color: '#f59e0b' },
  { to: '/buat', label: 'Buat QR', icon: mdiQrcode, color: '#6366f1' },
  { to: '/scan', label: 'Scan', icon: mdiQrcodeScan, color: '#10b981' },
  { to: '/riwayat', label: 'Riwayat', icon: mdiHistory, color: '#ec4899' },
];
</script>

<template>
  <header class="top">
    <div class="wrap row">
      <Icon :path="mdiQrcode" color="#ffffff" :size="30" />
      <div class="grow">
        <strong class="brand">SeeOmKus QR</strong>
      </div>
    </div>
  </header>

  <main class="wrap page">
    <router-view />

    <footer class="foot">
      <div><strong>SeeOmKus</strong> &middot; <a href="https://www.seeomkus.com" target="_blank" rel="noopener">www.seeomkus.com</a></div>
      <div class="muted">Oktober 2026</div>
    </footer>
  </main>

  <nav class="tabs">
    <router-link v-for="n in nav" :key="n.to" :to="n.to" class="tab" active-class="on" exact-active-class="on">
      <Icon :path="n.icon" :color="n.color" :size="30" />
      <span>{{ n.label }}</span>
    </router-link>
  </nav>
</template>

<style>
.wrap { max-width: 960px; margin: 0 auto; padding: 0 16px; }
.top {
  background: linear-gradient(135deg, #4f46e5, #7c3aed 60%, #db2777);
  color: #fff;
  padding: calc(14px + env(safe-area-inset-top)) 0 14px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4px 18px rgba(79, 70, 229, 0.35);
}
.brand { font-size: 1.35rem; letter-spacing: 0.3px; }
.page { padding-top: 20px; padding-bottom: 130px; }
.foot { text-align: center; padding: 16px 0 0; font-size: 1rem; }
.foot a { color: var(--primary); font-weight: 700; text-decoration: none; }

.tabs {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid var(--line);
  box-shadow: 0 -6px 24px rgba(30, 27, 58, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 20;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px 8px;
  text-decoration: none;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 600;
  position: relative;
}
.tab.on { color: var(--primary); }
.tab.on::before {
  content: '';
  position: absolute;
  top: 0; left: 28%; right: 28%;
  height: 4px;
  border-radius: 0 0 4px 4px;
  background: linear-gradient(90deg, var(--primary), var(--primary-2));
}
</style>
