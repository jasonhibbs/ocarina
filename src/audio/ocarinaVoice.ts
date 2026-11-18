import * as Tone from 'tone'

/**
 * An ocarina, matched to a reference recording of a player (the Song of
 * Healing), measured note by note. The recording's background noise is
 * left out: the tone itself is clean.
 *
 * - Almost a pure sine, with faint 2nd and 3rd harmonics, and a held note
 *   wobbles very slightly, as breath does.
 * - A note speaks at once (5 ms), starts a few cents flat and rises into
 *   tune over about 180 ms. It stops over a breathier tail than the
 *   reference's, chosen by ear.
 * - Slurred notes change pitch only, gliding there in about 20 ms: no new
 *   attack, and no flat start.
 * - Vibrato comes from the breath. A note is held steady for about 1.2 s,
 *   then dips about 4.5 times a second, in the reference's own shape: the
 *   pitch eases down about 45 cents and springs back, and the loudness
 *   drops about 8 dB with it, recovering more slowly.
 */
export const ocarina = {
  // Just the 2nd and 3rd harmonics, about 40 and 44 dB down, as on the
  // reference's E5. Its fainter harmonics above those were left out: by
  // ear, the tone is softer and more natural without them.
  partials: [1, 0.0115, 0.0078],
  // A held breath is never quite still: slow, random wobble in pitch and
  // loudness (measured on the reference: ±1.5 cents, ±0.3 dB)
  wobble: {
    speed: 6, // Hz, the fastest it wanders
    cents: 1.5,
    loudness: 0.037, // ±3.7%, about ±0.3 dB
  },
  envelope: {
    attack: 0.005,
    attackCurve: 'linear',
    decay: 0.01,
    sustain: 1,
    // Three times what matched the reference (0.12): by ear, a breathier
    // tail that has mostly faded before the next separate note (4× blurred)
    release: 0.36,
    releaseCurve: 'exponential',
  },
  // Slurred notes glide to the new pitch (portamento); fresh notes don't
  glide: 0.02, // s
  // A fresh note starts flat and rises into tune
  onsetDetune: -8, // cents
  onsetSettle: 0.18, // s
  vibrato: {
    rate: 4.55, // Hz
    plainFor: 1.1, // s steady, after each new or slurred note
    reachFor: 0.25, // s to near its full depth…
    firstDipAfter: 0.14, // s: the first dip comes in at about half depth
    deepenFor: 1.5, // s …then a little deeper
    nearShare: 0.85,
    // One cycle of the reference's vibrato, averaged over its steady
    // cycles: every 5 ms from one top, through the dip (in the middle), to
    // the next. The pitch (cents) eases down and springs back up, with a
    // pointed bottom; the loudness (dB) lags behind it, recovering slowly.
    // Both are relative to the note before its vibrato began, and corrected
    // once so the rendered voice measures the reference's cycle (measuring
    // blurs it slightly, and this table was itself measured).
    cyclePitch: [
      1, 1, 1, 3, 6, 5, 4, 1, -0, 1, 1, -3, -3, -6, -12, -11, -16, -21, -25,
      -30, -34, -42, -49, -39, -32, -29, -22, -15, -9, -7, -2, 1, 4, 2, 2, 6, 6,
      3, 0, 2, 5, 3, 1, 0, 1,
    ],
    cycleLoudness: [
      1.1, 1.2, 1.2, 1.0, 0.8, 0.5, 0.5, 0.5, 0.5, 0.4, 0.3, 0.2, 0.0, -0.4,
      -1.1, -1.5, -2.3, -3.2, -4.0, -5.3, -6.6, -7.5, -8.3, -8.1, -7.3, -6.3,
      -5.1, -4.1, -3.0, -2.2, -1.5, -0.7, -0.2, 0.1, 0.2, 0.5, 0.7, 0.8, 1.0,
      1.3, 1.3, 1.1, 1.0, 0.9, 1.1,
    ],
    // The full dip, as a share of the cycle above
    depth: 1.05,
  },
} as const

// 1 ÷ the standard deviation of brown noise low-passed as above (0.0327,
// measured in offline renders)
const wobbleScale = 1 / 0.0327

export interface Voice {
  /** A fresh note, from silence */
  triggerAttack(note: string, time: number): void
  /** Slur to another note, while one is sounding */
  slideTo(note: string, time: number): void
  triggerRelease(time: number): void
}

export function createOcarinaVoice(): Voice {
  const v = ocarina.vibrato

  const tone = new Tone.Synth({
    oscillator: { type: 'custom', partials: [...ocarina.partials] },
    envelope: { ...ocarina.envelope },
  })

  // The breath's dips: a sawtooth LFO sweeps the phase of each cycle, and
  // WaveShapers read the reference's cycle off it, for pitch (in cents of
  // detune) and loudness (as a share of the gain around 1). Both are
  // scaled so a full dip reads -1. A plain Gain feeding a parameter adds to
  // it, so the onset automation on detune still works.
  const lfo = new Tone.LFO({
    type: 'sawtooth',
    frequency: v.rate,
    min: -1,
    max: 1,
  })
  const pitchCycle = v.cyclePitch
  const loudnessCycle = v.cycleLoudness.map((dB) => 10 ** (dB / 20) - 1)
  const pitchDipCents = -Math.min(...pitchCycle)
  const loudnessDipShare = -Math.min(...loudnessCycle)
  const readCycle = (cycle: readonly number[], scale: number) =>
    new Tone.WaveShaper((x) => {
      const at = ((x + 1) / 2) * (cycle.length - 1)
      const i = Math.min(Math.floor(at), cycle.length - 2)
      const value = cycle[i]! + (cycle[i + 1]! - cycle[i]!) * (at - i)
      return value / scale
    }, 2048)
  const pitchShape = readCycle(pitchCycle, pitchDipCents)
  const loudnessShape = readCycle(loudnessCycle, loudnessDipShare)
  const pitchDip = new Tone.Gain(0)
  const loudnessDip = new Tone.Gain(0)
  const loudness = new Tone.Gain(1)
  lfo.fan(pitchShape, loudnessShape)
  pitchShape.connect(pitchDip)
  loudnessShape.connect(loudnessDip)
  pitchDip.connect(tone.detune)
  loudnessDip.connect(loudness.gain)

  // The breath's wobble: brown noise, low-passed until it only wanders,
  // into the same pitch and loudness. Scaled to the measured wobble by
  // wobbleScale (the filtered noise's own level, measured).
  const wobble = new Tone.Noise({ type: 'brown' }).start()
  const wobbleFilter = new Tone.Filter({
    type: 'lowpass',
    frequency: ocarina.wobble.speed,
    rolloff: -24,
  })
  const pitchWobble = new Tone.Gain(ocarina.wobble.cents * wobbleScale)
  const loudnessWobble = new Tone.Gain(ocarina.wobble.loudness * wobbleScale)
  wobble.chain(wobbleFilter)
  wobbleFilter.fan(pitchWobble, loudnessWobble)
  pitchWobble.connect(tone.detune)
  loudnessWobble.connect(loudness.gain)

  const reverb = new Tone.Reverb({ decay: 0.6, wet: 0.4 })
  // As loud as the earlier, plainer voice
  const output = new Tone.Volume(-3.5)
  tone.chain(loudness, reverb, output, Tone.getDestination())

  // Long enough to glide out of a held note's vibrato without a click
  const settle = 0.06

  // Each new or slurred note starts steady, then its vibrato comes in.
  // The LFO restarts so the first dip always lands firstDipAfter into the
  // vibrato. Tone's sawtooth LFO, restarted, reaches the dip (the middle of
  // the cycle) half a cycle in (measured); restarting one cycle earlier
  // still, while the vibrato is at zero, keeps the jump in its phase silent.
  function restartVibrato(time: number) {
    const start = time + v.plainFor
    lfo.start(start + v.firstDipAfter - 1.5 / v.rate)
    for (const [param, full] of [
      [pitchDip.gain, pitchDipCents * v.depth],
      [loudnessDip.gain, loudnessDipShare * v.depth],
    ] as const) {
      param.cancelAndHoldAtTime(time)
      param.linearRampToValueAtTime(0, time + settle)
      param.setValueAtTime(0, start)
      param.linearRampToValueAtTime(full * v.nearShare, start + v.reachFor)
      param.linearRampToValueAtTime(full, start + v.reachFor + v.deepenFor)
    }
  }

  return {
    triggerAttack(note, time) {
      tone.portamento = 0
      tone.triggerAttack(note, time)
      tone.detune.cancelScheduledValues(time)
      tone.detune.setValueAtTime(ocarina.onsetDetune, time)
      tone.detune.linearRampToValueAtTime(0, time + ocarina.onsetSettle)
      restartVibrato(time)
    },
    slideTo(note, time) {
      tone.portamento = ocarina.glide
      tone.setNote(note, time)
      restartVibrato(time)
    },
    triggerRelease(time) {
      tone.triggerRelease(time)
    },
  }
}

/** A plain tone, if the ocarina can't be built */
export function createPlainVoice(): Voice {
  const tone = new Tone.Synth().toDestination()
  return {
    triggerAttack: (note, time) => tone.triggerAttack(note, time),
    slideTo: (note, time) => tone.setNote(note, time),
    triggerRelease: (time) => tone.triggerRelease(time),
  }
}
