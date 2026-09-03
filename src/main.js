import './assets/main.css'
// Load the global CSS used throughout the website

import { createApp } from 'vue'
// Start VUE

import App from './App.vue'
// Load the main App component
import router from './router'
// Load the router for page navigation

import {
  applySavedTextSize,
} from '@/services/textSizeService'
// Load the function to apply the saved text size preference

applySavedTextSize()
// Apply the local saved text size preference when the app starts

createApp(App)
  .use(router)
  .mount('#app')
// Create the VUE app, use the router, and mount it to the DOM element with the ID 'app'