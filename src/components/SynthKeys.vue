<script lang="ts">
// F4 up to D7: twenty natural notes
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
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useAudioStore } from '@/stores/audio'
import { useActiveNotes } from '@/composables/useActiveNotes'
import SynthKey from '@/components/SynthKey.vue'

const { notes = defaultNotes(), zelda = false } = defineProps<{
  notes?: string[]
  zelda?: boolean
}>()

const audio = useAudioStore()
const { current, press, move, release, isPressed } = useActiveNotes()

watch(current, (note) => {
  if (note) {
    audio.play(note)
  } else {
    audio.stop()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }
})

// Tone's documented pattern is to call Tone.start() from a "click" or
// "keydown" listener. Touches here cancel touchstart (no scrolling or zooming
// while playing), which also cancels the click, so a touch's equivalent is
// touchend.
const start = () => audio.start()

useEventListener(document, ['touchend', 'click', 'keydown'], start, {
  capture: true,
  passive: true,
})

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
    if (note) press(touch.identifier, note)
  }
}

function onTouchmove(e: TouchEvent) {
  e.preventDefault()
  for (const touch of e.changedTouches) {
    const note = getNoteFromPoint(touch.clientX, touch.clientY)
    if (note) move(touch.identifier, note)
  }
}

useEventListener(document.documentElement, ['touchend', 'touchcancel'], (e) => {
  for (const touch of e.changedTouches) {
    release(touch.identifier)
  }
})

// Mouse

let isMousedown = false

function onMousedown(note: string) {
  start()
  isMousedown = true
  press('mouse', note)
}

function onMouseenter(note: string) {
  if (isMousedown) {
    move('mouse', note)
  }
}

useEventListener(document.documentElement, 'mouseup', () => {
  isMousedown = false
  release('mouse')
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
    press(key.code, key.note)
  }
})

useEventListener(document.documentElement, 'keyup', (e) => {
  if (keyboardKeys.some((k) => k.code === e.code)) {
    release(e.code)
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
        v-for="(note, i) in notes"
        :key="`${i}-${note}`"
        :note="note"
        :title="synthKeyTitle(note)"
        :aria-pressed="isPressed(note)"
        @mousedown="onMousedown(note)"
        @mouseenter="onMouseenter(note)"
      />
    </div>
  </div>
</template>
