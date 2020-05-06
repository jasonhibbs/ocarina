import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    audio: {
      context: null,
    },
    ui: {
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
  mutations: {},
  actions: {},
  modules: {},
})
