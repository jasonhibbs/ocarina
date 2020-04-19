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
      @mousedown.native="onMousedown(note)"
      @mouseenter="onMouseenter(note)"
      @touchenter="onTouchenter(note)"
    )


</template>
<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator'
import * as Tone from 'tone/Tone'
import SynthKey from '@/components/SynthKey.vue'

const defaultNotes = ['A4', 'B4', 'D5', 'F5', 'A5', 'B5', 'D6', 'F6', 'A6']

@Component({ components: { SynthKey } })
export default class SynthKeys extends Vue {
  @Ref() readonly keys!: SynthKey[]
  @Prop({ default: defaultNotes }) notes!: string[]

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

  isMousedown = false
  isTouchdown = false
  isPlayingNote = ''

  vibrato = new Tone.Vibrato(5, 0.1).toDestination()

  mounted() {
    this.synth = new Tone.Synth(this.synthOptions).chain(this.vibrato)
    document.documentElement.addEventListener('mouseup', this.onMouseup)
    document.documentElement.addEventListener('touchend', this.onTouchend)
  }

  playNote(note: string) {
    if (note !== this.isPlayingNote) {
      this.isPlayingNote = note
      this.synth.triggerAttack(note)
    }
  }

  stopSynth() {
    this.isPlayingNote = ''
    this.synth.triggerRelease()
  }

  getKeyFromPoint(x: number, y: number) {
    const el = document.elementFromPoint(x, y)
    return this.keys.find(k => k.$el === el)
  }

  getLastTouch(e: TouchEvent) {
    return e.touches[e.touches.length - 1]
  }

  onTouchstart(e: any) {
    this.isTouchdown = true
  }

  onTouchend(e: TouchEvent) {
    if (e.touches.length) {
      const touch = this.getLastTouch(e)
      if (this.getKeyFromPoint(touch.clientX, touch.clientY)) {
        return
      }
    }
    this.isTouchdown = false
    this.stopSynth()
  }

  onTouchmove(e: TouchEvent) {
    const touch = this.getLastTouch(e)
    const key = this.getKeyFromPoint(touch.clientX, touch.clientY)
    if (key) {
      key.$emit('touchenter', key.note)
    }
  }

  onTouchenter(note: string) {
    this.playNote(note)
  }

  onMousedown(note?: string) {
    this.isMousedown = true
    if (note) {
      this.playNote(note)
    }
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
