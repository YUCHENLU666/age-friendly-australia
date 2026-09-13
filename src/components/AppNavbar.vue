<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import {
  RouterLink,
  useRoute,
} from 'vue-router'

import {
  getPreferences,
  savePreferences,
} from '@/services/preferencesService'

const route = useRoute()

// =====================================
// Text size menu state
// =====================================

// Controls whether the text size menu
// is currently open or closed.
const textMenuOpen = ref(false)

// Read the currently saved text size
// from the full Preferences system.
const currentTextSize = ref(
  getPreferences().textSize,
)

// =====================================
// Text size options
// =====================================

const textSizeOptions = [
  {
    value: 'standard',
    label: 'Standard',
    description:
      'Default reading size',
  },
  {
    value: 'large',
    label: 'Large',
    description:
      'Larger text throughout',
  },
  {
    value: 'extra-large',
    label: 'Extra large',
    description:
      'Maximum reading size',
  },
]

// =====================================
// Current text size label
// =====================================

// Find the user-friendly label that
// corresponds to the current value.
const currentTextSizeLabel =
  computed(() => {
    const option =
      textSizeOptions.find(
        (item) =>
          item.value ===
          currentTextSize.value,
      )

    return (
      option?.label ||
      'Standard'
    )
  })

// =====================================
// Open / close text size menu
// =====================================

const openTextMenu = () => {
  // Re-read the latest saved value
  // before opening the menu.
  currentTextSize.value =
    getPreferences().textSize

  // Toggle the menu.
  textMenuOpen.value =
    !textMenuOpen.value
}

// =====================================
// Update text size
// =====================================

const setTextSize = (value) => {
  // Read the current complete preference object.
  const preferences =
    getPreferences()

  // Only update text size.
  preferences.textSize =
    value

  // Save the complete preference object.
  savePreferences(
    preferences,
  )

  // Update the Navbar state immediately.
  currentTextSize.value =
    value

  // Close the menu.
  textMenuOpen.value = false
}

// =====================================
// Listen for Preferences updates
// =====================================

// PreferencesView.vue may also change
// the text size.
//
// preferencesService.js dispatches the
// custom event below whenever preferences
// are updated.
const handlePreferencesUpdate = (
  event,
) => {
  if (
    event.detail?.textSize
  ) {
    currentTextSize.value =
      event.detail.textSize
  }
}

// =====================================
// Close menu when clicking outside
// =====================================

const handleDocumentClick = (
  event,
) => {
  const menu =
    document.querySelector(
      '.navbar-text-size',
    )

  if (
    menu &&
    !menu.contains(
      event.target,
    )
  ) {
    textMenuOpen.value =
      false
  }
}

// =====================================
// Close menu with Escape
// =====================================

const handleKeydown = (
  event,
) => {
  if (
    event.key === 'Escape'
  ) {
    textMenuOpen.value =
      false
  }
}

// =====================================
// Close menu when changing page
// =====================================

watch(
  () => route.fullPath,
  () => {
    textMenuOpen.value =
      false
  },
)

// =====================================
// Register event listeners
// =====================================

onMounted(() => {
  window.addEventListener(
    'age-friendly-preferences-updated',
    handlePreferencesUpdate,
  )

  document.addEventListener(
    'click',
    handleDocumentClick,
  )

  document.addEventListener(
    'keydown',
    handleKeydown,
  )
})

// =====================================
// Remove event listeners
// =====================================

onBeforeUnmount(() => {
  window.removeEventListener(
    'age-friendly-preferences-updated',
    handlePreferencesUpdate,
  )

  document.removeEventListener(
    'click',
    handleDocumentClick,
  )

  document.removeEventListener(
    'keydown',
    handleKeydown,
  )
})
</script>

<template>
  <header class="app-header">
    <nav
      class="app-navbar"
      aria-label="Main navigation"
    >
      <div class="navbar-inner">

        <!-- =========================
             Website brand
        ========================== -->
        <RouterLink
          to="/"
          class="navbar-brand"
          aria-label="Age Friendly Australia home"
        >
          <span
            class="navbar-logo"
            aria-hidden="true"
          >
            AF
          </span>

          <span class="navbar-brand-copy">
            <strong>
              Age Friendly Australia
            </strong>

            <small>
              Local activities & services
            </small>
          </span>
        </RouterLink>

        <!-- =========================
             Navigation right section
        ========================== -->
        <div class="navbar-right">

          <!-- =========================
               Main navigation links
          ========================== -->
          <div class="navbar-links">

            <RouterLink
              to="/"
              class="navbar-link"
            >
              Home
            </RouterLink>

            <RouterLink
              to="/activities"
              class="navbar-link"
            >
              Activities
            </RouterLink>

            <RouterLink
              to="/services"
              class="navbar-link"
            >
              Services
            </RouterLink>

            <RouterLink
              to="/saved"
              class="navbar-link"
            >
              Saved
            </RouterLink>

            <!--
              Preferences restored
              from the main branch.
            -->
            <RouterLink
              to="/preferences"
              class="navbar-link"
            >
              Preferences
            </RouterLink>

          </div>

          <!-- =========================
               Text size quick menu
          ========================== -->
          <div class="navbar-text-size">

            <button
              class="navbar-text-trigger"
              type="button"
              aria-haspopup="true"
              :aria-expanded="
                textMenuOpen
              "
              aria-controls="text-size-menu"
              @click.stop="
                openTextMenu
              "
            >
              <span
                class="navbar-text-icon"
                aria-hidden="true"
              >
                Aa
              </span>

              <span
                class="navbar-text-trigger-copy"
              >
                <span>
                  Text size
                </span>

                <small>
                  {{
                    currentTextSizeLabel
                  }}
                </small>
              </span>

              <span
                class="navbar-text-chevron"
                :class="{
                  'navbar-text-chevron--open':
                    textMenuOpen,
                }"
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            <!-- =========================
                 Text size popup
            ========================== -->
            <div
              v-if="textMenuOpen"
              id="text-size-menu"
              class="navbar-text-menu"
              role="dialog"
              aria-label="Text size"
            >

              <!-- Menu header -->
              <div
                class="navbar-text-menu-header"
              >
                <div>
                  <strong>
                    Text size
                  </strong>

                  <p>
                    Choose a comfortable
                    reading size.
                  </p>
                </div>

                <button
                  class="navbar-text-close"
                  type="button"
                  aria-label="Close text size menu"
                  @click="
                    textMenuOpen = false
                  "
                >
                  ×
                </button>
              </div>

              <!-- =========================
                   Text size choices
              ========================== -->
              <div
                class="navbar-text-options"
                role="radiogroup"
                aria-label="Choose text size"
              >
                <button
                  v-for="
                    option in
                    textSizeOptions
                  "
                  :key="
                    option.value
                  "
                  type="button"
                  class="navbar-text-option"
                  :class="{
                    'navbar-text-option--selected':
                      currentTextSize ===
                      option.value,
                  }"
                  role="radio"
                  :aria-checked="
                    currentTextSize ===
                    option.value
                  "
                  @click="
                    setTextSize(
                      option.value,
                    )
                  "
                >
                  <span
                    class="navbar-text-preview"
                    :class="
                      `navbar-text-preview--${option.value}`
                    "
                    aria-hidden="true"
                  >
                    Aa
                  </span>

                  <span
                    class="navbar-text-option-copy"
                  >
                    <strong>
                      {{
                        option.label
                      }}
                    </strong>

                    <small>
                      {{
                        option.description
                      }}
                    </small>
                  </span>

                  <span
                    class="navbar-text-option-state"
                    aria-hidden="true"
                  >
                    {{
                      currentTextSize ===
                      option.value
                        ? '✓'
                        : ''
                    }}
                  </span>
                </button>
              </div>

              <!-- =========================
                   Full preferences link
              ========================== -->
              <RouterLink
                to="/preferences"
                class="navbar-text-manage"
                @click="
                  textMenuOpen = false
                "
              >
                More accessibility settings

                <span
                  aria-hidden="true"
                >
                  →
                </span>
              </RouterLink>

            </div>
          </div>

        </div>
      </div>
    </nav>
  </header>
</template>