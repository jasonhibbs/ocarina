import { describe, expect, it } from 'vitest'
import { padGrid } from '../padGrid'

const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const midi = (note: string) => {
  const [, name, octave] = note.match(/^([A-G]#?)(-?\d+)$/)!
  return names.indexOf(name!) + (Number(octave) + 1) * 12
}

const rowsOf = ({ notes, columns }: ReturnType<typeof padGrid>) =>
  Array.from({ length: notes.length / columns }, (_, r) =>
    notes.slice(r * columns, r * columns + columns)
  )

describe('the Pad grid', () => {
  it.each([
    // kind, orientation, rows, columns, lowest, highest
    ['thirds', 'portrait', 8, 5, 'F4', 'C#7'],
    ['thirds', 'landscape', 6, 7, 'G#4', 'A#6'],
    ['fourths', 'portrait', 7, 5, 'E4', 'D7'],
    ['fourths', 'landscape', 5, 7, 'G#4', 'A#6'],
  ] as const)(
    'in %s, %s: %i rows of %i, %s to %s',
    (kind, orientation, rows, columns, lowest, highest) => {
      const grid = padGrid(kind, orientation)
      expect(grid.columns).toBe(columns)
      expect(grid.notes).toHaveLength(rows * columns)
      expect(grid.notes[0]).toBe(lowest)
      expect(grid.notes.at(-1)).toBe(highest)
    }
  )

  it.each([
    ['thirds', 4],
    ['fourths', 5],
  ] as const)(
    'in %s, runs in semitones along each row, each row %i semitones above the last',
    (kind, step) => {
      for (const orientation of ['portrait', 'landscape'] as const) {
        const rows = rowsOf(padGrid(kind, orientation))
        const base = midi(rows[0]![0]!)
        rows.forEach((row, r) =>
          row.forEach((note, c) => expect(midi(note)).toBe(base + r * step + c))
        )
      }
    }
  )

  it('always holds the whole of A4 to A6', () => {
    for (const kind of ['thirds', 'fourths'] as const) {
      for (const orientation of ['portrait', 'landscape'] as const) {
        const notes = new Set(padGrid(kind, orientation).notes.map(midi))
        for (let n = midi('A4'); n <= midi('A6'); n++) {
          expect(notes.has(n)).toBe(true)
        }
      }
    }
  })

  it('puts an octave three rows straight up, in thirds', () => {
    const rows = rowsOf(padGrid('thirds', 'portrait'))
    const a4 = rows[1]!.indexOf('A4')
    expect(rows[4]![a4]).toBe('A5')
    expect(rows[7]![a4]).toBe('A6')
  })
})
