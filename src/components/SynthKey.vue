<script setup lang="ts">
import { computed } from 'vue'
import { Frequency } from 'tone'

const props = defineProps<{ note: string }>()

const frequency = computed(() => Frequency(props.note).toFrequency())
const pitchClass = computed(() => Frequency(props.note).toMidi() % 12)
</script>

<template>
  <div
    class="button synth-key"
    :data-note="note"
    :data-freq="frequency"
    :style="{ '--pitch-class': pitchClass }"
  >
    <div class="synth-key-inner">
      <div class="synth-key-label">{{ note }}</div>
    </div>
  </div>
</template>
