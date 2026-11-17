import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useUiStore } from '../ui'

const storageKey = 'ocarina.synthLayout'

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults to the N64 layout', () => {
    const ui = useUiStore()
    expect(ui.synthLayout).toBe('n64')
    expect(ui.synthLayoutLabel).toBe('N64')
  })

  it('cycles through the layouts and wraps around', () => {
    const ui = useUiStore()
    ui.cycleSynthLayout()
    expect(ui.synthLayout).toBe('switch2')
    expect(ui.synthLayoutLabel).toBe('Switch 2')
    ui.cycleSynthLayout()
    expect(ui.synthLayout).toBe('pad')
    expect(ui.synthLayoutLabel).toBe('Pad')
    ui.cycleSynthLayout()
    expect(ui.synthLayout).toBe('n64')
  })

  it('remembers the layout between launches', async () => {
    useUiStore().synthLayout = 'pad'
    await nextTick()
    expect(localStorage.getItem(storageKey)).toBe('pad')

    setActivePinia(createPinia())
    expect(useUiStore().synthLayout).toBe('pad')
  })

  it('falls back to the default for an unknown stored layout', () => {
    localStorage.setItem(storageKey, 'ps5')
    expect(useUiStore().synthLayout).toBe('n64')
  })

  it('locks page scrolling while the drawer is open', async () => {
    const ui = useUiStore()
    ui.drawerExpanded = true
    await nextTick()
    expect(document.documentElement.classList).toContain('screen-modal')
    ui.drawerExpanded = false
    await nextTick()
    expect(document.documentElement.classList).not.toContain('screen-modal')
  })
})
