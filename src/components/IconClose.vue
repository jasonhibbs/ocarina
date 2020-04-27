<template lang="pug">

  i.icon-close(:aria-label="ariaLabel")
    div.--background
      span.--element
      span.--element

</template>
<style lang="scss">
.icon-close {
  $size: 1em;

  --background-color: var(--contrast-lighter);
  --element-color: var(--contrast-mid);

  --hover-background-color: var(--contrast-light);
  --hover-element-color: var(--contrast-darkest);

  display: inline-block;
  position: relative;
  top: ($size / -16);
  width: $size;
  height: $size;
  border-radius: $size;
  transition: inherit;
  vertical-align: middle;

  button:hover &,
  button:focus & {
    --background-color: var(--hover-background-color);
    --element-color: var(--hover-element-color);
  }

  .--background,
  .--element {
    transition: background-color 0.1s;
  }

  .--background {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background-color: var(--background-color);
  }
  .--element {
    position: absolute;
    top: 50%;
    left: 50%;
    width: ($size * 0.5);
    height: 2px;
    background-color: var(--element-color);

    &:first-child {
      transform: translate3d(-50%, -50%, 0) rotateZ(-45deg);
    }
    &:last-child {
      transform: translate3d(-50%, -50%, 0) rotateZ(45deg);
    }
  }
}
</style>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class IconClose extends Vue {
  @Prop({ default: 'Close' }) ariaLabel!: string
}
</script>
