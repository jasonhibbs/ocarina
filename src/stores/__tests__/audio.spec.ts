import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAudioStore } from '../audio'

const tone = await vi.hoisted(async () => {
  const { createTone } = await import('@/test/toneMock')
  return createTone()
})

vi.mock('tone', async () => {
  const { createToneModule } = await import('@/test/toneMock')
  return createToneModule(tone)
})

describe('audio store', () => {
  beforeEach(() => {
    tone.context.reset()
    vi.clearAllMocks()
    tone.start.mockImplementation(tone.startNow)
    setActivePinia(createPinia())
  })

  it('has no status until the first gesture', () => {
    const audio = useAudioStore()
    expect(audio.contextState).toBe('')
    expect(audio.status).toBeNull()
  })

  it('starts audio', async () => {
    const audio = useAudioStore()
    await audio.start()
    expect(audio.contextState).toBe('running')
    expect(audio.status).toBe('good')
  })

  it('does nothing on later gestures while audio runs', async () => {
    const audio = useAudioStore()
    await audio.start()
    await audio.start()
    expect(tone.start).toHaveBeenCalledTimes(1)
  })

  it('asks again on the next gesture when an attempt never settles', async () => {
    tone.start.mockImplementationOnce(tone.neverStarts)
    const audio = useAudioStore()
    void audio.start()
    await audio.start()
    expect(tone.start).toHaveBeenCalledTimes(2)
    expect(audio.status).toBe('good')
  })

  it('plays a note asked for before audio ran, once it runs', async () => {
    tone.start.mockImplementationOnce(tone.neverStarts)
    const audio = useAudioStore()
    void audio.start()
    audio.play('C5')
    expect(tone.voice.triggerAttack).not.toHaveBeenCalled()

    await audio.start()
    expect(tone.voice.triggerAttack).toHaveBeenCalledWith('C5')
    expect(tone.voice.triggerAttack).toHaveBeenCalledTimes(1)
  })

  it('forgets a note released before audio ran', async () => {
    tone.start.mockImplementationOnce(tone.neverStarts)
    const audio = useAudioStore()
    void audio.start()
    audio.play('C5')
    audio.stop()
    await audio.start()
    expect(tone.voice.triggerAttack).not.toHaveBeenCalled()
  })

  it('plays and releases notes', async () => {
    const audio = useAudioStore()
    await audio.start()
    audio.play('C5')
    audio.stop()
    expect(tone.voice.triggerAttack).toHaveBeenCalledWith('C5')
    expect(tone.voice.triggerRelease).toHaveBeenCalled()
  })

  it('follows interruptions, and restarts on the next gesture', async () => {
    const audio = useAudioStore()
    await audio.start()
    tone.context.setState('interrupted' as AudioContextState)
    expect(audio.status).toBeNull()

    await audio.start()
    expect(tone.start).toHaveBeenCalledTimes(2)
    expect(audio.status).toBe('good')
  })

  it('reports a failed start', async () => {
    tone.start.mockRejectedValueOnce(new Error('Not allowed'))
    const audio = useAudioStore()
    await audio.start()
    expect(audio.error).toBe('Error: Not allowed')
    expect(audio.status).toBe('bad')
  })

  it('reports errors from the voice', async () => {
    tone.voice.triggerAttack.mockImplementationOnce(() => {
      throw new Error('Bad note')
    })
    const audio = useAudioStore()
    await audio.start()
    audio.play('nope')
    expect(audio.error).toBe('Error: Bad note')
    expect(audio.status).toBe('bad')
  })
})
