<template lang="pug">

  button.synth-key {{ note }}

</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class SynthKey extends Vue {
  @Prop() note!: string
}
</script>
