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
 * A chromatic grid: semitones left to right, each row `step` semitones above
 * the last, lowest row first (the keys fill from the bottom-left).
 */
function chromaticGrid(lowest: number, rows: number, step: number) {
  const columns = 5
  return Array.from({ length: rows * columns }, (_, i) =>
    noteName(lowest + Math.floor(i / columns) * step + (i % columns))
  )
}

/**
 * The Pad layout: semitones run left to right, and each row starts a major
 * third (4 semitones) above the last. Rows of 5 overlap by a note, and an
 * octave is three rows straight up. Grids tuned in major thirds were found
 * significantly easier to play than the usual fourths (Klin, NIME 2015).
 *
 * Listed lowest row first, as the keys fill from the bottom-left.
 */
export const majorThirdsGrid = () => chromaticGrid(69, 6, 4) // A4 to A6

/**
 * The alternative: rows a fourth (5 semitones) apart, like bass or guitar
 * strings. Rows of 5 meet without overlapping, A4 to A6 in 5 rows.
 */
export const fourthsGrid = () => chromaticGrid(69, 5, 5) // A4 to A6
