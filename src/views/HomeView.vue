<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'
import { useAudioStore } from '@/stores/audio'
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

// const zeldaNotes = ['A4', 'B4', 'D5', 'F5', 'A5', 'B5', 'D6', 'F6', 'A6']

const ui = useUiStore()
const { drawerExpanded, synthLayout, synthLayoutLabel } = storeToRefs(ui)

const audio = useAudioStore()

// Layout

const synthLayoutClass = computed(() =>
  synthLayout.value === 'n64' ? '_rotated _gamepad' : ''
)

const strings = computed(() => ({
  layoutToggleLabel: `Layout: ${synthLayoutLabel.value}`,
  audioStatusLabel: `Audio Status: ${audio.contextState}`,
  aboutButtonTitle: 'About Ocarina',
  audioStartLabel: audio.hasRun ? 'Tap to resume sound' : 'Tap to play',
}))
</script>

<template>
  <div class="screen">
    <header>
      <button
        class="_inner"
        :title="strings.layoutToggleLabel"
        @click="ui.cycleSynthLayout()"
      >
        <IconLayout :class="synthLayout === 'n64' ? '_circles' : '_squares'" />
      </button>

      <h1 class="visuallyhidden">Ocarina</h1>

      <div class="status" :data-state="audio.status">
        <div class="visuallyhidden">{{ strings.audioStatusLabel }}</div>
      </div>

      <button
        class="_inner"
        :title="strings.aboutButtonTitle"
        aria-controls="drawer"
        :aria-expanded="drawerExpanded"
        @click="drawerExpanded = true"
      >
        <IconOcarina />
      </button>
    </header>

    <main>
      <SynthKeys :class="synthLayoutClass" />
    </main>

    <!-- Browsers only start audio from a gesture they count as user
         activation, and iOS doesn't count holding a key, so offer a tap
         anywhere. -->
    <button v-if="audio.needsStart" class="audio-start" @click="audio.start()">
      <span class="audio-start-label">{{ strings.audioStartLabel }}</span>
    </button>
  </div>
</template>
