<template lang="pug">

  .screen

    header
      button._inner(
        :aria-label="`Layout: ${layoutSelectedLabel}`"
        @click="onClickLayoutToggle"
      )
        icon-layout(
          :class="layoutSelected === 'n64' ? '_circles' : '_squares'"
        )

      button._inner(
        aria-controls="drawer"
        :aria-expanded="drawerActive"
        @click="drawerActive = !drawerActive"
      )
        icon-ocarina

    transition(name="drawer-slide")
      drawer#drawer(
        v-if="drawerActive"
        @clickoverlay="drawerActive = false"
        @overscrolldown="drawerActive = false"
      )
        template(#header)
          h1
            icon-ocarina
            span Ocarina
          button._inner(
            aria-controls="drawer"
            :aria-expanded="drawerActive"
            @click="drawerActive = false"
          )
            icon-close

        template(#default)
          .error(v-if="errorText")
            pre {{ errorText }}

          .form-blocks
            .form-block._select
              label.form-block-label(for="layout-select") Layout
              .form-block-controls
                .form-block-control
                  select(
                    id="layout-select"
                    v-model="layoutSelected"
                  )
                    option(v-for="option in layoutOptions" :value="option.value") {{ option.label }}


    main
      synth-keys(
        :class="layoutClass"
        @error="onError"
      )

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Drawer from '@/components/Drawer.vue'
import IconOcarina from '@/components/IconOcarina.vue'
import IconLayout from '@/components/IconLayout.vue'
import IconClose from '@/components/IconClose.vue'
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
  components: {
    IconOcarina,
    IconLayout,
    IconClose,
    Drawer,
    SynthKeys,
  },
})
export default class Home extends Vue {
  drawerActive: boolean = false
  errorText = ''

  onError(e: any) {
    this.errorText = e
  }

  // Layout

  layoutSelected = 'n64'
  layoutOptions = [
    { label: 'Pad', value: 'pad' },
    { label: 'N64', value: 'n64' },
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
