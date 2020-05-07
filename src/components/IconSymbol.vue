<template lang="pug">

  inline-svg.symbol(
    :src="src"
  )

</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import InlineSvg from 'vue-inline-svg'

@Component({ components: { InlineSvg } })
export default class IconSymbol extends Vue {
  @Prop() name!: string

  get src() {
    return `/img/symbols/${this.name}.svg`
  }
}
</script>
