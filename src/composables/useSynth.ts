import { shallowRef } from 'vue'
import * as Tone from 'tone'

export interface UseSynthOptions {
  onPlay?: (contextState: AudioContextState) => void
  onError?: (message: string) => void
}

/**
 * A single monophonic ocarina voice: sine synth → reverb → vibrato.
 *
 * Browsers only allow audio to start from a user gesture, so call `start()`
 * from the first pointer/key handler before playing.
 */
export function useSynth({ onPlay, onError }: UseSynthOptions = {}) {
  const context = Tone.getContext()
  const synth = shallowRef<Tone.Synth>()
  let isStarted = false

  async function setup() {
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
    synth.value = voice
  }

  async function start() {
    if (!isStarted) {
      isStarted = true
      await Tone.start()
      await setup()
      return
    }

    if (context.state !== 'running') {
      onError?.('Error: The audio was stopped by something.')
      Tone.start()
    }
  }

  function play(note: string) {
    if (context.state !== 'running') {
      context.resume()
    }
    if (!synth.value) return
    try {
      synth.value.triggerAttack(note)
      onPlay?.(context.state)
    } catch (error) {
      onError?.(String(error))
    }
  }

  function stop() {
    synth.value?.triggerRelease()
  }

  return { synth, start, play, stop }
}
