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
  --element-color: var(--grey-dark);

  --hover-background-color: var(--contrast-light);
  --hover-element-color: var(--grey-darkest);

  display: inline-block;
  position: relative;
  width: $size;
  height: $size;
  border-radius: $size;
  transition: inherit;
  vertical-align: bottom;

  .--background,
  .--element {
    transition: background-color 0.1s;
  }

  .--background {
    background-color: var(--background-color);
    width: 100%;
    height: 100%;
    border-radius: inherit;
  }

  .--element {
    background-color: var(--element-color);
    position: absolute;
    top: 50%;
    left: 50%;
    width: ($size * 0.525);
    height: 2px;
    border-radius: $size;

    &:first-child {
      transform: translate3d(-50%, -50%, 0) rotateZ(-45deg);
    }
    &:last-child {
      transform: translate3d(-50%, -50%, 0) rotateZ(45deg);
    }
  }

  button:hover &,
  button:focus & {
    .--background {
      background-color: var(--hover-background-color);
    }

    .--element {
      background-color: var(--hover-element-color);
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
