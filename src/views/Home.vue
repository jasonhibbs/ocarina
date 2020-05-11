<template lang="pug">

  .screen

    header
      button._inner(
        :title="strings.layoutToggleLabel"
        @click="onClickLayoutToggle"
      )
        icon-layout(
          :class="ui.synthLayout === 'n64' ? '_circles' : '_squares'"
        )

      h1.visuallyhidden Ocarina

      .status(:data-state="status")
        .visuallyhidden {{ strings.audioStatusLabel }}

      button._inner(
        :title="strings.aboutButtonTitle"
        aria-controls="drawer"
        :aria-expanded="drawerExpanded"
        @click="drawerExpanded = true"
      )
        icon-ocarina

    main
      synth-keys(
        :class="synthLayoutClass"
        @play="onPlay"
        @error="onError"
      )

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { mapState } from 'vuex'
import IconOcarina from '@/components/IconOcarina.vue'
import IconLayout from '@/components/IconLayout.vue'
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
    SynthKeys,
  },
  computed: mapState(['audio', 'ui']),
})
export default class Home extends Vue {
  ui!: any

  get strings() {
    return {
      layoutToggleLabel: `Layout: ${this.synthLayoutLabel}`,
      audioStatusLabel: `Audio Status: ${this.audioContextState}`,
      aboutButtonTitle: `About Ocarina`,
    }
  }

  get drawerExpanded() {
    return this.ui.drawerExpanded
  }

  set drawerExpanded(value) {
    this.$store.dispatch('expandDrawer', value)
  }

  // Audio

  audio!: any
  playState = ''

  get audioContextState() {
    return this.playState
  }

  get status() {
    let state = null

    if (this.audioContextState === 'running') {
      state = 'good'
    }

    if (!this.playState && this.audioContextState === 'suspended') {
      state = 'indeterminate'
    }

    if (this.ui.synthError) {
      state = 'bad'
    }

    return state
  }

  onPlay(currentState: string) {
    this.playState = currentState || this.playState
    if (this.ui.synthError) {
      this.$store.commit('ui', {
        key: 'synthError',
        value: '',
      })
    }
  }

  onError(catchError: any) {
    this.$store.commit('ui', {
      key: 'synthError',
      value: catchError,
    })
  }

  // Layout

  get layoutsIndex() {
    return this.ui.synthLayouts.findIndex(
      (o: any) => o.value === this.ui.synthLayout
    )
  }

  get synthLayoutLabel() {
    const options = this.ui.synthLayouts || []
    return this.ui.synthLayouts[this.layoutsIndex]?.label || ''
  }

  get synthLayoutClass() {
    return this.ui.synthLayout === 'n64' ? '_rotated _gamepad' : ''
  }

  onClickLayoutToggle() {
    const nextIndex = (this.layoutsIndex + 1) % this.ui.synthLayouts.length
    this.$store.commit('ui', {
      key: 'synthLayout',
      value: this.ui.synthLayouts[nextIndex].value,
    })
  }
}
</script>
