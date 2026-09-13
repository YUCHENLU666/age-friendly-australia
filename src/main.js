import './assets/main.css'

// Load the global CSS used throughout the website.

import { createApp } from 'vue'

// Start Vue.

import App from './App.vue'

// Load the main App component.

import router from './router'

// Load the router for page navigation.

import {
  applySavedTextSizePreference,
} from '@/services/preferencesService'

// Load the function that applies the saved
// text-size setting from the full Preferences system.

// Apply the saved text-size preference
// when the application starts.
applySavedTextSizePreference()

// Create the Vue application,
// install Vue Router,
// and mount the application
// to the element with id="app".
createApp(App)
  .use(router)
  .mount('#app')