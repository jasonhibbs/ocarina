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
  // Like a resume() from a gesture the browser accepted.
  const startNow = async () => context.setState('running')
  return { context, voice, startNow }
})

vi.mock('tone', () => ({
  getContext: () => tone.context,
  getDestination: () => ({}),
  start: vi.fn(),
  Synth: vi.fn(function () {
    return tone.voice
  }),
  Reverb: vi.fn(),
  Vibrato: vi.fn(),
}))

const { start: toneStart } = await import('tone')
const startMock = vi.mocked(toneStart)

// Like WebKit with a gesture it didn't accept: the promise never settles.
const neverStarts = () => new Promise<void>(() => {})

describe('audio store', () => {
  beforeEach(() => {
    tone.context.reset()
    vi.restoreAllMocks()
    startMock.mockReset().mockImplementation(tone.startNow)
    setActivePinia(createPinia())
  })

  it('has no status until the first gesture', () => {
    const audio = useAudioStore()
    expect(audio.contextState).toBe('')
    expect(audio.status).toBeNull()
  })

  it('starts the context on the first gesture', async () => {
    const audio = useAudioStore()
    audio.start()
    await vi.waitFor(() => expect(audio.status).toBe('good'))
    expect(audio.contextState).toBe('running')
  })

  it('asks again on the next gesture when an attempt never settles', () => {
    startMock.mockImplementationOnce(neverStarts)
    const audio = useAudioStore()
    audio.start()
    expect(audio.status).toBeNull()

    audio.start()
    expect(startMock).toHaveBeenCalledTimes(2)
    expect(audio.status).toBe('good')
    expect(audio.error).toBe('')
  })

  it('unlocks on the end of a touch, not only on its start', () => {
    startMock.mockImplementationOnce(neverStarts)
    const audio = useAudioStore()
    audio.start()
    document.dispatchEvent(new Event('touchend'))
    expect(audio.status).toBe('good')
  })

  it('stops asking once audio runs', () => {
    const audio = useAudioStore()
    audio.start()
    audio.start()
    document.dispatchEvent(new Event('click'))
    expect(startMock).toHaveBeenCalledTimes(1)
  })

  it('plays notes held before audio starts', () => {
    startMock.mockImplementation(neverStarts)
    const attack = vi.spyOn(tone.voice, 'triggerAttack')
    const audio = useAudioStore()
    audio.start()
    audio.play('C5')
    expect(attack).toHaveBeenCalledWith('C5')
  })

  it('ignores notes before the first gesture', () => {
    const attack = vi.spyOn(tone.voice, 'triggerAttack')
    useAudioStore().play('C5')
    expect(attack).not.toHaveBeenCalled()
  })

  it('plays and releases notes', () => {
    const attack = vi.spyOn(tone.voice, 'triggerAttack')
    const release = vi.spyOn(tone.voice, 'triggerRelease')
    const audio = useAudioStore()
    audio.start()
    audio.play('C5')
    audio.stop()
    expect(attack).toHaveBeenCalledWith('C5')
    expect(release).toHaveBeenCalled()
  })

  it('follows the context when the system interrupts it', () => {
    const audio = useAudioStore()
    audio.start()
    tone.context.setState('interrupted' as AudioContextState)
    expect(audio.status).toBeNull()
    tone.context.setState('running')
    expect(audio.status).toBe('good')
  })

  it('reports audio stopped from outside until it runs again', () => {
    const audio = useAudioStore()
    audio.start()
    tone.context.setState('suspended')

    startMock.mockImplementationOnce(neverStarts)
    audio.start()
    expect(audio.error).toMatch(/stopped/)
    expect(audio.status).toBe('bad')

    audio.start()
    expect(audio.error).toBe('')
    expect(audio.status).toBe('good')
  })

  it('reports a failed start', async () => {
    startMock.mockRejectedValueOnce(new Error('Not allowed'))
    const audio = useAudioStore()
    audio.start()
    await vi.waitFor(() => expect(audio.error).toBe('Error: Not allowed'))
    expect(audio.status).toBe('bad')
  })

  it('reports errors from the voice', () => {
    vi.spyOn(tone.voice, 'triggerAttack').mockImplementation(() => {
      throw new Error('Bad note')
    })
    const audio = useAudioStore()
    audio.start()
    audio.play('nope')
    expect(audio.error).toBe('Error: Bad note')
    expect(audio.status).toBe('bad')
  })
})
