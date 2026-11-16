import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as Tone from 'tone'

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

// Events that let a page start audio. A touch only counts when it ends (and
// iOS has enforced that since iOS 9), so a touchstart alone may not be
// enough to unlock audio.
const unlockEvents = ['touchend', 'pointerup', 'click', 'keydown'] as const

const stoppedError = 'Error: The audio was stopped by something.'

/**
 * A single monophonic ocarina voice: sine synth → reverb → vibrato.
 *
 * Browsers only allow audio to start from a user gesture, so call `start()`
 * synchronously from every pointer/key handler, before playing.
 */
export const useAudioStore = defineStore('audio', () => {
  // Empty until the first gesture creates the audio context.
  const contextState = ref<AudioContextState | ''>('')
  const error = ref('')

  let voice: Tone.Synth | undefined
  let hasRun = false

  const status = computed<AudioStatus>(() => {
    if (error.value) return 'bad'
    if (contextState.value === 'running') return 'good'
    return null
  })

  function init() {
    const context = Tone.getContext()
    contextState.value = context.state
    // Track the real state, so the status reflects iOS interruptions (calls,
    // backgrounding) rather than whatever it was at the last note.
    context.on('statechange', (state: AudioContextState) => {
      contextState.value = state
      if (state === 'running') {
        hasRun = true
        if (error.value === stoppedError) error.value = ''
      }
    })
    // Nodes can be built while the context is suspended: notes played before
    // it runs are heard as soon as it does.
    voice = createVoice()
    for (const type of unlockEvents) {
      document.addEventListener(type, unlock, { capture: true, passive: true })
    }
  }

  // Ask to start audio on every gesture until it runs. Don't wait on an
  // earlier attempt: WebKit can leave a resume() from a gesture it didn't
  // accept pending forever, rather than rejecting it.
  function unlock() {
    if (Tone.getContext().state === 'running') return
    if (hasRun) {
      error.value = stoppedError
    }
    Tone.start().catch((e: unknown) => {
      error.value = String(e)
    })
  }

  function start() {
    if (!voice) init()
    unlock()
  }

  function play(note: string) {
    if (!voice) return
    try {
      voice.triggerAttack(note)
      error.value = ''
    } catch (e) {
      error.value = String(e)
    }
  }

  function stop() {
    voice?.triggerRelease()
  }

  return { contextState, error, status, start, play, stop }
})
