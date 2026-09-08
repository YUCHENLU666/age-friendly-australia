<script setup>
// Import Vue Router components.
import {
  RouterLink,
  RouterView,
  useRoute,
} from 'vue-router'

// Import computed so Vue can automatically
// update the layout when the URL changes.
import { computed } from 'vue'

// Import the navigation bar.
import AppNavbar from '@/components/AppNavbar.vue'

// Get the current route information.
//
// Example:
// /login      -> route.name is "login"
// /            -> route.name is "home"
// /activities  -> route.name is "activities"
const route = useRoute()

// Check whether the current page is the login page.
//
// We use this value to hide the normal website
// navigation bar and footer on /login.
const isLoginPage = computed(
  () => route.name === 'login',
)
</script>

<template>
  <div class="app-shell">

    <!--
      Show the normal navigation bar only
      after the administrator enters the website.

      On /login:
      Navbar is hidden.
    -->
    <AppNavbar v-if="!isLoginPage" />

    <!--
      RouterView displays the page selected
      by src/router/index.js.

      Example:

      /login
          ↓
      LoginView.vue

      /activities
          ↓
      ActivitiesView.vue
    -->
    <main
      id="main-content"
      :class="{
        'main-content': !isLoginPage,
      }"
    >
      <RouterView />
    </main>

    <!--
      The footer is also hidden on the login page.
    -->
    <footer
      v-if="!isLoginPage"
      class="site-footer"
    >
      <div class="page-container footer-main">
        <div class="footer-brand-section">
          <RouterLink
            to="/"
            class="footer-logo"
          >
            <span
              class="footer-logo-mark"
              aria-hidden="true"
            >
              AF
            </span>

            <span>
              Age Friendly Australia
            </span>
          </RouterLink>

          <p>
            Helping older adults discover useful local activities,
            local activities and verified aged-care support services.
          </p>
        </div>

        <nav
          class="footer-navigation"
          aria-label="Footer navigation"
        >
          <div>
            <p class="footer-nav-title">
              Explore
            </p>

            <RouterLink to="/activities">
              Activities
            </RouterLink>

            <RouterLink to="/services">
              Services
            </RouterLink>

            <RouterLink to="/saved">
              Saved items
            </RouterLink>
          </div>
        </nav>
      </div>

      <div class="page-container footer-bottom">
        <p>
          Privacy-aware by design. Sensitive personal information and
          detailed location history are not required.
        </p>

        <p>
          Age Friendly Australia
        </p>
      </div>
    </footer>

  </div>
</template>