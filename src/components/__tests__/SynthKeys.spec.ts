import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import SynthKeys from '../SynthKeys.vue'

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

describe('SynthKeys', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    tone.context.reset()
    vi.clearAllMocks()
    tone.start.mockImplementation(tone.startNow)
    wrapper = mount(SynthKeys, {
      props: { notes: ['C5', 'D5'] },
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    })
  })

  afterEach(() => wrapper.unmount())

  it.each(['touchend', 'click', 'keydown'])(
    'starts audio on %s, as Tone’s docs describe',
    async (type) => {
      document.dispatchEvent(new Event(type))
      await flushPromises()
      expect(tone.start).toHaveBeenCalled()
    }
  )

  it('plays a key held down while audio was starting', async () => {
    tone.start.mockImplementationOnce(tone.neverStarts)
    await wrapper.find('[data-note="D5"]').trigger('mousedown')
    expect(tone.voice.triggerAttack).not.toHaveBeenCalled()

    // The browser accepts the next gesture while the key is still held.
    document.dispatchEvent(new Event('click'))
    await flushPromises()
    expect(tone.voice.triggerAttack).toHaveBeenCalledWith(
      'D5',
      expect.any(Number)
    )
    expect(tone.voice.triggerAttack).toHaveBeenCalledTimes(1)
  })

  it('plays from the keyboard', async () => {
    document.documentElement.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyS', bubbles: true })
    )
    await flushPromises()
    expect(tone.voice.triggerAttack).toHaveBeenCalledWith(
      'C5',
      expect.any(Number)
    )
    expect(tone.voice.triggerAttack).toHaveBeenCalledTimes(1)
  })
})
