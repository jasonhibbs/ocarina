import { vi } from 'vitest'

type Listener = (state: AudioContextState) => void

/**
 * A stand-in for Tone: an audio context whose state tests control, and a
 * voice that records what it's asked to play.
 */
export function createTone() {
  const listeners: Listener[] = []
  const context = {
    state: 'suspended' as AudioContextState,
    on: (_event: string, listener: Listener) => listeners.push(listener),
    setState(state: AudioContextState) {
      this.state = state
      listeners.forEach((l) => l(state))
    },
    reset() {
      this.state = 'suspended'
      listeners.length = 0
    },
  }
  const voice = {
    triggerAttack: vi.fn((note: string) => void note),
    triggerRelease: vi.fn(),
    chain: () => {},
    toDestination: () => {},
  }
  // Like a resume() from a gesture the browser accepted.
  const startNow = async () => context.setState('running')
  // Like WebKit with a gesture it didn't accept: the promise never settles.
  const neverStarts = () => new Promise<void>(() => {})
  const start = vi.fn(startNow)
  return { context, voice, start, startNow, neverStarts }
}

export type ToneStub = ReturnType<typeof createTone>

/** The 'tone' module, backed by a stub: `vi.mock('tone', …)` */
export function createToneModule(tone: ToneStub) {
  return {
    getContext: () => tone.context,
    getDestination: () => ({}),
    start: () => tone.start(),
    Synth: vi.fn(function () {
      return tone.voice
    }),
    Reverb: vi.fn(),
    Vibrato: vi.fn(),
    Frequency: (note: string) => ({
      toFrequency: () => 440,
      toMidi: () => note.length,
    }),
    version: 'test',
  }
}
