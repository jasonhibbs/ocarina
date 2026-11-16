<script lang="ts">
// F4 up to F7: twenty natural notes
function defaultNotes() {
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const firstLetterIndex = 3
  const firstNumberIndex = 4
  const length = 20
  return Array.from({ length }, (_, i) => {
    const count = firstLetterIndex + i
    const letter = letters[count % letters.length]
    const number = firstNumberIndex + Math.floor(count / letters.length)
    return `${letter}${number}`
  })
}
</script>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useSynth } from '@/composables/useSynth'
import SynthKey from '@/components/SynthKey.vue'

interface ActiveNote {
  note: string
  identifier: string | number
}

const { notes = defaultNotes(), zelda = false } = defineProps<{
  notes?: string[]
  zelda?: boolean
}>()

const emit = defineEmits<{
  play: [contextState: AudioContextState]
  stop: []
  error: [message: string]
}>()

const synth = useSynth({
  onPlay: (state) => emit('play', state),
  onError: (message) => emit('error', message),
})

// Active notes: the most recent press wins (monophonic)

const activeNotes = reactive<ActiveNote[]>([])

function pushActiveNote(note: ActiveNote) {
  if (!activeNotes.some((n) => n.identifier === note.identifier)) {
    activeNotes.push(note)
  }
}

function updateActiveNote(newNote: ActiveNote) {
  const index = activeNotes.findIndex(
    (n) => n.identifier === newNote.identifier
  )
  const activeNote = activeNotes[index]
  if (activeNote && activeNote.note !== newNote.note) {
    activeNotes.splice(index, 1, newNote)
  }
}

function removeActiveNote(identifier: ActiveNote['identifier']) {
  const index = activeNotes.findIndex((n) => n.identifier === identifier)
  if (index > -1) {
    activeNotes.splice(index, 1)
  }
}

function playLatest() {
  const lastNote = activeNotes.at(-1)
  if (lastNote) {
    synth.play(lastNote.note)
  } else {
    synth.stop()
    emit('stop')
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }
}

watch(activeNotes, playLatest, { immediate: true })

async function start() {
  const isFirstStart = !synth.synth.value
  await synth.start()
  // The synth is created asynchronously on the first gesture; play whatever
  // is still held down once it's ready.
  if (isFirstStart && activeNotes.length) {
    playLatest()
  }
}

const isPressed = (note: string) => activeNotes.some((n) => n.note === note)

// Touch

function getNoteFromPoint(x: number, y: number) {
  const el = document.elementFromPoint(x, y)
  return el instanceof HTMLElement && el.classList.contains('synth-key')
    ? el.dataset.note
    : undefined
}

function onTouchstart(e: TouchEvent) {
  start()
  e.preventDefault()
  for (const touch of e.changedTouches) {
    const note = getNoteFromPoint(touch.clientX, touch.clientY)
    if (note) pushActiveNote({ note, identifier: touch.identifier })
  }
}

function onTouchmove(e: TouchEvent) {
  e.preventDefault()
  for (const touch of e.changedTouches) {
    const note = getNoteFromPoint(touch.clientX, touch.clientY)
    if (note) updateActiveNote({ note, identifier: touch.identifier })
  }
}

useEventListener(document.documentElement, ['touchend', 'touchcancel'], (e) => {
  for (const touch of e.changedTouches) {
    removeActiveNote(touch.identifier)
  }
})

// Mouse

let isMousedown = false

function onMousedown(note: string) {
  start()
  isMousedown = true
  pushActiveNote({ note, identifier: 'mouse' })
}

function onMouseenter(note: string) {
  if (isMousedown) {
    updateActiveNote({ note, identifier: 'mouse' })
  }
}

useEventListener(document.documentElement, 'mouseup', () => {
  isMousedown = false
  removeActiveNote('mouse')
})

// Keyboard

// prettier-ignore
const keyboardKeys = [
  { code: 'KeyA',        note: 'B4'  },
  { code: 'KeyS',        note: 'C5'  },
  { code: 'KeyD',        note: 'D5'  },
  { code: 'KeyF',        note: 'E5'  },
  { code: 'KeyG',        note: 'F5'  },
  { code: 'KeyH',        note: 'G5'  },
  { code: 'KeyJ',        note: 'A5'  },
  { code: 'KeyK',        note: 'B5'  },
  { code: 'KeyL',        note: 'C6'  },
  { code: 'Semicolon',   note: 'D6'  },
  { code: 'Quote',       note: 'E6'  },
  { code: 'Backslash',   note: 'F6'  },
  { code: 'KeyE',        note: 'C#5' },
  { code: 'KeyR',        note: 'D#5' },
  { code: 'KeyY',        note: 'F#5' },
  { code: 'KeyU',        note: 'G#5' },
  { code: 'KeyI',        note: 'A#5' },
  { code: 'KeyP',        note: 'C#6' },
  { code: 'BracketLeft', note: 'D#6' },
]

function synthKeyTitle(note: string) {
  const key = keyboardKeys.find((k) => k.note === note)
  const keyLabel = key ? key.code.replace(/([A-Z])/g, ' $1').slice(1) : ''
  return keyLabel ? `${note} (${keyLabel})` : note
}

useEventListener(document.documentElement, 'keydown', (e) => {
  if (e.ctrlKey || e.metaKey) return
  const key = keyboardKeys.find((k) => k.code === e.code)
  if (key) {
    e.preventDefault()
    start()
    pushActiveNote({ note: key.note, identifier: key.code })
  }
})

useEventListener(document.documentElement, 'keyup', (e) => {
  if (keyboardKeys.some((k) => k.code === e.code)) {
    removeActiveNote(e.code)
  }
})
</script>

<template>
  <div
    class="synth-keys"
    :class="{ _zelda: zelda }"
    @touchstart="onTouchstart"
    @touchmove="onTouchmove"
  >
    <div class="synth-keys-inner">
      <SynthKey
        v-for="note in notes"
        :key="note"
        :note="note"
        :title="synthKeyTitle(note)"
        :aria-pressed="isPressed(note)"
        @mousedown="onMousedown(note)"
        @mouseenter="onMouseenter(note)"
      />
    </div>
  </div>
</template>
