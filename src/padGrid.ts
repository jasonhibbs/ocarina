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

export type PadGridKind = 'thirds' | 'fourths'
export type Orientation = 'portrait' | 'landscape'

export interface PadGrid {
  notes: string[]
  columns: number
}

/**
 * A chromatic grid: semitones left to right, each row `step` semitones above
 * the last, lowest row first (the keys fill from the bottom-left).
 */
function chromaticGrid(
  lowest: number,
  rows: number,
  step: number,
  columns: number
): PadGrid {
  const notes = Array.from({ length: rows * columns }, (_, i) =>
    noteName(lowest + Math.floor(i / columns) * step + (i % columns))
  )
  return { notes, columns }
}

const A4 = 69

/**
 * The Pad layout's grid. Its core runs A4 to A6 in rows of 5:
 *
 * - thirds (the default): each row a major third (4 semitones) above the
 *   last, so rows overlap by a note and an octave is three rows straight
 *   up. Grids tuned in major thirds were found significantly easier to play
 *   than the usual fourths (Klin, NIME 2015).
 * - fourths: each row a fourth (5 semitones) above the last, like bass or
 *   guitar strings, so rows meet without overlapping.
 *
 * To keep the keys nearer square, the core grows a row above and below in
 * portrait, and a column either side in landscape.
 */
export function padGrid(
  kind: PadGridKind = 'thirds',
  orientation: Orientation = 'portrait'
): PadGrid {
  const step = kind === 'thirds' ? 4 : 5
  const coreRows = kind === 'thirds' ? 6 : 5
  return orientation === 'portrait'
    ? chromaticGrid(A4 - step, coreRows + 2, step, 5)
    : chromaticGrid(A4 - 1, coreRows, step, 7)
}
