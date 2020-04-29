<template lang="pug">

  #app
    router-view

    transition(name="drawer-slide")
      drawer#drawer(
        v-if="drawerExpanded"
        @clickoverlay="drawerExpanded = false"
        @overscrolldown="drawerExpanded = false"
      )
        template(#header)
          h1
            icon-ocarina
            span Ocarina
          button._inner(
            aria-controls="drawer"
            :aria-expanded="drawerExpanded"
            @click="drawerExpanded = false"
          )
            icon-close

        template(#default)
          .error(v-if="errorText")
            pre {{ errorText }}
            p Don’t worry if this means nothing to you, reloading Ocarina may help.
            button(@click="onClickReload") Reload

          .form-blocks
            .form-block._select
              label.form-block-label(for="layout-select") Layout
              .form-block-controls
                .form-block-control
                  select(
                    id="layout-select"
                    v-model="ui.synthLayout"
                  )
                    option(
                      v-for="layout in ui.synthLayouts"
                      :value="layout.value"
                    ) {{ layout.label }}

</template>

<style lang="scss" src="@/assets/scss/style.scss"></style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { mapState } from 'vuex'
import Drawer from '@/components/Drawer.vue'
import IconOcarina from '@/components/IconOcarina.vue'
import IconClose from '@/components/IconClose.vue'

@Component({
  components: {
    Drawer,
    IconOcarina,
    IconClose,
  },
  computed: mapState(['ui']),
})
export default class App extends Vue {
  ui!: any

  get drawerExpanded() {
    return this.ui.drawerExpanded
  }

  set drawerExpanded(value) {
    this.ui.drawerExpanded = value
  }

  // Errors

  errorText = ''

  onError(e: any) {
    this.errorText = e
  }

  onClickReload() {
    location.reload()
  }
}
</script>
