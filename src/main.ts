import 'normalize.css'
import '@/assets/scss/style.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { registerServiceWorker } from './serviceWorker'
import { useAudioStore } from './stores/audio'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Switch to a new version straight away unless someone's playing.
const audio = useAudioStore()
registerServiceWorker({ canReloadNow: () => !audio.hasRun })
