// ISO 226:2003 normal equal-loudness-level contours for pure tones: the
// sound pressure level a tone needs, at each frequency, to sound as loud as
// a 1 kHz tone at a given loudness level (phon).

const frequencies = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500,
]
// Exponent of loudness perception, magnitude of the linear transfer
// function (normalised at 1 kHz), and threshold of hearing, per frequency
const af = [
  0.532, 0.506, 0.48, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.33, 0.315,
  0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.25, 0.246, 0.244, 0.243, 0.243,
  0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301,
]
const Lu = [
  -31.6, -27.2, -23.0, -19.1, -15.9, -13.0, -10.3, -8.1, -6.2, -4.5, -3.1, -2.0,
  -1.1, -0.4, 0.0, 0.3, 0.5, 0.0, -2.7, -4.1, -1.0, 1.7, 2.5, 1.2, -2.1, -7.1,
  -11.2, -10.7, -3.1,
]
const Tf = [
  78.5, 68.7, 59.5, 51.1, 44.0, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6,
  6.2, 4.4, 3.0, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6.0, -5.4, -1.5, 6.0, 12.6,
  13.9, 12.3,
]

/** SPL (dB) at each tabulated frequency for a loudness level (phon) */
function contour(phon: number) {
  return frequencies.map((_, i) => {
    const a = af[i]!
    const Af =
      4.47e-3 * (10 ** (0.025 * phon) - 1.15) +
      (0.4 * 10 ** ((Tf[i]! + Lu[i]!) / 10 - 9)) ** a
    return (10 / a) * Math.log10(Af) - Lu[i]! + 94
  })
}

/**
 * The SPL (dB) a pure tone at `frequency` (Hz) needs to sound `phon` loud,
 * interpolated on a log-frequency scale between the standard's frequencies.
 */
export function equalLoudnessSpl(frequency: number, phon = 60) {
  const levels = contour(phon)
  const x = Math.log10(frequency)
  const i = Math.min(
    Math.max(frequencies.findIndex((f) => f > frequency) - 1, 0),
    frequencies.length - 2
  )
  const x0 = Math.log10(frequencies[i]!)
  const x1 = Math.log10(frequencies[i + 1]!)
  const t = (x - x0) / (x1 - x0)
  return levels[i]! + (levels[i + 1]! - levels[i]!) * t
}
