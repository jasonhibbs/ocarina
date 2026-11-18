const names = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

const noteName = (midi: number) =>
  `${names[midi % 12]}${Math.floor(midi / 12) - 1}`

/**
 * The Pad layout: semitones run left to right, and each row starts a major
 * third (4 semitones) above the last. Rows of 5 overlap by a note, and an
 * octave is three rows straight up. Grids tuned in major thirds were found
 * significantly easier to play than the usual fourths (Klin, NIME 2015).
 *
 * Listed lowest row first, as the keys fill from the bottom-left.
 */
export function majorThirdsGrid({
  lowest = 69, // A4
  rows = 6,
  columns = 5,
} = {}) {
  return Array.from({ length: rows * columns }, (_, i) =>
    noteName(lowest + Math.floor(i / columns) * 4 + (i % columns))
  )
}
