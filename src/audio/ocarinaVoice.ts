import * as Tone from 'tone'

/**
 * An ocarina, roughly, from what's known of how one sounds:
 *
 * - It's a Helmholtz resonator (a vessel flute), so the tone is almost a pure
 *   sine: just a trace of the next two harmonics.
 * - It speaks quickly, with a short breathy "chiff" as the air jet catches,
 *   and the pitch settles up into tune as breath pressure builds.
 * - Breath noise sits quietly under the note.
 * - Vibrato comes from the breath, so it moves pitch and loudness together.
 *   Players start a note plain and let vibrato grow as it's held. Woodwind
 *   vibrato is narrow: 10–15 cents already counts as intense.
 */
export const ocarina = {
  partials: [1, 0.025, 0.012],
  envelope: {
    attack: 0.045,
    attackCurve: 'sine',
    decay: 0.25,
    sustain: 0.9,
    release: 0.25,
    releaseCurve: 'exponential',
  },
  // Pitch at the start of a note, settling into tune
  onsetDetune: -12, // cents
  onsetSettle: 0.07, // s
  vibrato: {
    rate: 5.5, // Hz
    // Plain, then growing to its fullest as the note is held
    plainFor: 0.35, // s
    growFor: 1.3, // s
    startCents: 2,
    fullCents: 15,
    // Loudness moves with it, ±8% at its fullest
    fullTremolo: 0.08,
  },
  // Measured in offline renders, F4 to D7: about 31 dB under the tone
  // while sustaining, and 22 dB under it through the chiff
  breath: {
    level: 0.05, // sustaining…
    chiffLevel: 0.35, // …and at the onset, both scaled by the noise's volume
    chiffDecay: 0.08, // s
    volume: 19, // dB
  },
} as const

export interface Voice {
  triggerAttack(note: string, time: number): void
  triggerRelease(time: number): void
}

export function createOcarinaVoice(): Voice {
  const { vibrato: v, breath: b } = ocarina

  const tone = new Tone.Synth({
    oscillator: { type: 'custom', partials: [...ocarina.partials] },
    envelope: { ...ocarina.envelope },
  })

  // One breath, swaying pitch and loudness together: an LFO from -1 to 1,
  // scaled to cents of detune, and to a share of the gain around 1.
  // (A plain Gain feeding a parameter adds to it, so the onset automation
  // on detune still works.)
  const sway = new Tone.LFO({ frequency: v.rate, min: -1, max: 1 }).start()
  const vibrato = new Tone.Gain(0)
  const tremolo = new Tone.Gain(0)
  const loudness = new Tone.Gain(1)
  sway.fan(vibrato, tremolo)
  vibrato.connect(tone.detune)
  tremolo.connect(loudness.gain)
  const reverb = new Tone.Reverb({ decay: 0.6, wet: 0.4 })
  // As loud as the earlier, plainer voice, with headroom for the chiff
  const output = new Tone.Volume(-3.5)

  // Breath: pink noise, band-passed around the note, behind its own envelope
  const breathFilter = new Tone.Filter({ type: 'bandpass', Q: 1.2 })
  const breathEnvelope = new Tone.AmplitudeEnvelope({
    attack: 0.005,
    decay: b.chiffDecay,
    sustain: b.level / b.chiffLevel,
    release: ocarina.envelope.release,
  })
  const breath = new Tone.Noise({ type: 'pink', volume: b.volume }).start()
  const breathLevel = new Tone.Gain(b.chiffLevel)
  breath.chain(breathFilter, breathEnvelope, breathLevel, reverb)

  tone.chain(loudness, reverb, output, Tone.getDestination())

  // Long enough to glide out of a held note's vibrato without a click
  const settle = 0.06

  return {
    triggerAttack(note, time) {
      tone.triggerAttack(note, time)

      tone.detune.cancelScheduledValues(time)
      tone.detune.setValueAtTime(ocarina.onsetDetune, time)
      tone.detune.linearRampToValueAtTime(0, time + ocarina.onsetSettle)

      const frequency = Tone.Frequency(note).toFrequency()
      breathFilter.frequency.setValueAtTime(frequency * 1.5, time)
      breathEnvelope.triggerAttack(time)

      // Each note starts plain, then its vibrato grows
      const grow = time + v.plainFor
      for (const [param, plain, full] of [
        [vibrato.gain, v.startCents, v.fullCents],
        [tremolo.gain, 0, v.fullTremolo],
      ] as const) {
        param.cancelAndHoldAtTime(time)
        param.linearRampToValueAtTime(plain, time + settle)
        param.setValueAtTime(plain, grow)
        param.linearRampToValueAtTime(full, grow + v.growFor)
      }
    },
    triggerRelease(time) {
      tone.triggerRelease(time)
      breathEnvelope.triggerRelease(time)
    },
  }
}
