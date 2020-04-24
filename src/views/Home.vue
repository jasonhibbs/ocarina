<template lang="pug">

  .screen

    header
      button(@click="onClickLayoutToggle") {{ layoutSelectedLabel }}
      button(
        aria-controls="drawer"
        :aria-expanded="drawerActive"
        @click="drawerActive = !drawerActive"
      ) ℹ️

    transition(name="slide-left")
      drawer#drawer(v-if="drawerActive")
        template(#header)
          button(
            aria-controls="drawer"
            :aria-expanded="drawerActive"
            @click="drawerActive = false"
          ) Close

        select(
          v-model="layoutSelected"
        )
          option(v-for="option in layoutOptions" :value="option.value") {{ option.label }}


    main
      synth-keys(
        :class="layoutClass"
      )

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Drawer from '@/components/Drawer.vue'
import SynthKeys from '@/components/SynthKeys.vue'

// Zelda’s Lullaby     https://youtu.be/3QvlxoX1GjI?t=2616
// Saria’s Song        https://youtu.be/3QvlxoX1GjI?t=2988
// Sun Song            https://youtu.be/3QvlxoX1GjI?t=3452
// Song of Time        https://youtu.be/3QvlxoX1GjI?t=7830
// Epona’s Song        https://youtu.be/fq8pAK5tlUc?t=53
// Minuet of Forest    https://youtu.be/3QvlxoX1GjI?t=9139
// Bolero of Fire      https://youtu.be/3QvlxoX1GjI?t=11894
// Serenade of Water   https://youtu.be/3QvlxoX1GjI?t=14642
// Nocturne of Shadow  https://youtu.be/3QvlxoX1GjI?t=17061
// Prelude of Light    https://youtu.be/3QvlxoX1GjI?t=17257
// Song of Storms      https://youtu.be/3QvlxoX1GjI?t=17424
// Requiem of Spirit   https://youtu.be/3QvlxoX1GjI?t=22509

const zeldaNotes = ['A4', 'B4', 'D5', 'F5', 'A5', 'B5', 'D6', 'F6', 'A6']

@Component({
  components: { Drawer, SynthKeys },
})
export default class Home extends Vue {
  drawerActive: boolean = false

  // Layout

  layoutSelected = 'n64'
  layoutOptions = [
    { label: 'Pad', value: 'pad' },
    // { label: 'Rotated', value: '_rotated' },
    { label: 'N64', value: 'n64' },
    // { label: 'Buttons', value: '_gamepad' },
  ]

  get layoutSelectedIndex() {
    return this.layoutOptions.findIndex(o => o.value === this.layoutSelected)
  }

  get layoutSelectedLabel() {
    return this.layoutOptions[this.layoutSelectedIndex].label
  }

  get layoutClass() {
    return this.layoutSelected === 'n64' ? '_rotated _gamepad' : ''
  }

  onClickLayoutToggle() {
    const nextIndex = (this.layoutSelectedIndex + 1) % this.layoutOptions.length
    this.layoutSelected = this.layoutOptions[nextIndex].value
  }
}
</script>
