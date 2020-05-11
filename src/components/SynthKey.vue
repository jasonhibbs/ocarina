<template lang="pug">

  .button.synth-key(
    :title="note"
    :data-note="note"
    :data-freq="frequency"
    :style="style"
  )
    .synth-key-inner
      .synth-key-label {{ note }}

</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Frequency } from 'tone'

@Component
export default class SynthKey extends Vue {
  @Prop() note!: string

  get frequency() {
    return Frequency(this.note).toFrequency()
  }

  get pitchClass() {
    return Frequency(this.note).toMidi() % 12
  }

  get style() {
    return {
      '--pitch-class': this.pitchClass,
    }
  }
}
</script>
