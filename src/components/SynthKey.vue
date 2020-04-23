<template lang="pug">

  button.synth-key(
    :data-note="note"
  )
    .synth-key-inner
      .synth-key-label {{ note }}

</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class SynthKey extends Vue {
  @Prop() note!: string
}
</script>
