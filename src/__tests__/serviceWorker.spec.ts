import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from '../serviceWorker'

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', {
    value: hidden,
    configurable: true,
  })
  Object.defineProperty(document, 'visibilityState', {
    value: hidden ? 'hidden' : 'visible',
    configurable: true,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('registerServiceWorker', () => {
  let sw: EventTarget & { controller: object | null; register: unknown }
  let registration: { update: ReturnType<typeof vi.fn> }
  let reload: ReturnType<typeof vi.fn>
  let playing: boolean

  beforeEach(() => {
    vi.stubEnv('DEV', false)
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    })
    registration = { update: vi.fn() }
    sw = Object.assign(new EventTarget(), {
      controller: {} as object | null,
      register: vi.fn(async () => registration),
    })
    vi.stubGlobal('navigator', { serviceWorker: sw })
    reload = vi.fn()
    vi.stubGlobal('location', { reload })
    playing = false
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const register = () => registerServiceWorker({ canReloadNow: () => !playing })
  const takeOver = () => sw.dispatchEvent(new Event('controllerchange'))

  it('registers the worker', () => {
    register()
    expect(sw.register).toHaveBeenCalledWith('/serviceWorker.js')
  })

  it('doesn’t reload when the first version installs', () => {
    sw.controller = null
    register()
    takeOver()
    expect(reload).not.toHaveBeenCalled()
  })

  it('switches to a new version straight away when nobody’s playing', () => {
    register()
    takeOver()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('waits until the app is hidden when someone’s playing', () => {
    playing = true
    register()
    takeOver()
    expect(reload).not.toHaveBeenCalled()
    setHidden(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('switches straight away if the app is already hidden', () => {
    playing = true
    register()
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    })
    takeOver()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('checks for a new version when the app comes back', async () => {
    register()
    await vi.waitFor(() => expect(sw.register).toHaveBeenCalled())
    await Promise.resolve()
    setHidden(true)
    setHidden(false)
    expect(registration.update).toHaveBeenCalled()
  })

  it('does nothing in development', () => {
    vi.stubEnv('DEV', true)
    register()
    expect(sw.register).not.toHaveBeenCalled()
  })
})
