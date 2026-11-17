import * as Tone from 'tone'

/**
 * An ocarina, matched to a reference recording of a player (the Song of
 * Healing), measured note by note. The recording's background noise is
 * left out: the tone itself is clean.
 *
 * - Almost a pure sine: the next harmonics sit about 45 dB down.
 * - A note speaks at once (5 ms), starts a few cents flat and rises into
 *   tune over about 180 ms, and stops quickly (about 70 ms).
 * - Slurred notes change pitch only: no new attack, and no flat start.
 * - Vibrato comes from the breath. A note is held steady for about 1.2 s,
 *   then dips regularly, about 4.5 times a second: the pitch sits on the
 *   note, then drops about 50 cents and back in roughly 0.1 s, and the
 *   loudness drops about 8 dB with it.
 */
export const ocarina = {
  partials: [1, 0.006, 0.0056],
  envelope: {
    attack: 0.005,
    attackCurve: 'linear',
    decay: 0.01,
    sustain: 1,
    release: 0.12,
    releaseCurve: 'exponential',
  },
  // A fresh note starts flat and rises into tune
  onsetDetune: -8, // cents
  onsetSettle: 0.18, // s
  vibrato: {
    rate: 4.55, // Hz
    plainFor: 1.1, // s steady, after each new or slurred note
    reachFor: 0.25, // s to near its full depth…
    firstDipAfter: 0.12, // s: the first dip comes in at about half depth
    deepenFor: 1.5, // s …then a little deeper
    nearShare: 0.85,
    // The dips: pitch down this far, and loudness to this share
    dipCents: 50,
    dipLoudness: 0.68, // a dip to about -8.5 dB
    // How sharp the dips are: higher is narrower, with a longer steady top
    dipSharpness: 4,
    // The top of each cycle sits a little sharp of the note, as measured
    topShare: 0.07,
  },
} as const

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

  // The breath's dips: a sine LFO shaped so that it rests near the top and
  // dips sharply once a cycle, from about +topShare down to -1. It sways
  // pitch (in cents of detune) and loudness (as a share of the gain around
  // 1) together. A plain Gain feeding a parameter adds to it, so the onset
  // automation on detune still works.
  const lfo = new Tone.LFO({ frequency: v.rate, min: -1, max: 1 })
  const dip = new Tone.WaveShaper(
    (x) => v.topShare - ((1 - x) / 2) ** v.dipSharpness,
    1024
  )
  const pitchDip = new Tone.Gain(0)
  const loudnessDip = new Tone.Gain(0)
  const loudness = new Tone.Gain(1)
  lfo.connect(dip)
  dip.fan(pitchDip, loudnessDip)
  pitchDip.connect(tone.detune)
  loudnessDip.connect(loudness.gain)

  const reverb = new Tone.Reverb({ decay: 0.6, wet: 0.4 })
  // As loud as the earlier, plainer voice
  const output = new Tone.Volume(-3.5)
  tone.chain(loudness, reverb, output, Tone.getDestination())

  // Long enough to glide out of a held note's vibrato without a click
  const settle = 0.06

  // Each new or slurred note starts steady, then its vibrato comes in.
  // The LFO restarts so the first dip always lands firstDipAfter into the
  // vibrato. Tone's LFO, restarted, reaches its trough a quarter of a cycle
  // in (measured); restarting one cycle earlier still, while the vibrato is
  // at zero, keeps the jump in its phase silent.
  function restartVibrato(time: number) {
    const start = time + v.plainFor
    lfo.start(start + v.firstDipAfter - 1.25 / v.rate)
    for (const [param, full] of [
      [pitchDip.gain, v.dipCents],
      [loudnessDip.gain, v.dipLoudness],
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
      tone.triggerAttack(note, time)
      tone.detune.cancelScheduledValues(time)
      tone.detune.setValueAtTime(ocarina.onsetDetune, time)
      tone.detune.linearRampToValueAtTime(0, time + ocarina.onsetSettle)
      restartVibrato(time)
    },
    slideTo(note, time) {
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
