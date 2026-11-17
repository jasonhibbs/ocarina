<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'

export interface InlineSelectOption<V extends string = string> {
  label: string
  value: V
}

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id?: string
  ariaLabelledby?: string
  options: readonly InlineSelectOption<T>[]
}>()

const model = defineModel<T>()

// Function refs keep index order (array refs in v-for don't guarantee it).
const optionEls: HTMLElement[] = []

const currentIndex = computed(() =>
  props.options.findIndex((o) => o.value === model.value)
)

function selectOptionByIndex(newIndex: number) {
  const length = props.options.length
  const safeIndex = (length + newIndex) % length
  optionEls[safeIndex]?.focus()
  model.value = props.options[safeIndex]?.value
}

function onChange(e: Event) {
  model.value = (e.target as HTMLSelectElement).value as T
}
</script>

<template>
  <div class="inline-select">
    <div
      class="input inline-select-field"
      role="radiogroup"
      :aria-labelledby="ariaLabelledby"
    >
      <div class="inline-select-options">
        <div
          v-for="(option, index) in options"
          :ref="(el) => (optionEls[index] = el as HTMLElement)"
          :key="option.value"
          class="inline-select-option"
          role="radio"
          :aria-checked="option.value === model"
          :tabindex="option.value === model ? 0 : -1"
          @keydown.left="selectOptionByIndex(currentIndex - 1)"
          @keydown.right="selectOptionByIndex(currentIndex + 1)"
          @click="selectOptionByIndex(index)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>

    <div class="inline-select-control">
      <select
        :id="id"
        :value="model"
        tabindex="-1"
        v-bind="$attrs"
        @input="onChange"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>
