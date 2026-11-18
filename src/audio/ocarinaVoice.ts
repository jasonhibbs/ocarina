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
      3, 3, 2, 3, 5, 3, 2, -1, -1, -1, -1, -6, -6, -9, -15, -13, -19, -24, -27,
      -31, -35, -41, -48, -37, -32, -29, -23, -18, -12, -10, -5, -3, 1, -0, 1,
      4, 4, 2, 1, 3, 5, 3, 2, 1, 3,
    ],
    cycleLoudness: [
      1.0, 1.0, 0.9, 0.8, 0.6, 0.4, 0.5, 0.4, 0.3, 0.2, -0.0, -0.2, -0.6, -1.0,
      -1.7, -2.1, -2.9, -3.7, -4.4, -5.7, -6.7, -7.3, -8.0, -7.7, -7.0, -6.3,
      -5.2, -4.4, -3.4, -2.7, -2.1, -1.4, -0.9, -0.5, -0.3, 0.0, 0.2, 0.4, 0.6,
      0.8, 0.9, 0.8, 0.9, 0.9, 1.0,
    ],
    // The full dip, as a share of the cycle above
    depth: 1.05,
  },
} as const

// 1 ÷ the standard deviation of brown noise low-passed as above (0.0327,
// measured in offline renders)
const wobbleScale = 1 / 0.0327

interface FourierSeries {
  mean: number
  real: Float32Array
  imag: Float32Array
}

/**
 * One cycle (equally spaced, its last point repeating its first), divided by
 * scale, as a Fourier series: enough harmonics for a smooth, faithful copy
 * (16 reproduce the vibrato's cycle within about half a cent).
 */
function fourierSeries(
  cycle: readonly number[],
  scale: number,
  harmonics = 16
): FourierSeries {
  const n = cycle.length - 1
  const y = cycle.slice(0, n).map((value) => value / scale)
  const real = new Float32Array(harmonics + 1)
  const imag = new Float32Array(harmonics + 1)
  for (let k = 1; k <= harmonics; k++) {
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n
      real[k]! += (2 / n) * y[i]! * Math.cos(angle)
      imag[k]! += (2 / n) * y[i]! * Math.sin(angle)
    }
  }
  const mean = y.reduce((sum, value) => sum + value, 0) / n
  return { mean, real, imag }
}

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

  // The breath's dips: the reference's cycle, played as a smooth periodic
  // signal (its Fourier series, through an oscillator), for pitch (in cents
  // of detune) and loudness (as a share of the gain around 1). Both are
  // scaled so a full dip reads -1. Web Audio drops a wave's constant part,
  // so that is added back from a Signal. A plain Gain feeding a parameter
  // adds to it, so the onset automation on detune still works.
  //
  // (Sweeping the table with a sawtooth clicked: its band-limited jump at
  // the end of each cycle swept through the whole dip in a millisecond.)
  const pitchCycle = v.cyclePitch
  const loudnessCycle = v.cycleLoudness.map((dB) => 10 ** (dB / 20) - 1)
  const pitchDipCents = -Math.min(...pitchCycle)
  const loudnessDipShare = -Math.min(...loudnessCycle)
  const pitchSeries = fourierSeries(pitchCycle, pitchDipCents)
  const loudnessSeries = fourierSeries(loudnessCycle, loudnessDipShare)
  const pitchDip = new Tone.Gain(0)
  const loudnessDip = new Tone.Gain(0)
  const loudness = new Tone.Gain(1)
  new Tone.Signal(pitchSeries.mean).connect(pitchDip)
  new Tone.Signal(loudnessSeries.mean).connect(loudnessDip)
  pitchDip.connect(tone.detune)
  loudnessDip.connect(loudness.gain)

  const context = Tone.getContext().rawContext
  const waveOf = ({ real, imag }: FourierSeries) =>
    context.createPeriodicWave(real, imag, { disableNormalization: true })
  const pitchWave = waveOf(pitchSeries)
  const loudnessWave = waveOf(loudnessSeries)

  // Oscillators can't restart, so each note gets a fresh pair, starting at
  // the top of a cycle (the dip is half a cycle in)
  let cycles: { stop(time: number): void }[] = []
  function startCycles(time: number) {
    for (const oscillator of cycles) oscillator.stop(time)
    cycles = [
      [pitchWave, pitchDip],
      [loudnessWave, loudnessDip],
    ].map(([wave, destination]) => {
      const oscillator = context.createOscillator()
      oscillator.setPeriodicWave(wave as PeriodicWave)
      oscillator.frequency.value = v.rate
      Tone.connect(oscillator, destination as Tone.Gain)
      oscillator.onended = () => oscillator.disconnect()
      oscillator.start(time)
      return oscillator
    })
  }

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
  // The cycles restart so the first dip always lands firstDipAfter into
  // the vibrato. They start one cycle earlier still, while the vibrato is
  // at zero, so the switch from the last note's pair is silent.
  function restartVibrato(time: number) {
    const start = time + v.plainFor
    startCycles(start + v.firstDipAfter - 1.5 / v.rate)
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
