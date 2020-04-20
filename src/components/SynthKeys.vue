<template lang="pug">

  .synth-keys(
    @touchstart="onTouchstart"
    @touchmove="onTouchmove"
  )
    synth-key(
      v-for="note in notes"
      ref="keys"
      :key="note"
      :note="note"
      :aria-pressed="!!activeTouchNotes.find(n => n === note)"
      @mousedown.native="onMousedown(note)"
      @mouseenter.native="onMouseenter(note)"
    )


</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import * as Tone from 'tone/Tone'
import SynthKey from '@/components/SynthKey.vue'

const defaultNotes = ['A4', 'B4', 'D5', 'F5', 'A5', 'B5', 'D6', 'F6', 'A6']

@Component({ components: { SynthKey } })
export default class SynthKeys extends Vue {
  @Prop({ default: defaultNotes }) notes!: string[]
  @Ref() readonly keys!: SynthKey[]

  // Lifecycle

  mounted() {
    this.synth = new Tone.Synth(this.synthOptions).chain(this.synthVibrato)
    document.documentElement.addEventListener('touchend', this.onTouchend)
    document.documentElement.addEventListener('touchcancel', this.onTouchend)
    document.documentElement.addEventListener('mouseup', this.onMouseup)
  }

  beforeDestroy() {
    document.documentElement.removeEventListener('touchend', this.onTouchend)
    document.documentElement.removeEventListener('touchcancel', this.onTouchend)
    document.documentElement.removeEventListener('mouseup', this.onMouseup)
  }

  // Synth

  synth: any
  synthOptions = {
    // portamento: 0.01,
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.2,
      attackCurve: 'linear',
      decay: 0.8,
      sustain: 0.8,
      release: 0.9,
    },
  }
  synthVibrato = new Tone.Vibrato(5, 0.1).toDestination()

  playNote(note: string) {
    if (this.synth) this.synth.triggerAttack(note)
  }

  stopSynth() {
    if (this.synth) this.synth.triggerRelease()
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  }

  // Helpers

  getKeyFromPoint(x: number, y: number) {
    const el = document.elementFromPoint(x, y)
    return this.keys.find(k => k.$el === el)
  }

  // Touch

  activeTouches: any[] = []

  copyTouch(touch: Touch) {
    const { identifier, pageX, pageY } = touch
    return { identifier, pageX, pageY, note: '' }
  }

  onTouchstart(e: TouchEvent) {
    e.preventDefault()
    const touches = e.changedTouches

    for (var i = 0; i < touches.length; i++) {
      const copy = this.copyTouch(touches[i])
      const key = this.getKeyFromPoint(copy.pageX, copy.pageY)
      if (key) {
        copy.note = key.note
      }
      this.activeTouches.push(copy)
    }
  }

  onTouchmove(e: TouchEvent) {
    e.preventDefault()
    const touches = e.changedTouches

    for (var i = 0; i < touches.length; i++) {
      const touch = touches[i]
      const index = this.activeTouches.findIndex(
        t => t.identifier === touch.identifier
      )
      if (index > -1) {
        const copy = this.copyTouch(touch)
        const key = this.getKeyFromPoint(copy.pageX, copy.pageY)
        if (key) {
          copy.note = key.note
        }
        this.activeTouches.splice(index, 1, copy)
      }
    }
  }

  onTouchend(e: TouchEvent) {
    e.preventDefault()
    const touches = e.changedTouches

    for (var i = 0; i < touches.length; i++) {
      const touch = touches[i]
      const index = this.activeTouches.findIndex(
        t => t.identifier === touch.identifier
      )

      if (index > -1) {
        this.activeTouches.splice(index, 1)
      }
    }
  }

  get activeTouchNotes() {
    return this.activeTouches.map(t => t.note)
  }

  @Watch('activeTouchNotes', { immediate: true, deep: true })
  onTouchNotesChanged(newNotes: any[], oldNotes: any[]) {
    const lastNote = newNotes[newNotes.length - 1]
    if (lastNote) {
      this.playNote(lastNote)
    } else {
      this.stopSynth()
    }
  }

  // Mouse

  isMousedown = false

  onMousedown(note: string) {
    this.isMousedown = true
    this.playNote(note)
  }

  onMouseenter(note: string) {
    if (this.isMousedown) {
      this.playNote(note)
    }
  }

  onMouseup() {
    this.isMousedown = false
    this.stopSynth()
  }
}
</script>
