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
        :aria-label="strings.dialogAriaLabel"
        @clickoverlay="ui.drawerExpanded = false"
        @overscrolldown="ui.drawerExpanded = false"
      )
        template(#header)
          h1
            icon-ocarina
            span {{ strings.appTitle }}
          button._inner(
            aria-controls="drawer"
            :aria-expanded="ui.drawerExpanded"
            @click="ui.drawerExpanded = false"
          )
            icon-close

        template(#default)
          .error(v-if="ui.synthError")
            pre {{ ui.synthError }}
            p {{ strings.reloadHint }}
            button(@click="onClickReload") {{ strings.reloadButtonLabel }}

          .form-blocks
            .form-block._select
              label.form-block-label(for="layout-select") {{ strings.layoutFormLabel }}
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

          footer
            p Based on the #[a(href="https://zelda.gamepedia.com/Ocarina_of_Time_(Item)") Ocarina of Time]
            p Built with #[a(href="https://tonejs.github.io/") Tone] and #[a(href="https://vuejs.org/") Vue], running on #[a(href="https://www.netlify.com/") Netlify]
            p.vcard.h-card Made by #[a.p-name.u-url.fn.url(href="https://jasonhibbs.co.uk") Jason Hibbs]

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

  strings = {
    dialogAriaLabel: `Ocarina Settings`,
    appTitle: `Ocarina`,
    reloadHint: `Screws fall out all the time. Reloading Ocarina should get the sound going again.`,
    reloadButtonLabel: `Reload`,
    layoutFormLabel: `Layout`,
  }

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

  onClickReload() {
    location.reload()
  }
}
</script>
