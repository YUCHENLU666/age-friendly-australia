<script setup>
// Import Vue Router components.
import {
  RouterLink,
  RouterView,
} from 'vue-router'

// Import the navigation bar.
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<template>
  <div class="app-shell">

    <!--
      Main navigation bar.

      Admin login has been removed,
      so the navigation bar is always visible.
    -->
    <AppNavbar />

    <!--
      RouterView displays the page selected
      by src/router/index.js.

      Example:

      /
          ↓
      HomeView.vue

      /activities
          ↓
      ActivitiesView.vue

      /services
          ↓
      ServicesView.vue

      /calendar
          ↓
      CalendarView.vue
    -->
    <main
      id="main-content"
      class="main-content"
    >
      <RouterView />
    </main>

    <!--
      Site footer.

      Admin login has been removed,
      so the footer is always visible.
    -->
    <footer class="site-footer">
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
            Helping older adults discover useful local activities
            and verified aged-care support services.
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