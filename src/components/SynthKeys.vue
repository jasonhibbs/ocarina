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
      :aria-pressed="isAriaPressed(note)"
      @mousedown.native="onMousedown(note)"
      @mouseenter.native="onMouseenter(note)"
    )

</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { Destination, Reverb, Synth, Vibrato } from 'tone/Tone'
import SynthKey from '@/components/SynthKey.vue'

const defaultNotes = ['A4', 'B4', 'D5', 'F5', 'A5', 'B5', 'D6', 'F6', 'A6']

@Component({ components: { SynthKey } })
export default class SynthKeys extends Vue {
  @Prop({ default: defaultNotes }) notes!: string[]
  @Ref() readonly keys!: SynthKey[]

  // Lifecycle

  mounted() {
    this.setupSynth()
    document.documentElement.addEventListener('touchend', this.onTouchend)
    document.documentElement.addEventListener('touchcancel', this.onTouchend)
    document.documentElement.addEventListener('mouseup', this.onMouseup)
    document.documentElement.addEventListener('keydown', this.onKeydown)
    document.documentElement.addEventListener('keyup', this.onKeyup)
  }

  beforeDestroy() {
    document.documentElement.removeEventListener('touchend', this.onTouchend)
    document.documentElement.removeEventListener('touchcancel', this.onTouchend)
    document.documentElement.removeEventListener('mouseup', this.onMouseup)
  }

  // UI

  isAriaPressed(note: string) {
    // TODO this could be one array
    const down = !!this.activeNotes.find(n => n === note)
    const touchDown = !!this.activeTouchNotes.find(n => n === note)
    const keyDown = !!this.activeKeys.find(k => k.note === note)
    return down || touchDown || keyDown
  }

  // Synth

  synth: any
  synthOptions = {
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.2,
      attackCurve: 'linear',
      decay: 0.8,
      sustain: 0.8,
      release: 0.8,
    },
  }
  synthVibrato: any
  synthReverb: any
  synthReverbOptions = {
    decay: 0.1,
    wet: 0.3,
  }

  setupSynth() {
    this.synth = new Synth()
    this.synth.set(this.synthOptions)
    this.synthVibrato = new Vibrato(6, 0.1)
    this.synthReverb = new Reverb()
    this.synthReverb.set(this.synthReverbOptions)
    this.synth.chain(this.synthVibrato, this.synthReverb, Destination)
  }

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

  activeNotes: any = []

  @Watch('activeNotes', { immediate: true, deep: true })
  onActiveNotesChanged(newNotes: any[], oldNotes: any[]) {
    const lastNote = newNotes[newNotes.length - 1]
    if (lastNote) {
      this.playNote(lastNote)
    } else {
      this.stopSynth()
    }
  }

  onMousedown(note: string) {
    this.isMousedown = true
    this.activeNotes = [note]
    // this.playNote(note)
  }

  onMouseenter(note: string) {
    if (this.isMousedown) {
      this.activeNotes = [note]
      // this.playNote(note)
    }
  }

  onMouseup() {
    this.isMousedown = false
    this.activeNotes = []
    // this.stopSynth()
  }

  // Keyboard

  keyboardKeys: any[] = [
    { note: 'B4', down: false, code: 'KeyA' },
    { note: 'C5', down: false, code: 'KeyS' },
    { note: 'D5', down: false, code: 'KeyD' },
    { note: 'E5', down: false, code: 'KeyF' },
    { note: 'F5', down: false, code: 'KeyG' },
    { note: 'G5', down: false, code: 'KeyH' },
    { note: 'A5', down: false, code: 'KeyJ' },
    { note: 'B5', down: false, code: 'KeyK' },
    { note: 'C6', down: false, code: 'KeyL' },
    { note: 'D6', down: false, code: 'Semicolon' },
    { note: 'E6', down: false, code: 'Quote' },
    { note: 'F6', down: false, code: 'Backslash' },
  ]

  get keyboardKeyCodes() {
    return this.keyboardKeys.map(k => k.code)
  }

  get activeKeys() {
    return this.keyboardKeys.filter(k => k.down === true)
  }

  @Watch('activeKeys', { immediate: true, deep: true })
  onKeysChanged(newNotes: any[], oldNotes: any[]) {
    const lastNote = newNotes[newNotes.length - 1]
    if (lastNote) {
      this.playNote(lastNote.note)
    } else {
      this.stopSynth()
    }
  }

  onKeydown(e: KeyboardEvent) {
    const code = e.code
    const index = this.keyboardKeyCodes.findIndex(k => k === code)
    if (index > -1) {
      this.keyboardKeys[index].down = true
    }
  }

  onKeyup(e: KeyboardEvent) {
    const code = e.code
    if (this.keyboardKeyCodes.includes(code)) {
      this.keyboardKeys.find(key => key.code === code).down = false
    }
  }
}
</script>
