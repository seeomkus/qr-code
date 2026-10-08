<script setup lang="ts">
import { reactive, ref, watch, nextTick } from 'vue';
import QRCode from 'qrcode';
import { mdiQrcode, mdiDownload, mdiAlertCircle, mdiCheckCircle, mdiRefresh } from '@mdi/js';
import Icon from '../components/Icon.vue';
import { api } from '../api';
import { TYPES, typeInfo, buildPayload } from '../payload';

const type = ref('text');
const title = ref('');
const f = reactive<Record<string, string>>({ security: 'WPA' });
const error = ref('');
const busy = ref(false);
const result = ref<{ content: string; title: string } | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

watch(type, () => {
  error.value = '';
});

const required: Record<string, string[]> = {
  text: ['text'], url: ['url'], phone: ['phone'], sms: ['phone'], email: ['email'], wifi: ['ssid'],
};

async function generate() {
  error.value = '';
  if (!title.value.trim()) return (error.value = 'Judul wajib diisi.');
  if (required[type.value].some((k) => !(f[k] || '').trim())) return (error.value = 'Lengkapi data yang wajib diisi.');
  const content = buildPayload(type.value, f);
  if (content.length > 1800) return (error.value = 'Data terlalu panjang untuk QR Code.');
  busy.value = true;
  try {
    await api.createQr({ title: title.value, type: type.value, content });
    result.value = { content, title: title.value };
    await nextTick();
    await QRCode.toCanvas(canvas.value!, content, { width: 320, margin: 2, errorCorrectionLevel: 'M' });
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}

function download() {
  const a = document.createElement('a');
  a.href = canvas.value!.toDataURL('image/png');
  a.download = (result.value!.title.replace(/[^\w-]+/g, '_') || 'qrcode') + '.png';
  a.click();
}

function reset() {
  result.value = null;
  title.value = '';
  for (const k of Object.keys(f)) if (k !== 'security') f[k] = '';
}
</script>

<template>
  <h1>Buat QR Code</h1>
  <p class="muted">Pilih jenis data, isi, lalu buat QR Code.</p>

  <div class="two">
    <div class="card">
      <div class="types">
        <button
          v-for="t in TYPES"
          :key="t.key"
          class="type"
          :class="{ on: type === t.key }"
          :style="type === t.key ? { borderColor: t.color, background: t.color + '18' } : {}"
          @click="type = t.key"
        >
          <Icon :path="t.icon" :color="t.color" :size="28" />
          <span>{{ t.label }}</span>
        </button>
      </div>

      <label for="title">Judul / Nama</label>
      <input id="title" v-model="title" maxlength="100" placeholder="Contoh: Menu Kafe, WiFi Kantor" />

      <template v-if="type === 'text'">
        <label for="text">Teks</label>
        <textarea id="text" v-model="f.text" placeholder="Tulis teks atau data apa saja"></textarea>
      </template>
      <template v-else-if="type === 'url'">
        <label for="url">Alamat Web</label>
        <input id="url" v-model="f.url" inputmode="url" placeholder="www.seeomkus.com" />
      </template>
      <template v-else-if="type === 'phone'">
        <label for="phone">Nomor Telepon</label>
        <input id="phone" v-model="f.phone" inputmode="tel" placeholder="08123456789" />
      </template>
      <template v-else-if="type === 'sms'">
        <label for="phone">Nomor Tujuan</label>
        <input id="phone" v-model="f.phone" inputmode="tel" placeholder="08123456789" />
        <label for="msg">Pesan</label>
        <textarea id="msg" v-model="f.message" placeholder="Isi pesan SMS"></textarea>
      </template>
      <template v-else-if="type === 'email'">
        <label for="email">Alamat Email</label>
        <input id="email" v-model="f.email" type="email" placeholder="nama@email.com" />
        <label for="subject">Subjek (opsional)</label>
        <input id="subject" v-model="f.subject" />
        <label for="body">Isi Pesan (opsional)</label>
        <textarea id="body" v-model="f.body"></textarea>
      </template>
      <template v-else-if="type === 'wifi'">
        <label for="ssid">Nama WiFi (SSID)</label>
        <input id="ssid" v-model="f.ssid" />
        <label for="sec">Keamanan</label>
        <select id="sec" v-model="f.security">
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">Tanpa password</option>
        </select>
        <template v-if="f.security !== 'nopass'">
          <label for="pass">Password</label>
          <input id="pass" v-model="f.password" />
        </template>
      </template>

      <div v-if="error" class="alert" style="margin-top: 16px">
        <Icon :path="mdiAlertCircle" color="#ef4444" :size="26" />
        <span>{{ error }}</span>
      </div>

      <div class="btn-row">
        <button class="btn block" :disabled="busy" @click="generate">
          <svg width="24" height="24" viewBox="0 0 24 24"><path :d="mdiQrcode" fill="#fff" /></svg>
          {{ busy ? 'Memproses...' : 'Buat QR Code' }}
        </button>
      </div>
    </div>

    <div v-if="result" class="card result">
      <div class="alert ok">
        <Icon :path="mdiCheckCircle" color="#10b981" :size="26" />
        <span>QR Code berhasil dibuat &amp; disimpan.</span>
      </div>
      <h2>{{ result.title }}</h2>
      <div class="qrbox"><canvas ref="canvas"></canvas></div>
      <p class="muted break small">{{ typeInfo(type).label }}: {{ result.content }}</p>
      <div class="btn-row">
        <button class="btn green" @click="download">
          <svg width="22" height="22" viewBox="0 0 24 24"><path :d="mdiDownload" fill="#fff" /></svg>
          Unduh PNG
        </button>
        <button class="btn light" @click="reset">
          <Icon :path="mdiRefresh" color="#4f46e5" :size="22" />
          Buat Baru
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.type {
  font: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px;
  border: 2px solid var(--line);
  background: #fff;
  border-radius: 16px;
  cursor: pointer;
  color: var(--text);
}
.qrbox { display: flex; justify-content: center; padding: 8px 0 12px; }
canvas { max-width: 100%; height: auto !important; border-radius: 12px; border: 1px solid var(--line); }
.small { font-size: 0.95rem; }
</style>
