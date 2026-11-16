import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type SynthLayout = 'pad' | 'n64'

export interface LayoutOption {
  label: string
  value: SynthLayout
}

export const useUiStore = defineStore('ui', () => {
  const drawerExpanded = ref(false)
  const synthError = ref('')

  const synthLayouts: LayoutOption[] = [
    { label: 'Pad', value: 'pad' },
    { label: 'N64', value: 'n64' },
  ]
  const synthLayout = ref<SynthLayout>('n64')

  const synthLayoutIndex = computed(() =>
    synthLayouts.findIndex((o) => o.value === synthLayout.value)
  )
  const synthLayoutLabel = computed(
    () => synthLayouts[synthLayoutIndex.value]?.label ?? ''
  )

  function cycleSynthLayout() {
    const next = (synthLayoutIndex.value + 1) % synthLayouts.length
    synthLayout.value = synthLayouts[next]!.value
  }

  // Lock page scrolling behind the drawer (see _start.scss).
  watch(drawerExpanded, (value) => {
    document.documentElement.classList.toggle('screen-modal', value)
  })

  return {
    drawerExpanded,
    synthError,
    synthLayouts,
    synthLayout,
    synthLayoutLabel,
    cycleSynthLayout,
  }
})
