import { describe, expect, it } from 'vitest'
import { useActiveNotes } from '../useActiveNotes'

describe('useActiveNotes', () => {
  it('starts silent', () => {
    const { current, activeNotes } = useActiveNotes()
    expect(current.value).toBeUndefined()
    expect(activeNotes.value).toEqual([])
  })

  it('plays the most recent press', () => {
    const { current, press } = useActiveNotes()
    press(0, 'C5')
    press(1, 'E5')
    expect(current.value).toBe('E5')
  })

  it('falls back to a press still held when the latest is released', () => {
    const { current, press, release } = useActiveNotes()
    press(0, 'C5')
    press(1, 'E5')
    release(1)
    expect(current.value).toBe('C5')
    release(0)
    expect(current.value).toBeUndefined()
  })

  it('releasing an earlier press keeps the latest playing', () => {
    const { current, press, release } = useActiveNotes()
    press(0, 'C5')
    press(1, 'E5')
    release(0)
    expect(current.value).toBe('E5')
  })

  it('ignores a repeated press from the same source (key repeat)', () => {
    const { activeNotes, current, press } = useActiveNotes()
    press('KeyS', 'C5')
    press('KeyD', 'D5')
    press('KeyS', 'C5')
    expect(activeNotes.value).toHaveLength(2)
    expect(current.value).toBe('D5')
  })

  it('slides a press onto another note without changing its priority', () => {
    const { current, press, move } = useActiveNotes()
    press(0, 'C5')
    press(1, 'E5')
    move(0, 'D5')
    expect(current.value).toBe('E5')
    move(1, 'F5')
    expect(current.value).toBe('F5')
  })

  it('ignores moves and releases for sources that aren’t pressed', () => {
    const { activeNotes, press, move, release } = useActiveNotes()
    press('mouse', 'C5')
    move(7, 'D5')
    release(7)
    expect(activeNotes.value).toEqual([{ identifier: 'mouse', note: 'C5' }])
  })

  it('reports which notes are pressed by anything', () => {
    const { isPressed, press, release } = useActiveNotes()
    press(0, 'C5')
    press('KeyS', 'C5')
    release(0)
    expect(isPressed('C5')).toBe(true)
    expect(isPressed('D5')).toBe(false)
  })

  it('distinguishes touch identifier 0 from other sources', () => {
    const { current, press, release } = useActiveNotes()
    press(0, 'C5')
    press('mouse', 'D5')
    release(0)
    expect(current.value).toBe('D5')
  })
})
