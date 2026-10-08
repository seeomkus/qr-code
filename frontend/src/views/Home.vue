<script setup lang="ts">
import { mdiQrcode, mdiQrcodeScan, mdiHistory, mdiCellphoneLock, mdiCamera, mdiDatabase } from '@mdi/js';
import Icon from '../components/Icon.vue';

const features = [
  { icon: mdiCamera, color: '#ef4444', text: 'Scan memakai kamera HP maupun webcam laptop/PC' },
  { icon: mdiDatabase, color: '#0ea5e9', text: 'Data QR dan hasil scan tersimpan di database' },
  { icon: mdiCellphoneLock, color: '#10b981', text: 'Tanpa login, langsung pakai dari browser' },
];
</script>

<template>
  <section class="hero">
    <h1>Selamat datang 👋</h1>
    <p>Buat QR Code dari data Anda, dan scan QR Code untuk melihat informasinya.</p>
  </section>

  <div class="two">
    <router-link to="/buat" class="card action">
      <Icon :path="mdiQrcode" color="#6366f1" :size="40" badge solid />
      <div class="grow">
        <h2>Buat QR Code</h2>
        <p class="muted">Masukkan teks, link, telepon, email, atau WiFi.</p>
      </div>
    </router-link>

    <router-link to="/scan" class="card action">
      <Icon :path="mdiQrcodeScan" color="#10b981" :size="40" badge solid />
      <div class="grow">
        <h2>Scan QR Code</h2>
        <p class="muted">Arahkan kamera, informasi langsung tampil.</p>
      </div>
    </router-link>
  </div>

  <router-link to="/riwayat" class="card action">
    <Icon :path="mdiHistory" color="#ec4899" :size="40" badge solid />
    <div class="grow">
      <h2>Riwayat</h2>
      <p class="muted">Lihat QR yang pernah dibuat dan hasil scan.</p>
    </div>
  </router-link>

  <div class="card">
    <h2>Keunggulan</h2>
    <div v-for="f in features" :key="f.text" class="row feat">
      <Icon :path="f.icon" :color="f.color" :size="26" badge />
      <span class="grow">{{ f.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.hero { padding: 6px 4px 14px; }
.action { display: flex; align-items: center; gap: 16px; text-decoration: none; color: inherit; transition: transform 0.12s; }
.action:active { transform: scale(0.98); }
.action h2, .action p { margin-bottom: 2px; }
.feat { padding: 8px 0; }
</style>
