<template lang="pug">

  .inline-select

    .input.inline-select-field(
      role="presentation"
      :class="fieldClasses"
    )
      .inline-select-options
        .inline-select-option(
          v-for="option in options"
          :class="optionClasses(option)"
          :tabindex="option.value === value ? 0 : -1"
          @keydown.left="onKeyupLeft"
          @keydown.right="onKeyupRight"
          @click="onClickOption(option)"
        ) {{ option.label }}

    .inline-select-control
      select(
        ref="control"
        :id="id"
        :value="value"
        tabindex="-1"
        v-bind="$attrs"
        v-on="listeners"
      )
        option(
          v-for="option in options"
          :value="option.value"
        ) {{ option.label }}

</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

interface inlineSelectOption {
  label: string
  value: string
}

@Component({
  inheritAttrs: false,
})
export default class InlineSelect extends Vue {
  @Prop() id?: string
  @Prop() value?: string
  @Prop() options!: inlineSelectOption[]

  get listeners() {
    return {
      ...this.$listeners,
      input: (e: any) => this.$emit('input', e.target.value),
      focus: () => (this.isFocussed = true),
      blur: () => (this.isFocussed = false),
    }
  }

  isFocussed: boolean = false

  get fieldClasses() {
    return {
      _focus: this.isFocussed,
    }
  }

  optionClasses(option: inlineSelectOption) {
    return {
      _active: option.value === this.value,
      _focus: this.isFocussed && option.value === this.value,
    }
  }

  onClickOption(option: inlineSelectOption) {
    this.$emit('input', option.value)
  }

  onKeyupLeft(e: any) {
    const currentIndex = this.options.findIndex(o => this.value === o.value)
    const nextIndex =
      currentIndex === 0 ? this.options.length - 1 : currentIndex - 1
    const nextValue = this.options[nextIndex].value
    this.$emit('input', nextValue)
  }

  onKeyupRight(e: any) {
    const currentIndex = this.options.findIndex(o => this.value === o.value)
    const nextIndex = (currentIndex + 1) % this.options.length
    const nextValue = this.options[nextIndex].value
    this.$emit('input', nextValue)
  }
}
</script>
