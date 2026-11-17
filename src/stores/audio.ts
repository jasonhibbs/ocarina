import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as Tone from 'tone'
import { debugLog } from '@/debug'

export type AudioStatus = 'good' | 'bad' | null

function createVoice() {
  const voice = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.2,
      attackCurve: 'linear',
      decay: 0.8,
      sustain: 0.8,
      release: 0.8,
    },
  })
  try {
    const reverb = new Tone.Reverb({ decay: 0.6, wet: 0.6 })
    const vibrato = new Tone.Vibrato(5, 0.1666)
    voice.chain(reverb, vibrato, Tone.getDestination())
  } catch (e) {
    console.warn('Couldn’t add reverb or vibrato:', e)
    voice.toDestination()
  }
  return voice
}

/**
 * A single monophonic ocarina voice: sine synth → reverb → vibrato.
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

  let voice: Tone.Synth | undefined
  // A note asked for before audio was running, played once it is.
  let pendingNote: string | undefined

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
      voice.triggerAttack(note)
      debugLog('play', note)
    } catch (e) {
      debugLog('play ERROR', note, e)
      error.value = String(e)
    }
  }

  function stop() {
    pendingNote = undefined
    voice?.triggerRelease()
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
