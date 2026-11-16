<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useEventListener } from '@vueuse/core'

const emit = defineEmits<{
  clickOverlay: []
  overscrollDown: []
}>()

const card = useTemplateRef('card')
const content = useTemplateRef('content')

const isCardAtTop = () => card.value?.scrollTop === 0

function focusFirstInContent() {
  const first = content.value?.querySelector<HTMLElement>(
    '[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  first?.focus()
}

defineExpose({ focusFirstInContent })

// Touch: pulling down from the top of the card closes the drawer

let initialTouchY = 0

function onTouchstart(e: TouchEvent) {
  initialTouchY = e.touches[0]?.pageY ?? 0
}

function onTouchmove(e: TouchEvent) {
  const delta = (e.touches[0]?.pageY ?? 0) - initialTouchY
  if (isCardAtTop() && delta > 30) {
    emit('overscrollDown')
  }
}

useEventListener(document.documentElement, ['touchend', 'touchcancel'], () => {
  initialTouchY = 0
})

// Wheel: scrolling up past the top closes the drawer

function onWheel(e: WheelEvent) {
  if (isCardAtTop() && e.deltaY < -42) {
    emit('overscrollDown')
  }
}
</script>

<template>
  <div class="drawer">
    <div class="drawer-overlay" @click="emit('clickOverlay')"></div>
    <div class="drawer-card-wrap">
      <div
        ref="card"
        class="drawer-card"
        @wheel.passive="onWheel"
        @touchstart.passive="onTouchstart"
        @touchmove.passive="onTouchmove"
      >
        <div class="drawer-header">
          <slot name="header" />
        </div>
        <div ref="content" class="drawer-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
