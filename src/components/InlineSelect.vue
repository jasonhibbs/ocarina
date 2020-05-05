<template lang="pug">

  .inline-select

    .input.inline-select-field(
      role="radiogroup"
      :aria-labelledby="ariaLabelledby"
    )
      .inline-select-options
        .inline-select-option(
          v-for="(option, index) in options"
          ref="options"
          role="radio"
          :aria-checked="option.value === value"
          :tabindex="option.value === value ? 0 : -1"
          @keydown.left="onKeyupLeft"
          @keydown.right="onKeyupRight"
          @click="onClickOption(index)"
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
  @Prop() ariaLabelledby?: string
  @Prop() options!: inlineSelectOption[]

  get listeners() {
    return {
      ...this.$listeners,
      input: (e: any) => this.$emit('input', e.target.value),
    }
  }

  get currentIndex() {
    return this.options.findIndex(o => this.value === o.value)
  }

  selectOptionByIndex(newIndex: number) {
    const safeIndex = (this.options.length + newIndex) % this.options.length
    const newValue = this.options[safeIndex].value
    const newOptionEl = (this.$refs.options as HTMLElement[])[safeIndex]
    newOptionEl.focus()
    this.$emit('input', newValue)
  }

  onClickOption(index: number) {
    this.selectOptionByIndex(index)
  }

  onKeyupLeft(e: any) {
    this.selectOptionByIndex(this.currentIndex - 1)
  }

  onKeyupRight(e: any) {
    this.selectOptionByIndex(this.currentIndex + 1)
  }
}
</script>
