<template lang="pug">

  .drawer
    .drawer-overlay(
      @click="$emit('clickoverlay')"
    )
    .drawer-card-wrap
      nav.drawer-card(
        ref="scroller"
        @mousewheel="onWheel"
        @touchstart="onTouchstart"
        @touchmove="onTouchmove"
      )
        .drawer-header(ref="header")
          slot(name="header")
        .drawer-content(ref="content")
          slot


</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'

@Component
export default class Drawer extends Vue {
  @Ref('scroller') readonly scrollingElement!: HTMLElement

  // LIfecycle

  mounted() {
    document.documentElement.addEventListener('touchend', this.onTouchend)
    document.documentElement.addEventListener('touchcancel', this.onTouchend)

    this.focusFirstinContent()
  }

  beforeDestroy() {
    document.documentElement.removeEventListener('touchend', this.onTouchend)
    document.documentElement.removeEventListener('touchcancel', this.onTouchend)
  }

  focusFirstinContent() {
    const focusable = (this.$refs.content as Element).querySelectorAll(
      '[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    if (first) {
      first.focus()
    }
  }

  // Touch

  initialTouchY: number = 0

  onTouchstart(e: TouchEvent) {
    const firstTouch = e.touches[0]
    this.initialTouchY = firstTouch.pageY
  }

  onTouchmove(e: TouchEvent) {
    const isAtTop = this.scrollingElement?.scrollTop === 0
    const firstTouch = e.touches[0]
    const delta = firstTouch.pageY - this.initialTouchY
    if (isAtTop && delta > 30) {
      this.$emit('overscrolldown')
    }
  }

  onTouchend(e: TouchEvent) {
    this.initialTouchY = 0
  }

  // Mousewheel

  onWheel(e: WheelEvent) {
    const isAtTop = this.scrollingElement?.scrollTop === 0
    if (isAtTop && e.deltaY < -40) {
      this.$emit('overscrolldown')
    }
  }
}
</script>
