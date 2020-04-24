<template lang="pug">

  nav.drawer
    .drawer-header
      slot(name="header")
    .drawer-content
      slot


</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Drawer extends Vue {}
</script>
