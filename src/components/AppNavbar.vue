<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const menuOpen = ref(false)

const navItems = [
  {
    label: 'Home',
    to: '/',
  },
  {
    label: 'Activities',
    to: '/activities',
  },
  {
    label: 'Services',
    to: '/services',
  },
  {
    label: 'Saved',
    to: '/saved',
  },
  {
    label: 'Preferences',
    to: '/preferences',
  },
]

const currentPath = computed(() => route.path)

const isActive = (path) => {
  if (path === '/') {
    return currentPath.value === '/'
  }

  return currentPath.value.startsWith(path)
}

const closeMenu = () => {
  menuOpen.value = false
}
</script>

<template>
  <header class="site-header">
    <a
      class="skip-link"
      href="#main-content"
    >
      Skip to main content
    </a>

    <div class="page-container nav-inner">
      <RouterLink
        class="brand"
        to="/"
        aria-label="Age Friendly Australia home"
        @click="closeMenu"
      >
        <span
          class="brand-mark"
          aria-hidden="true"
        >
          AF
        </span>

        <span class="brand-text">
          <strong>Age Friendly Australia</strong>

          <span>
            Local activities & services
          </span>
        </span>
      </RouterLink>

      <button
        class="menu-button"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="primary-navigation"
        @click="menuOpen = !menuOpen"
      >
        <span
          class="menu-icon"
          aria-hidden="true"
        >
          ☰
        </span>

        <span>
          Menu
        </span>
      </button>

      <nav
        id="primary-navigation"
        class="primary-nav"
        :class="{ 'primary-nav--open': menuOpen }"
        aria-label="Primary navigation"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{
            'nav-link--active': isActive(item.to),
          }"
          @click="closeMenu"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>