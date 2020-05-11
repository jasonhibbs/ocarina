import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

interface GenericMutation {
  key: string
  value: any
}

export default new Vuex.Store({
  state: {
    audio: {
      context: null,
    },
    ui: {
      reloading: false,
      worker: null,
      updateAvailable: false,
      drawerExpanded: false,
      synthError: '',
      synthLayout: 'n64',
      synthLayouts: [
        { label: 'Pad', value: 'pad' },
        { label: 'N64', value: 'n64' },
      ],
    },
  },
  mutations: {
    audio(state, m: GenericMutation) {
      const audio = state.audio as any
      audio[m.key] = m.value
    },
    ui(state, m: GenericMutation) {
      const ui = state.ui as any
      ui[m.key] = m.value
    },
    drawerExpanded(state, value) {
      state.ui.drawerExpanded = value
    },
  },
  actions: {
    expandDrawer({ commit }, value) {
      document.documentElement.classList.toggle('screen-modal', value)
      commit('drawerExpanded', value)
    },
  },
  modules: {},
})
