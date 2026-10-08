<script setup lang="ts">
import { computed, ref } from 'vue';
import { mdiContentCopy, mdiOpenInNew, mdiCheckCircle } from '@mdi/js';
import Icon from './Icon.vue';
import { parsePayload, typeInfo } from '../payload';

const props = defineProps<{ content: string }>();
const parsed = computed(() => parsePayload(props.content));
const info = computed(() => typeInfo(parsed.value.type));
const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(props.content);
  } catch {
    const t = document.createElement('textarea');
    t.value = props.content;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 1800);
}
</script>

<template>
  <div>
    <div class="row head">
      <Icon :path="info.icon" :color="info.color" :size="26" badge />
      <span class="chip" :style="{ background: info.color + '22', color: info.color }">{{ info.label }}</span>
    </div>
    <dl>
      <div v-for="r in parsed.rows" :key="r.label" class="item">
        <dt>{{ r.label }}</dt>
        <dd class="break">{{ r.value || '-' }}</dd>
      </div>
    </dl>
    <div class="btn-row">
      <a v-if="parsed.link" :href="parsed.link" target="_blank" rel="noopener" class="btn green">
        <svg width="22" height="22" viewBox="0 0 24 24"><path :d="mdiOpenInNew" fill="#fff" /></svg>
        Buka
      </a>
      <button class="btn light" @click="copy">
        <Icon :path="copied ? mdiCheckCircle : mdiContentCopy" :color="copied ? '#10b981' : '#4f46e5'" :size="22" />
        {{ copied ? 'Tersalin' : 'Salin' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.head { margin-bottom: 8px; }
dl { margin: 0; }
.item { padding: 10px 0; border-bottom: 1px solid var(--line); }
.item:last-child { border: 0; }
dt { font-size: 0.9rem; color: var(--muted); font-weight: 600; }
dd { margin: 2px 0 0; font-size: 1.15rem; font-weight: 600; }
</style>
