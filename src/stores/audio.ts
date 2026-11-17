import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as Tone from 'tone'
import { debugLog } from '@/debug'
import {
  createOcarinaVoice,
  createPlainVoice,
  type Voice,
} from '@/audio/ocarinaVoice'

export type AudioStatus = 'good' | 'bad' | null

function createVoice(): Voice {
  try {
    return createOcarinaVoice()
  } catch (e) {
    console.warn('Couldn’t build the ocarina, playing a plain tone:', e)
    return createPlainVoice()
  }
}

/**
 * A single monophonic ocarina voice (see ocarinaVoice.ts).
 *
 * Follows Tone's documented pattern: call `Tone.start()` from a user-gesture
 * listener, and only play once it has resolved. Browsers decide which
 * gestures count: iOS doesn't count a held press, so the UI also offers a
 * start button while `needsStart` (a button's click always counts).
 */
export const useAudioStore = defineStore('audio', () => {
  const context = Tone.getContext()
  const contextState = ref<AudioContextState>(context.state)
  const error = ref('')
  const hasRun = ref(contextState.value === 'running')

  // Follow the real state, so the UI reflects iOS interruptions (calls,
  // backgrounding) rather than whatever it was at the last note.
  context.on('statechange', (state: AudioContextState) => {
    debugLog('statechange', state)
    contextState.value = state
    if (state === 'running') hasRun.value = true
  })

  let voice: Voice | undefined
  // A note asked for before audio was running, played once it is.
  let pendingNote: string | undefined

  // Tone won't restart the oscillator at the time it last started it, and
  // "now" only moves on in audio blocks (coarser on iOS, and stalled after
  // an interruption), so quick notes can share it. Keep each attack, and
  // each release, strictly after the last attack: a release at the attack's
  // own time finds the envelope still silent and does nothing, leaving the
  // note stuck.
  const minGap = 0.001
  let lastAttackTime = -Infinity
  // Whether a note is sounding (attacked and not yet released)
  let sounding = false
  const afterLastAttack = () => Math.max(Tone.now(), lastAttackTime + minGap)

  const status = computed<AudioStatus>(() => {
    if (error.value) return 'bad'
    if (contextState.value === 'running') return 'good'
    return null
  })

  const isRunning = () => context.state === 'running'
  const needsStart = computed(() => contextState.value !== 'running')

  /** Call from every user-gesture listener. */
  async function start() {
    if (isRunning() && voice) return
    debugLog('Tone.start() from', window.event?.type ?? 'code')
    try {
      await Tone.start()
    } catch (e) {
      debugLog('Tone.start rejected', e)
      error.value = String(e)
      return
    }
    debugLog('Tone.start resolved', context.state)
    voice ??= createVoice()
    contextState.value = context.state
    error.value = ''
    if (pendingNote) play(pendingNote)
  }

  function play(note: string) {
    if (!voice || !isRunning()) {
      pendingNote = note
      return
    }
    pendingNote = undefined
    try {
      const time = afterLastAttack()
      // Moving to another note while one sounds slurs to it, as on an
      // ocarina when only the fingering changes
      const slur = sounding
      if (slur) voice.slideTo(note, time)
      else voice.triggerAttack(note, time)
      sounding = true
      lastAttackTime = time
      debugLog(slur ? 'slide' : 'play', note, time)
    } catch (e) {
      debugLog('play ERROR', note, e)
      error.value = String(e)
    }
  }

  function stop() {
    pendingNote = undefined
    if (!sounding) return
    sounding = false
    voice?.triggerRelease(afterLastAttack())
  }

  return {
    contextState,
    error,
    hasRun,
    needsStart,
    status,
    start,
    play,
    stop,
  }
})
