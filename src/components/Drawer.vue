<template lang="pug">

  .drawer
    .drawer-overlay(
      @click="$emit('clickoverlay')"
    )
    .drawer-scroll(
      ref="scroll"
    )
      nav.drawer-card(
        @mousewheel="onWheel"
        @touchstart="onTouchstart"
        @touchmove="onTouchmove"
      )
        .drawer-header
          slot(name="header")
        .drawer-content
          slot


</template>
<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'

@Component
export default class Drawer extends Vue {
  @Ref('scroll') readonly scrollingElement!: HTMLElement

  // LIfecycle

  mounted() {
    document.documentElement.addEventListener('touchend', this.onTouchend)
    document.documentElement.addEventListener('touchcancel', this.onTouchend)
  }

  beforeDestroy() {
    document.documentElement.removeEventListener('touchend', this.onTouchend)
    document.documentElement.removeEventListener('touchcancel', this.onTouchend)
  }

  // Touch

  initialTouchY: number = 0

  onTouchstart(e: TouchEvent) {
    const firstTouch = e.touches[0]
    this.initialTouchY = firstTouch.pageY
  }

  onTouchmove(e: TouchEvent) {
    if (!this.scrollingElement) return
    const firstTouch = e.touches[0]
    const delta = firstTouch.pageY - this.initialTouchY
    if (this.scrollingElement.scrollTop === 0 && delta > 30) {
      this.$emit('overscrolldown')
    }
  }

  onTouchend(e: TouchEvent) {
    this.initialTouchY = 0
  }

  // Mousewheel

  onWheel(e: WheelEvent) {
    const src = e.srcElement as HTMLElement
    if (src.scrollTop === 0 && e.deltaY < -30) {
      this.$emit('overscrolldown')
    }
  }
}
</script>
