<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import jsQR from 'jsqr';
import {
  mdiCamera, mdiCameraSwitch, mdiStop, mdiAlertCircle, mdiCheckCircle, mdiImage, mdiRefresh, mdiQrcodeScan,
} from '@mdi/js';
import Icon from '../components/Icon.vue';
import ScanInfo from '../components/ScanInfo.vue';
import { api, fmtDate, type QrRecord } from '../api';

const video = ref<HTMLVideoElement | null>(null);
const canvas = document.createElement('canvas');
const active = ref(false);
const error = ref('');
const found = ref<{ content: string; qr: QrRecord | null } | null>(null);
const facing = ref<'environment' | 'user'>('environment');
let stream: MediaStream | null = null;
let raf = 0;

const secure = window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

function stop() {
  cancelAnimationFrame(raf);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  active.value = false;
}

async function start() {
  error.value = '';
  found.value = null;
  if (!secure) {
    error.value = 'Kamera hanya bisa dipakai lewat alamat HTTPS atau localhost. Buka aplikasi dengan https://...';
    return;
  }
  try {
    stop();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing.value }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    active.value = true;
    await new Promise((r) => setTimeout(r)); // tunggu <video> tampil
    const v = video.value!;
    v.srcObject = stream;
    await v.play();
    loop();
  } catch (e) {
    stop();
    const n = (e as DOMException).name;
    error.value =
      n === 'NotAllowedError'
        ? 'Izin kamera ditolak. Klik ikon gembok di address bar Chrome, izinkan Kamera, lalu coba lagi.'
        : n === 'NotFoundError'
          ? 'Kamera tidak ditemukan pada perangkat ini.'
          : n === 'NotReadableError'
            ? 'Kamera sedang dipakai aplikasi lain.'
            : 'Gagal membuka kamera: ' + (e as Error).message;
  }
}

function loop() {
  const v = video.value;
  if (!v || !stream) return;
  if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
    const scale = Math.min(1, 640 / v.videoWidth);
    canvas.width = v.videoWidth * scale;
    canvas.height = v.videoHeight * scale;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code?.data) {
      handle(code.data);
      return;
    }
  }
  raf = requestAnimationFrame(loop);
}

async function handle(content: string) {
  stop();
  if (navigator.vibrate) navigator.vibrate(120);
  try {
    found.value = { content, qr: (await api.saveScan(content)).qr };
  } catch (e) {
    found.value = { content, qr: null };
    error.value = 'Hasil scan tampil, tetapi gagal disimpan: ' + (e as Error).message;
  }
}

function switchCam() {
  facing.value = facing.value === 'environment' ? 'user' : 'environment';
  start();
}

function fromFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = '';
  if (!file) return;
  error.value = '';
  const img = new Image();
  img.onload = () => {
    const max = 1200;
    const s = Math.min(1, max / Math.max(img.width, img.height));
    canvas.width = img.width * s;
    canvas.height = img.height * s;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(d.data, d.width, d.height);
    URL.revokeObjectURL(img.src);
    if (code?.data) handle(code.data);
    else error.value = 'QR Code tidak terbaca pada gambar tersebut.';
  };
  img.src = URL.createObjectURL(file);
}

onBeforeUnmount(stop);
</script>

<template>
  <h1>Scan QR Code</h1>
  <p class="muted">Arahkan kamera ke QR Code, hasilnya tampil otomatis.</p>

  <div v-if="error" class="alert">
    <Icon :path="mdiAlertCircle" color="#ef4444" :size="26" />
    <span>{{ error }}</span>
  </div>

  <div v-if="!found" class="card">
    <div v-if="active" class="cam">
      <video ref="video" playsinline muted></video>
      <div class="frame"><i></i><i></i><i></i><i></i><div class="line"></div></div>
    </div>
    <div v-else class="idle">
      <Icon :path="mdiQrcodeScan" color="#10b981" :size="56" badge />
      <p class="muted">Kamera belum aktif</p>
    </div>

    <div class="btn-row">
      <button v-if="!active" class="btn green" @click="start">
        <svg width="24" height="24" viewBox="0 0 24 24"><path :d="mdiCamera" fill="#fff" /></svg>
        Mulai Scan
      </button>
      <template v-else>
        <button class="btn light" @click="switchCam">
          <Icon :path="mdiCameraSwitch" color="#4f46e5" :size="24" />
          Ganti Kamera
        </button>
        <button class="btn red" @click="stop">
          <Icon :path="mdiStop" color="#b91c1c" :size="24" />
          Berhenti
        </button>
      </template>
      <label class="btn light file">
        <Icon :path="mdiImage" color="#ec4899" :size="24" />
        Dari Gambar
        <input type="file" accept="image/*" hidden @change="fromFile" />
      </label>
    </div>
  </div>

  <div v-else class="card">
    <div class="alert ok">
      <Icon :path="mdiCheckCircle" color="#10b981" :size="26" />
      <span>QR Code berhasil dibaca &amp; disimpan ke riwayat.</span>
    </div>

    <div v-if="found.qr" class="match">
      <strong>Dikenali dari QR yang dibuat di aplikasi ini</strong>
      <div>Judul: <b>{{ found.qr.title }}</b></div>
      <div class="muted">Dibuat: {{ fmtDate(found.qr.created_at) }}</div>
    </div>

    <ScanInfo :content="found.content" />

    <div class="btn-row">
      <button class="btn" @click="start">
        <svg width="22" height="22" viewBox="0 0 24 24"><path :d="mdiRefresh" fill="#fff" /></svg>
        Scan Lagi
      </button>
    </div>
  </div>
</template>

<style scoped>
.cam { position: relative; border-radius: 18px; overflow: hidden; background: #000; aspect-ratio: 1 / 1; }
.cam video { width: 100%; height: 100%; object-fit: cover; display: block; }
.frame { position: absolute; inset: 14%; pointer-events: none; }
.frame i { position: absolute; width: 36px; height: 36px; border: 5px solid #34d399; }
.frame i:nth-child(1) { top: 0; left: 0; border-right: 0; border-bottom: 0; border-radius: 12px 0 0 0; }
.frame i:nth-child(2) { top: 0; right: 0; border-left: 0; border-bottom: 0; border-radius: 0 12px 0 0; }
.frame i:nth-child(3) { bottom: 0; left: 0; border-right: 0; border-top: 0; border-radius: 0 0 0 12px; }
.frame i:nth-child(4) { bottom: 0; right: 0; border-left: 0; border-top: 0; border-radius: 0 0 12px 0; }
.line {
  position: absolute; left: 6%; right: 6%; height: 3px; border-radius: 2px;
  background: linear-gradient(90deg, transparent, #34d399, transparent);
  box-shadow: 0 0 12px #34d399;
  animation: sweep 2s ease-in-out infinite alternate;
}
@keyframes sweep { from { top: 6%; } to { top: 94%; } }
.idle { text-align: center; padding: 30px 0 10px; }
.file { cursor: pointer; }
.match { background: #eef2ff; border-radius: 14px; padding: 12px 16px; margin-bottom: 14px; }
</style>
