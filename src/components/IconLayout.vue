<template lang="pug">

  i.icon-layout
    div.--background
      div.--element
      div.--element
      div.--element
      div.--element

</template>
<style lang="scss">
.icon-layout {
  $size: 1em;
  $offset: 1px;

  --element-color: var(--contrast-mid);
  --hover-element-color: var(--contrast-darkest);

  display: inline-block;
  position: relative;
  width: $size;
  height: $size;
  transition: inherit;
  vertical-align: bottom;

  .--background {
    transform: rotateZ(0);
    transition: transform 0.2s;
    width: 100%;
    height: 100%;
  }

  .--element {
    position: absolute;
    transition: background-color 0.1s;
    background-color: var(--element-color);

    &:nth-child(1) {
      top: -$offset;
      left: -$offset;
    }

    &:nth-child(2) {
      top: -$offset;
      right: -$offset;
    }
    &:nth-child(3) {
      bottom: -$offset;
      left: -$offset;
    }
    &:nth-child(4) {
      bottom: -$offset;
      right: -$offset;
    }
  }

  &._squares {
    .--element {
      width: $size * 0.5;
      height: $size * 0.5;
    }
  }

  &._circles {
    .--background {
      transform: rotateZ(135deg);
    }
    .--element {
      border-radius: $size;
      width: $size * 0.5;
      height: $size * 0.5;
    }
  }

  button:hover &,
  button:focus & {
    .--element {
      background-color: var(--hover-element-color);
    }
  }
}
</style>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class IconLayout extends Vue {}
</script>
