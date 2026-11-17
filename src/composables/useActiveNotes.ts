import { computed, readonly, ref } from 'vue'

export type PressIdentifier = string | number

export interface ActiveNote {
  note: string
  /** A touch identifier, 'mouse', or a keyboard code */
  identifier: PressIdentifier
}

/**
 * Tracks which notes are held down by each finger, the mouse and the
 * keyboard. The instrument is monophonic: the most recent press wins, and
 * releasing it falls back to whichever press is still held.
 */
export function useActiveNotes() {
  const activeNotes = ref<ActiveNote[]>([])

  const current = computed(() => activeNotes.value.at(-1)?.note)

  function press(identifier: PressIdentifier, note: string) {
    if (!activeNotes.value.some((n) => n.identifier === identifier)) {
      activeNotes.value.push({ identifier, note })
    }
  }

  /** Slide an existing press onto another note, keeping its place. */
  function move(identifier: PressIdentifier, note: string) {
    const activeNote = activeNotes.value.find(
      (n) => n.identifier === identifier
    )
    if (activeNote) activeNote.note = note
  }

  function release(identifier: PressIdentifier) {
    activeNotes.value = activeNotes.value.filter(
      (n) => n.identifier !== identifier
    )
  }

  const isPressed = (note: string) =>
    activeNotes.value.some((n) => n.note === note)

  return {
    activeNotes: readonly(activeNotes),
    current,
    press,
    move,
    release,
    isPressed,
  }
}
