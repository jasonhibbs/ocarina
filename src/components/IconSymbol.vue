<script setup lang="ts">
import { computed } from 'vue'

// SF Symbols exported as SVG, inlined at build time so they inherit
// `currentColor` and work offline without a fetch.
const files = import.meta.glob<string>('@/assets/symbols/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const symbols = Object.fromEntries(
  Object.entries(files).map(([path, raw]) => {
    const name = path
      .split('/')
      .pop()!
      .replace(/\.svg$/, '')
    const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 0 0'
    const inner = raw.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '')
    return [name, { viewBox, inner }]
  })
)

const props = defineProps<{ name: string }>()

const symbol = computed(() => symbols[props.name])
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- trusted local assets -->
  <svg
    v-if="symbol"
    class="symbol"
    :viewBox="symbol.viewBox"
    fill-rule="evenodd"
    clip-rule="evenodd"
    stroke-linejoin="round"
    stroke-miterlimit="2"
    aria-hidden="true"
    v-html="symbol.inner"
  />
</template>
