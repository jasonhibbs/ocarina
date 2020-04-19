<template lang="pug">

  .screen
    main
      .layout
        h1 Ocarina
        p It works!

        synth-keys(:notes="notes")

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SynthKeys from '@/components/SynthKeys.vue'

// Zelda’s Lullaby https://youtu.be/3QvlxoX1GjI?t=2616
// Saria’s Song https://youtu.be/3QvlxoX1GjI?t=2988

@Component({
  components: { SynthKeys },
})
export default class Home extends Vue {
  notes = ['A4', 'B4', 'D5', 'F5', 'A5', 'B5', 'D6', 'F6', 'A6']
}
</script>
