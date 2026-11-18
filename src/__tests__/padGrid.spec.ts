import { describe, expect, it } from 'vitest'
import { fourthsGrid, majorThirdsGrid } from '../padGrid'

describe('the Pad grid', () => {
  const notes = majorThirdsGrid()
  const rows = Array.from({ length: 6 }, (_, r) =>
    notes.slice(r * 5, r * 5 + 5)
  )

  it('runs from A4 to A6, in 6 rows of 5', () => {
    expect(notes).toHaveLength(30)
    expect(notes[0]).toBe('A4')
    expect(notes.at(-1)).toBe('A6')
  })

  it('runs in semitones along each row', () => {
    expect(rows[0]).toEqual(['A4', 'A#4', 'B4', 'C5', 'C#5'])
  })

  it('starts each row a major third above the last, so rows overlap by a note', () => {
    expect(rows.map((row) => row[0])).toEqual([
      'A4',
      'C#5',
      'F5',
      'A5',
      'C#6',
      'F6',
    ])
    for (let r = 1; r < rows.length; r++) {
      expect(rows[r]![0]).toBe(rows[r - 1]![4])
    }
  })

  it('puts an octave three rows straight up', () => {
    expect(rows[3]![0]).toBe('A5')
    expect(rows[5]![4]).toBe('A6')
    expect(rows[2]![4]).toBe('A5')
  })
})

describe('the fourths grid', () => {
  const notes = fourthsGrid()
  const rows = Array.from({ length: 5 }, (_, r) =>
    notes.slice(r * 5, r * 5 + 5)
  )

  it('runs from A4 to A6, in 5 rows of 5, with no duplicates', () => {
    expect(notes).toHaveLength(25)
    expect(notes[0]).toBe('A4')
    expect(notes.at(-1)).toBe('A6')
    expect(new Set(notes).size).toBe(25)
  })

  it('starts each row a fourth above the last', () => {
    expect(rows.map((row) => row[0])).toEqual(['A4', 'D5', 'G5', 'C6', 'F6'])
  })
})
