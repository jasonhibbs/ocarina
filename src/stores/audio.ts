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

/**
 * A single monophonic ocarina voice: sine synth → reverb → vibrato.
 *
 * Browsers only allow audio to start from a user gesture, so call `start()`
 * from the first pointer/key handler before playing.
 */
export const useAudioStore = defineStore('audio', () => {
  // Empty until the first gesture creates the audio context.
  const contextState = ref<AudioContextState | ''>('')
  const error = ref('')
  const isReady = ref(false)

  let voice: Tone.Synth | undefined
  let starting: Promise<void> | undefined

  const status = computed<AudioStatus>(() => {
    if (error.value) return 'bad'
    if (contextState.value === 'running') return 'good'
    return null
  })

  async function setup() {
    const context = Tone.getContext()
    // Track the real state, so the status reflects iOS interruptions (calls,
    // backgrounding) rather than whatever it was at the last note.
    context.on('statechange', (state: AudioContextState) => {
      contextState.value = state
    })
    await Tone.start()
    contextState.value = context.state
    voice = createVoice()
    isReady.value = true
  }

  async function start() {
    if (!starting) {
      starting = setup()
      return starting
    }
    await starting
    if (Tone.getContext().state !== 'running') {
      error.value = 'Error: The audio was stopped by something.'
      Tone.start()
    }
  }

  function play(note: string) {
    if (!voice) return
    const context = Tone.getContext()
    if (context.state !== 'running') {
      context.resume()
    }
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

  return { contextState, error, isReady, status, start, play, stop }
})
