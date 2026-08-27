<script setup>
import { RouterLink } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<template>
  <div class="app-shell">
    <AppNavbar />

    <main
      id="main-content"
      class="main-content"
    >
      <RouterView />
    </main>

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
            Helping older adults discover useful local activities,
            healthcare, aged-care support and essential services.
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

          <div>
            <p class="footer-nav-title">
              Your experience
            </p>

            <RouterLink to="/preferences">
              Preferences
            </RouterLink>

            <RouterLink to="/preferences">
              Accessibility
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