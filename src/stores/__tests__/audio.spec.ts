import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAudioStore } from '../audio'

// A stand-in for Tone: an audio context whose state the tests control, and a
// voice that records what it's asked to play.
const tone = vi.hoisted(() => {
  type Listener = (state: AudioContextState) => void
  const listeners: Listener[] = []
  const context = {
    state: 'suspended' as AudioContextState,
    on: (_event: string, listener: Listener) => listeners.push(listener),
    resume: () => {},
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
    triggerAttack: (note: string) => void note,
    triggerRelease: () => {},
    chain: () => {},
    toDestination: () => {},
  }
  return { context, voice }
})

vi.mock('tone', () => ({
  getContext: () => tone.context,
  getDestination: () => ({}),
  start: vi.fn(async () => tone.context.setState('running')),
  Synth: vi.fn(function () {
    return tone.voice
  }),
  Reverb: vi.fn(),
  Vibrato: vi.fn(),
}))

describe('audio store', () => {
  beforeEach(() => {
    tone.context.reset()
    vi.restoreAllMocks()
    setActivePinia(createPinia())
  })

  it('has no status until the first gesture', () => {
    const audio = useAudioStore()
    expect(audio.isReady).toBe(false)
    expect(audio.status).toBeNull()
  })

  it('starts the context and creates the voice on the first gesture', async () => {
    const audio = useAudioStore()
    await audio.start()
    expect(audio.isReady).toBe(true)
    expect(audio.contextState).toBe('running')
    expect(audio.status).toBe('good')
  })

  it('shares one setup between overlapping gestures', async () => {
    const { start } = await import('tone')
    const audio = useAudioStore()
    await Promise.all([audio.start(), audio.start()])
    expect(start).toHaveBeenCalledTimes(1)
    expect(audio.error).toBe('')
  })

  it('ignores notes until the voice is ready', () => {
    const attack = vi.spyOn(tone.voice, 'triggerAttack')
    useAudioStore().play('C5')
    expect(attack).not.toHaveBeenCalled()
  })

  it('plays and releases notes', async () => {
    const attack = vi.spyOn(tone.voice, 'triggerAttack')
    const release = vi.spyOn(tone.voice, 'triggerRelease')
    const audio = useAudioStore()
    await audio.start()
    audio.play('C5')
    audio.stop()
    expect(attack).toHaveBeenCalledWith('C5')
    expect(release).toHaveBeenCalled()
  })

  it('follows the context when the system interrupts it', async () => {
    const audio = useAudioStore()
    await audio.start()
    tone.context.setState('interrupted' as AudioContextState)
    expect(audio.status).toBeNull()
    tone.context.setState('running')
    expect(audio.status).toBe('good')
  })

  it('reports audio stopped from outside, and clears it on the next note', async () => {
    const audio = useAudioStore()
    await audio.start()
    tone.context.setState('suspended')

    await audio.start()
    expect(audio.error).toMatch(/stopped/)
    expect(audio.status).toBe('bad')

    audio.play('C5')
    expect(audio.error).toBe('')
    expect(audio.status).toBe('good')
  })

  it('reports errors from the voice', async () => {
    vi.spyOn(tone.voice, 'triggerAttack').mockImplementation(() => {
      throw new Error('Bad note')
    })
    const audio = useAudioStore()
    await audio.start()
    audio.play('nope')
    expect(audio.error).toBe('Error: Bad note')
    expect(audio.status).toBe('bad')
  })
})
