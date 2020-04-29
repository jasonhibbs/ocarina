<template lang="pug">

  #app
    router-view

    transition(
      name="drawer-slide"
      @after-enter="afterDrawerEnter"
    )
      drawer#drawer(
        v-if="ui.drawerExpanded"
        ref="drawer"
        role="dialog"
        aria-label="Ocarina Settings"
        @clickoverlay="ui.drawerExpanded = false"
        @overscrolldown="ui.drawerExpanded = false"
      )
        template(#header)
          h1
            icon-ocarina
            span Ocarina
          button._inner(
            aria-controls="drawer"
            :aria-expanded="ui.drawerExpanded"
            @click="ui.drawerExpanded = false"
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
import { Component, Ref, Watch, Vue } from 'vue-property-decorator'
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
  @Ref() readonly drawer!: Drawer

  ui!: any

  @Watch('ui.drawerExpanded', { immediate: true })
  onDrawerChanged(newVal: boolean, oldVal: boolean) {
    const root = document.documentElement
    const appleTitle = root.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    )

    if (newVal) {
      root.classList.add('screen-modal')
      appleTitle?.setAttribute('content', 'black-translucent')
    } else {
      document.documentElement.classList.remove('screen-modal')
      appleTitle?.setAttribute('content', 'default')
    }
  }

  afterDrawerEnter() {
    this.drawer.focusFirstinContent()
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
