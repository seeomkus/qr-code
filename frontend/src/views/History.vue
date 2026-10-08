<script setup lang="ts">
import { onMounted, ref } from 'vue';
import QRCode from 'qrcode';
import { mdiQrcode, mdiQrcodeScan, mdiDelete, mdiChevronDown, mdiChevronUp, mdiInbox } from '@mdi/js';
import Icon from '../components/Icon.vue';
import ScanInfo from '../components/ScanInfo.vue';
import { api, fmtDate, type QrRecord, type ScanRecord } from '../api';
import { parsePayload, typeInfo } from '../payload';

const tab = ref<'qr' | 'scan'>('qr');
const qrs = ref<QrRecord[]>([]);
const scans = ref<ScanRecord[]>([]);
const open = ref('');
const qrImg = ref('');
const error = ref('');

async function load() {
  try {
    [qrs.value, scans.value] = await Promise.all([api.listQr(), api.listScans()]);
  } catch (e) {
    error.value = (e as Error).message;
  }
}
onMounted(load);

async function toggle(key: string, content: string, withQr: boolean) {
  if (open.value === key) {
    open.value = '';
    return;
  }
  open.value = key;
  qrImg.value = withQr ? await QRCode.toDataURL(content, { width: 300, margin: 2 }) : '';
}

async function removeQr(id: number) {
  if (!confirm('Hapus QR Code ini?')) return;
  await api.deleteQr(id);
  open.value = '';
  load();
}
async function removeScan(id: number) {
  if (!confirm('Hapus riwayat scan ini?')) return;
  await api.deleteScan(id);
  open.value = '';
  load();
}
const summary = (c: string) => parsePayload(c).rows[0]?.value || c;
</script>

<template>
  <h1>Riwayat</h1>
  <p v-if="error" class="alert">{{ error }}</p>

  <div class="seg">
    <button :class="{ on: tab === 'qr' }" @click="tab = 'qr'; open = ''">
      <Icon :path="mdiQrcode" color="#6366f1" :size="24" /> QR Dibuat ({{ qrs.length }})
    </button>
    <button :class="{ on: tab === 'scan' }" @click="tab = 'scan'; open = ''">
      <Icon :path="mdiQrcodeScan" color="#10b981" :size="24" /> Hasil Scan ({{ scans.length }})
    </button>
  </div>

  <template v-if="tab === 'qr'">
    <div v-if="!qrs.length" class="card empty">
      <Icon :path="mdiInbox" color="#94a3b8" :size="48" />
      <p class="muted">Belum ada QR Code yang dibuat.</p>
    </div>
    <div v-for="q in qrs" :key="q.id" class="card item">
      <div class="row click" @click="toggle('q' + q.id, q.content, true)">
        <Icon :path="typeInfo(q.type).icon" :color="typeInfo(q.type).color" :size="26" badge />
        <div class="grow">
          <strong class="ellipsis" style="display: block">{{ q.title }}</strong>
          <span class="muted small">{{ fmtDate(q.created_at) }}</span>
        </div>
        <Icon :path="open === 'q' + q.id ? mdiChevronUp : mdiChevronDown" color="#64748b" :size="28" />
      </div>
      <div v-if="open === 'q' + q.id" class="detail">
        <div class="qrbox"><img :src="qrImg" alt="QR Code" /></div>
        <ScanInfo :content="q.content" />
        <div class="btn-row">
          <button class="btn red" @click="removeQr(q.id)">
            <Icon :path="mdiDelete" color="#b91c1c" :size="22" /> Hapus
          </button>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <div v-if="!scans.length" class="card empty">
      <Icon :path="mdiInbox" color="#94a3b8" :size="48" />
      <p class="muted">Belum ada hasil scan.</p>
    </div>
    <div v-for="s in scans" :key="s.id" class="card item">
      <div class="row click" @click="toggle('s' + s.id, s.content, false)">
        <Icon :path="typeInfo(parsePayload(s.content).type).icon" :color="typeInfo(parsePayload(s.content).type).color" :size="26" badge />
        <div class="grow">
          <strong class="ellipsis" style="display: block">{{ s.qr_title || summary(s.content) }}</strong>
          <span class="muted small">{{ fmtDate(s.scanned_at) }}</span>
        </div>
        <Icon :path="open === 's' + s.id ? mdiChevronUp : mdiChevronDown" color="#64748b" :size="28" />
      </div>
      <div v-if="open === 's' + s.id" class="detail">
        <ScanInfo :content="s.content" />
        <div class="btn-row">
          <button class="btn red" @click="removeScan(s.id)">
            <Icon :path="mdiDelete" color="#b91c1c" :size="22" /> Hapus
          </button>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.seg { display: flex; gap: 8px; margin-bottom: 16px; }
.seg button {
  flex: 1; font: inherit; font-weight: 700; font-size: 0.95rem;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 12px 6px; border-radius: 14px; border: 2px solid transparent;
  background: #fff; color: var(--muted); cursor: pointer; box-shadow: var(--shadow);
}
.seg button.on { border-color: var(--primary); color: var(--primary); background: #eef0ff; }
.item { padding: 14px 16px; margin-bottom: 12px; }
.click { cursor: pointer; }
.small { font-size: 0.9rem; }
.detail { border-top: 1px solid var(--line); margin-top: 12px; padding-top: 12px; }
.qrbox { text-align: center; }
.qrbox img { max-width: 240px; width: 100%; border-radius: 12px; border: 1px solid var(--line); }
.empty { text-align: center; padding: 36px 20px; }
</style>
