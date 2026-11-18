import { reactive } from 'vue'
import { getContext, version as toneVersion } from 'tone'

// On-screen diagnostics for devices without a console: open the app with
// ?debug in the URL.

export const debugEnabled = new URLSearchParams(location.search).has('debug')

export const debugLines = reactive<string[]>([])

const t0 = performance.now()

export function debugLog(...parts: unknown[]) {
  if (!debugEnabled) return
  const time = ((performance.now() - t0) / 1000).toFixed(2).padStart(6)
  debugLines.push(`${time} ${parts.map(String).join(' ')}`)
  if (debugLines.length > 200) debugLines.shift()
}

function rawContextState() {
  try {
    return getContext().state
  } catch {
    return 'none'
  }
}

if (debugEnabled) {
  debugLog('ua', navigator.userAgent)
  debugLog('tone', toneVersion)
  debugLog(
    'standalone',
    matchMedia('(display-mode: standalone)').matches,
    'audioSession' in navigator
      ? `audioSession=${(navigator as { audioSession?: { type: string } }).audioSession?.type}`
      : 'no audioSession'
  )
  // How much of the top the status bar covers: 0 when iOS keeps the app
  // below it, as it should
  const logSafeArea = (when: string) => {
    const probe = document.createElement('div')
    probe.style.paddingTop = 'env(safe-area-inset-top)'
    document.body.append(probe)
    debugLog('safe-area-inset-top', when, getComputedStyle(probe).paddingTop)
    probe.remove()
  }
  logSafeArea('load')
  addEventListener('resize', () => logSafeArea('resize'))
  addEventListener('pageshow', () => logSafeArea('pageshow'))
  for (const type of [
    'touchstart',
    'touchend',
    'pointerdown',
    'pointerup',
    'mousedown',
    'click',
    'keydown',
  ]) {
    document.addEventListener(
      type,
      () =>
        debugLog(
          'event',
          type,
          `activation=${navigator.userActivation?.isActive ?? '?'}`
        ),
      { capture: true, passive: true }
    )
  }
  addEventListener('load', () =>
    setTimeout(() => debugLog('context after load', rawContextState()), 0)
  )
  addEventListener('error', (e) => debugLog('ERROR', e.message))
  addEventListener('unhandledrejection', (e) => debugLog('REJECTION', e.reason))
  document.addEventListener('visibilitychange', () =>
    debugLog('visibility', document.visibilityState, rawContextState())
  )
}

// A beep through a brand-new AudioContext, bypassing Tone, to tell device
// problems (silent switch, volume) from app problems.
export function rawBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new Ctx()
    debugLog('beep ctx created', ctx.state)
    ctx.resume().then(
      () => debugLog('beep resume resolved', ctx.state),
      (e) => debugLog('beep resume rejected', e)
    )
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    gain.gain.value = 0.3
    osc.frequency.value = 523.25
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    setTimeout(() => debugLog('beep after 0.5s', ctx.state), 500)
  } catch (e) {
    debugLog('beep ERROR', e)
  }
}

export function copyDebugLog() {
  navigator.clipboard.writeText(debugLines.join('\n')).then(
    () => debugLog('log copied'),
    (e) => debugLog('copy failed', e)
  )
}
