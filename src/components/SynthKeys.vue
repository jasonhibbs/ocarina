<template lang="pug">

  .synth-keys(
    ref="keyboard"
    :class="{ _zelda: zelda }"
    @touchstart="onTouchstart"
    @touchmove="onTouchmove"
  )
    .synth-keys-inner
      synth-key(
        v-for="note in notes"
        ref="keys"
        :key="note"
        :note="note"
        :title="synthKeyTitle(note)"
        :aria-pressed="isAriaPressed(note)"
        @mousedown.native="onMousedown(note)"
        @mouseenter.native="onMouseenter(note)"
      )

</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { mapState } from 'vuex'
import * as Tone from 'tone'
import SynthKey from '@/components/SynthKey.vue'
// import * as unmuteIosAudio from 'unmute-ios-audio'

interface SynthNote {
  note: string
  identifier: string | number
}

const defaultNotes = () => {
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const firstLetterIndex = 3
  const firstNumberIndex = 4
  const length = 20
  const notes = []

  for (let i = 0; i < length; i++) {
    const count = firstLetterIndex + i
    const thisLetter = letters[count % letters.length]
    const thisNumber = firstNumberIndex + Math.floor(count / letters.length)
    const note = `${thisLetter}${thisNumber}`
    notes.push(note)
  }

  return notes
}

@Component({
  components: { SynthKey },
  computed: mapState(['audio']),
})
export default class SynthKeys extends Vue {
  @Prop({ default: defaultNotes }) notes!: string[]
  @Prop({ default: false }) zelda!: boolean
  @Ref('keyboard') readonly keyboardEl!: HTMLElement
  @Ref() readonly keys!: SynthKey[]

  // Lifecycle

  audio!: any
  isStarted = false

  async checkStarted() {
    if (!this.isStarted) {
      this.isStarted = true
      await Tone.start()
      this.setupSynth()
      return
    }

    if (this.audio.context.state !== 'running') {
      this.$emit('error', 'Error: The audio was stopped by something.')
      Tone.start()
    }
  }

  mounted() {
    this.$store.commit('audio', {
      key: 'context',
      value: new Tone.Context(),
    })
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
    document.documentElement.removeEventListener('keydown', this.onKeydown)
    document.documentElement.removeEventListener('keyup', this.onKeyup)
  }

  // UI

  isAriaPressed(note: string) {
    return !!this.activeNotes.find(n => n.note === note)
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
    decay: 0.6,
    wet: 0.6,
  }

  async setupSynth() {
    this.synth = new Tone.Synth()
    this.synth.set(this.synthOptions)
    try {
      this.synthReverb = new Tone.Reverb(this.synthReverbOptions)
      this.synthVibrato = new Tone.Vibrato(5, 0.1666)
      this.synth.chain(this.synthReverb, this.synthVibrato, Tone.Destination)
    } catch (e) {
      console.warn('Couldn’t add reverb or vibrato:', e)
      this.synth.toDestination()
    }
  }

  playNote(note: string) {
    if (this.audio.context.state !== 'running') {
      this.audio.context.resume()
    }

    if (this.synth) {
      try {
        this.synth.triggerAttack(note)
        this.$emit('play', this.audio.context.state)
      } catch (error) {
        this.$emit('error', error)
      }
    }
  }

  stopSynth() {
    if (this.synth) {
      this.synth.triggerRelease()
      this.$emit('stop')
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  // Active Notes

  activeNotes: SynthNote[] = []

  pushActiveNote(note: SynthNote) {
    const index = this.activeNotes.findIndex(
      n => n.identifier === note.identifier
    )
    if (index === -1) {
      this.activeNotes.push(note)
    }
  }

  updateActiveNote(newNote: SynthNote) {
    const index = this.activeNotes.findIndex(
      n => n.identifier === newNote.identifier
    )
    const activeNote = this.activeNotes[index]
    if (activeNote && activeNote.note !== newNote.note) {
      this.activeNotes.splice(index, 1, newNote)
    }
  }

  removeActiveNote(identifier: SynthNote['identifier']) {
    const index = this.activeNotes.findIndex(n => n.identifier === identifier)
    if (index > -1) {
      this.activeNotes.splice(index, 1)
    }
  }

  @Watch('activeNotes', { immediate: true, deep: true })
  onActiveNotesChanged(newNotes: any[], oldNotes: any[]) {
    const lastNote = newNotes[newNotes.length - 1]
    if (lastNote) {
      this.playNote(lastNote.note)
    } else {
      this.stopSynth()
    }
  }

  // Helpers

  getKeyFromPoint(x: number, y: number) {
    const el = document.elementFromPoint(x, y)
    return this.keys.find(k => k.$el === el)
  }

  // Touch

  neverTouched = true
  activeTouches: any[] = []

  copyTouch(touch: Touch) {
    const { identifier, pageX, pageY } = touch
    return { identifier, pageX, pageY, note: '' }
  }

  onTouchstart(e: TouchEvent) {
    this.checkStarted()
    e.preventDefault()

    // this doesn’t help
    if (this.audio.context.state !== 'running') {
      this.audio.context.resume()
      // Tone.start()
    }

    const touches = e.changedTouches
    for (const touch of touches) {
      const key = this.getKeyFromPoint(touch.pageX, touch.pageY)
      if (key) {
        this.pushActiveNote({ note: key.note, identifier: touch.identifier })
      }
    }
  }

  onTouchmove(e: TouchEvent) {
    e.preventDefault()
    const touches = e.changedTouches
    for (const touch of touches) {
      const key = this.getKeyFromPoint(touch.pageX, touch.pageY)
      if (key) {
        this.updateActiveNote({ note: key.note, identifier: touch.identifier })
      }
    }
  }

  onTouchend(e: TouchEvent) {
    const touches = e.changedTouches
    for (const touch of touches) {
      this.removeActiveNote(touch.identifier)
    }
  }

  // Mouse

  isMousedown = false

  onMousedown(note: string) {
    this.checkStarted()
    this.isMousedown = true
    this.pushActiveNote({ note, identifier: 'mouse' })
  }

  onMouseenter(note: string) {
    if (this.isMousedown) {
      this.updateActiveNote({ note, identifier: 'mouse' })
    }
  }

  onMouseup() {
    this.isMousedown = false
    this.removeActiveNote('mouse')
  }

  // Keyboard

  // prettier-ignore
  keyboardKeys: any[] = [
    { code: 'KeyA',        note: 'B4'  },
    { code: 'KeyS',        note: 'C5'  },
    { code: 'KeyD',        note: 'D5'  },
    { code: 'KeyF',        note: 'E5'  },
    { code: 'KeyG',        note: 'F5'  },
    { code: 'KeyH',        note: 'G5'  },
    { code: 'KeyJ',        note: 'A5'  },
    { code: 'KeyK',        note: 'B5'  },
    { code: 'KeyL',        note: 'C6'  },
    { code: 'Semicolon',   note: 'D6'  },
    { code: 'Quote',       note: 'E6'  },
    { code: 'Backslash',   note: 'F6'  },
    { code: 'KeyE',        note: 'C#5' },
    { code: 'KeyR',        note: 'D#5' },
    { code: 'KeyY',        note: 'F#5' },
    { code: 'KeyU',        note: 'G#5' },
    { code: 'KeyI',        note: 'A#5' },
    { code: 'KeyP',        note: 'C#6' },
    { code: 'BracketLeft', note: 'D#6' },
  ]

  synthKeyTitle(note: string) {
    const keyForNote = this.keyboardKeys.find(k => k.note === note)
    const keyLabel = keyForNote
      ? keyForNote.code.replace(/([A-Z])/g, ' $1').slice(1)
      : ''
    return !keyLabel ? note : `${note} (${keyLabel})`
  }

  get keyboardKeyCodes() {
    return this.keyboardKeys.map(k => k.code)
  }

  onKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      return
    }
    const code = e.code
    const index = this.keyboardKeyCodes.findIndex(k => k === code)
    if (index > -1) {
      e.preventDefault()
      this.checkStarted()
      const key = this.keyboardKeys[index]
      this.pushActiveNote({ note: key.note, identifier: key.code })
    }
  }

  onKeyup(e: KeyboardEvent) {
    const code = e.code
    if (this.keyboardKeyCodes.includes(code)) {
      this.removeActiveNote(code)
    }
  }
}
</script>
