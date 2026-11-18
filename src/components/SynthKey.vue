<script setup lang="ts">
import { computed } from 'vue'
import { Frequency } from 'tone'

const props = defineProps<{ note: string }>()

const frequency = computed(() => Frequency(props.note).toFrequency())
const pitchClass = computed(() => Frequency(props.note).toMidi() % 12)
const isSharp = computed(() => props.note.includes('#'))
// The note's letter, sharp and octave, styled separately
const parts = computed(() => {
  const [, letter, sharp, octave] = props.note.match(/^([A-G])(#?)(-?\d+)$/)!
  return { letter, sharp: sharp ? '♯' : '', octave }
})
</script>

<template>
  <div
    class="button synth-key"
    :class="{ _sharp: isSharp, _a: pitchClass === 9 }"
    :data-note="note"
    :data-freq="frequency"
    :style="{ '--pitch-class': pitchClass }"
  >
    <div class="synth-key-inner">
      <div class="synth-key-label">
        <span class="synth-key-letter">{{ parts.letter }}</span><span
          v-if="parts.sharp"
          class="synth-key-sharp"
          >{{ parts.sharp }}</span
        ><span class="synth-key-octave">{{ parts.octave }}</span>
      </div>
    </div>
  </div>
</template>
