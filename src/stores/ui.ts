import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export type SynthLayout = 'pad' | 'n64' | 'switch2'

export interface LayoutOption {
  label: string
  value: SynthLayout
}

export const synthLayouts: readonly LayoutOption[] = [
  { label: 'Pad', value: 'pad' },
  { label: 'N64', value: 'n64' },
  { label: 'Switch 2', value: 'switch2' },
]

const defaultSynthLayout: SynthLayout = 'n64'

const isSynthLayout = (value: unknown): value is SynthLayout =>
  synthLayouts.some((o) => o.value === value)

export const useUiStore = defineStore('ui', () => {
  const drawerExpanded = ref(false)

  // Remembered between launches. Anything unrecognised in storage (an old or
  // hand-edited value) falls back to the default.
  const storedSynthLayout = useLocalStorage<string>(
    'ocarina.synthLayout',
    defaultSynthLayout
  )
  const synthLayout = computed<SynthLayout>({
    get: () =>
      isSynthLayout(storedSynthLayout.value)
        ? storedSynthLayout.value
        : defaultSynthLayout,
    set: (value) => {
      storedSynthLayout.value = value
    },
  })

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
    synthLayout,
    synthLayoutLabel,
    cycleSynthLayout,
  }
})
