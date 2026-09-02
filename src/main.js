import './assets/main.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

import {
  applySavedTextSize,
} from '@/services/textSizeService'

applySavedTextSize()

createApp(App)
  .use(router)
  .mount('#app')
