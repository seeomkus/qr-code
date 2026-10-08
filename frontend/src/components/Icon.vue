<script setup lang="ts">
withDefaults(defineProps<{ path: string; color?: string; size?: number; badge?: boolean; solid?: boolean }>(), {
  color: '#4f46e5',
  size: 28,
  badge: false,
  solid: false,
});
</script>

<template>
  <span
    v-if="badge"
    class="icon-badge"
    :style="{
      width: size * 1.8 + 'px',
      height: size * 1.8 + 'px',
      background: solid ? `linear-gradient(135deg, ${color}, ${color}cc)` : color + '22',
    }"
  >
    <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
      <path :d="path" :fill="solid ? '#fff' : color" />
    </svg>
  </span>
  <svg v-else :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" class="icon">
    <path :d="path" :fill="color" />
  </svg>
</template>
