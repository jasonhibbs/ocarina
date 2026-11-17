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

vi.mock('@/audio/ocarinaVoice', () => ({
  createOcarinaVoice: () => tone.voice,
}))

describe('audio store', () => {
  beforeEach(() => {
    tone.context.reset()
    vi.clearAllMocks()
    tone.start.mockImplementation(tone.startNow)
    setActivePinia(createPinia())
  })

  it('needs starting until the first gesture', () => {
    const audio = useAudioStore()
    expect(audio.contextState).toBe('suspended')
    expect(audio.status).toBeNull()
    expect(audio.needsStart).toBe(true)
    expect(audio.hasRun).toBe(false)
  })

  it('doesn’t need starting where the browser lets audio run straight away', () => {
    tone.context.state = 'running'
    expect(useAudioStore().needsStart).toBe(false)
  })

  it('needs starting again after an interruption', async () => {
    const audio = useAudioStore()
    await audio.start()
    expect(audio.needsStart).toBe(false)
    tone.context.setState('interrupted' as AudioContextState)
    expect(audio.needsStart).toBe(true)
    expect(audio.hasRun).toBe(true)
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
    expect(tone.voice.triggerAttack).toHaveBeenCalledWith(
      'C5',
      expect.any(Number)
    )
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
    expect(tone.voice.triggerAttack).toHaveBeenCalledWith(
      'C5',
      expect.any(Number)
    )
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

  it('keeps notes in the same audio block strictly in order', async () => {
    const audio = useAudioStore()
    await audio.start()
    tone.clock.now = 5
    audio.play('C5')
    audio.play('D5')
    audio.play('E5')
    audio.stop()

    const [attack] = tone.voice.triggerAttack.mock.calls.map(([, t]) => t!)
    const slides = tone.voice.slideTo.mock.calls.map(([, t]) => t!)
    const [release] = tone.voice.triggerRelease.mock.calls[0]!
    expect(attack).toBe(5)
    expect(slides[0]).toBeGreaterThan(attack!)
    expect(slides[1]).toBeGreaterThan(slides[0]!)
    expect(release).toBeGreaterThan(slides[1]!)
    expect(audio.error).toBe('')
  })

  it('plays at Tone’s now once the clock has moved on', async () => {
    const audio = useAudioStore()
    await audio.start()
    tone.clock.now = 5
    audio.play('C5')
    audio.stop()
    tone.clock.now = 6
    audio.play('D5')
    expect(tone.voice.triggerAttack).toHaveBeenLastCalledWith('D5', 6)
  })

  it('slurs to a new note while one sounds, and attacks from silence', async () => {
    const audio = useAudioStore()
    await audio.start()
    audio.play('C5')
    audio.play('D5')
    expect(tone.voice.triggerAttack).toHaveBeenCalledTimes(1)
    expect(tone.voice.slideTo).toHaveBeenCalledWith('D5', expect.any(Number))

    audio.stop()
    audio.play('E5')
    expect(tone.voice.triggerAttack).toHaveBeenCalledTimes(2)
    expect(tone.voice.triggerAttack).toHaveBeenLastCalledWith(
      'E5',
      expect.any(Number)
    )
  })

  it('releases only a sounding note', async () => {
    const audio = useAudioStore()
    await audio.start()
    audio.stop()
    expect(tone.voice.triggerRelease).not.toHaveBeenCalled()
    audio.play('C5')
    audio.stop()
    audio.stop()
    expect(tone.voice.triggerRelease).toHaveBeenCalledTimes(1)
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
