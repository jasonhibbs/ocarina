<script setup lang="ts">
import { useTemplateRef, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { synthLayouts, useUiStore } from '@/stores/ui'
import { useAudioStore } from '@/stores/audio'
import AppDrawer from '@/components/AppDrawer.vue'
import IconOcarina from '@/components/IconOcarina.vue'
import IconClose from '@/components/IconClose.vue'
import IconSymbol from '@/components/IconSymbol.vue'
import InlineSelect from '@/components/InlineSelect.vue'
import { copyDebugLog, debugEnabled, debugLines, rawBeep } from '@/debug'

const strings = {
  dialogAriaLabel: 'Ocarina Settings',
  appTitle: 'Ocarina',
  reloadHint:
    'Screws fall out all the time. Reloading Ocarina should get the sound going again.',
  reloadButtonLabel: 'Reload',
  layoutFormLabel: 'Layout',
  hintTextTitle: 'How to Play',
  hintText: [
    'Unmute your device and tap the buttons to play the notes, little touchscreens are best.',
    'Audio is ready when the dot is green. Red means something broke.',
    'On a QWERTY keyboard, keys S to L play C5 to C6.',
    'The Pad layout runs in semitones left to right, each row a fourth above the last, like the strings of a bass.',
    'The N64 layout is wholly nostalgic. The A button is D5, C-Up is D6.',
    'The Switch 2 layout moves A to L, and the C buttons to R, Y, X and A.',
  ],
}

const ui = useUiStore()
const { drawerExpanded, synthLayout } = storeToRefs(ui)
const audio = useAudioStore()

// Environment classes used by the stylesheet

const isStandalone = useMediaQuery('(display-mode: standalone)')
const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
document.documentElement.classList.toggle('is-ios', isIos)
watchEffect(() => {
  document.documentElement.classList.toggle('is-app', isStandalone.value)
})

// Drawer

const drawer = useTemplateRef('drawer')

function afterDrawerEnter() {
  drawer.value?.focusFirstInContent()
}

function onClickReload() {
  location.reload()
}
</script>

<template>
  <RouterView />

  <Transition name="drawer-slide" @after-enter="afterDrawerEnter">
    <AppDrawer
      v-if="drawerExpanded"
      id="drawer"
      ref="drawer"
      role="dialog"
      :aria-label="strings.dialogAriaLabel"
      @click-overlay="drawerExpanded = false"
      @overscroll-down="drawerExpanded = false"
    >
      <template #header>
        <h1>
          <IconOcarina class="_gradient" />
          <span>{{ strings.appTitle }}</span>
        </h1>
        <button
          class="_inner"
          aria-controls="drawer"
          :aria-expanded="drawerExpanded"
          @click="drawerExpanded = false"
        >
          <IconClose />
        </button>
      </template>

      <div v-if="audio.error" class="message _error">
        <div class="message-content">
          <pre>{{ audio.error }}</pre>
          <p>{{ strings.reloadHint }}</p>
          <button @click="onClickReload">
            {{ strings.reloadButtonLabel }}
          </button>
        </div>
      </div>

      <div class="message">
        <div class="message-content">
          <h2>{{ strings.hintTextTitle }}</h2>
          <p v-for="string in strings.hintText" :key="string">{{ string }}</p>
        </div>
      </div>

      <form class="form-blocks" @submit.prevent>
        <div class="form-block _select">
          <label
            id="label-layout-select"
            class="form-block-label"
            for="layout-select"
            >{{ strings.layoutFormLabel }}</label
          >
          <div class="form-block-controls">
            <div class="form-block-control">
              <InlineSelect
                id="layout-select"
                v-model="synthLayout"
                aria-labelledby="label-layout-select"
                :options="synthLayouts"
              />
            </div>
          </div>
        </div>
      </form>

      <div class="message _key _is-ios _isnt-app">
        <img
          class="message-thumbnail"
          src="/img/icons/apple-touch-icon-precomposed.png"
          alt=""
        />
        <div class="message-content">
          <p>
            Install Ocarina by tapping
            <IconSymbol name="square.and.arrow.up" /> and then "Add to
            Home Screen <IconSymbol name="plus.app" />"
          </p>
        </div>
      </div>

      <footer>
        <p>
          Based on the
          <a href="https://zelda.gamepedia.com/Ocarina_of_Time_(Item)"
            >Ocarina of Time</a
          >
        </p>
        <p>
          Built with <a href="https://tonejs.github.io/">Tone</a> and
          <a href="https://vuejs.org/">Vue</a>
        </p>
        <p>
          Running on
          <a href="https://github.com/jasonhibbs/ocarina">GitHub</a> and
          <a href="https://www.netlify.com/">Netlify</a>
        </p>
        <p class="vcard h-card">
          Made by
          <a class="p-name u-url fn url" href="https://jasonhibbs.co.uk"
            >Jason Hibbs</a
          >
        </p>
      </footer>
    </AppDrawer>
  </Transition>

  <div v-if="debugEnabled" class="debug-panel">
    <div class="debug-buttons">
      <button @click="rawBeep">Raw beep</button>
      <button @click="copyDebugLog">Copy log</button>
    </div>
    <pre>{{ debugLines.join('\n') }}</pre>
  </div>
</template>

<style>
.debug-panel {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 1000;
  height: 35vh;
  overflow: auto;
  padding: 8px;
  background: rgb(0 0 0 / 0.85);
  color: #0f0;
  font:
    10px/1.3 ui-monospace,
    monospace;
  -webkit-user-select: text;
  user-select: text;
}
.debug-panel pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.debug-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}
.debug-buttons button {
  font-size: 14px;
  padding: 6px 10px;
}
</style>
