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

// =========================
// Current route
// =========================
//
// useRoute() gives information about
// the page the user is currently viewing.
//
// We use it below so that the text-size
// menu automatically closes when the
// user changes to another page.
//
const route = useRoute()

// =========================
// Text-size menu state
// =========================
//
// Controls whether the accessibility
// text-size popup menu is open or closed.
//
const textMenuOpen = ref(false)

// =========================
// Current text size
// =========================
//
// Read the text size that was previously
// saved in the user's preferences.
//
const currentTextSize = ref(
  getPreferences().textSize,
)

// =========================
// Available text size options
// =========================
//
// These options are shown inside
// the text-size popup menu.
//
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

// =========================
// Current text-size label
// =========================
//
// Convert the saved value:
//
// "standard"
// "large"
// "extra-large"
//
// into a user-friendly label:
//
// "Standard"
// "Large"
// "Extra large"
//
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

// =========================
// Open / close text-size menu
// =========================
//
// Before opening the menu, read the
// latest preference value again.
//
// This keeps the Navbar in sync if
// PreferencesView changed the text size.
//
const openTextMenu = () => {
  currentTextSize.value =
    getPreferences().textSize

  textMenuOpen.value =
    !textMenuOpen.value
}

// =========================
// Change text size
// =========================
//
// This updates only the textSize field
// inside the complete preferences object,
// then saves the updated preferences.
//
const setTextSize = (value) => {
  const preferences =
    getPreferences()

  preferences.textSize =
    value

  savePreferences(
    preferences,
  )

  // Update Navbar immediately.
  currentTextSize.value =
    value

  // Close the menu after selection.
  textMenuOpen.value = false
}

// =========================
// Listen for preference updates
// =========================
//
// PreferencesView can also change
// accessibility settings.
//
// preferencesService dispatches the custom
// event "age-friendly-preferences-updated"
// when the preferences are changed.
//
// This allows the Navbar to update
// without refreshing the page.
//
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

// =========================
// Close menu when clicking outside
// =========================
//
// If the user clicks anywhere outside
// .navbar-text-size, close the popup.
//
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

// =========================
// Close menu with Escape key
// =========================
//
// This improves keyboard accessibility.
//
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

// =========================
// Close menu after route change
// =========================
//
// Example:
//
// User opens text-size menu
//        ↓
// clicks Calendar
//        ↓
// route.fullPath changes
//        ↓
// menu closes automatically
//
watch(
  () => route.fullPath,
  () => {
    textMenuOpen.value =
      false
  },
)

// =========================
// Register event listeners
// =========================
//
// These listeners are added when
// the Navbar component is mounted.
//
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

// =========================
// Remove event listeners
// =========================
//
// Clean up listeners when the component
// is removed to avoid duplicate listeners
// or unnecessary memory usage.
//
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

    <!-- =========================
         Main navigation bar
    ========================== -->
    <nav
      class="app-navbar"
      aria-label="Main navigation"
    >
      <div class="navbar-inner">

        <!-- =========================
             Website brand / Home link
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
             Right side of Navbar
        ========================== -->
        <div class="navbar-right">

          <!-- =========================
               Main navigation links
          ========================== -->
          <div class="navbar-links">

            <!-- Home -->
            <RouterLink
              to="/"
              class="navbar-link"
            >
              Home
            </RouterLink>

            <!-- Activities -->
            <RouterLink
              to="/activities"
              class="navbar-link"
            >
              Activities
            </RouterLink>

            <!-- Services -->
            <RouterLink
              to="/services"
              class="navbar-link"
            >
              Services
            </RouterLink>

            <!-- Live information -->
            <RouterLink
              to="/live"
              class="navbar-link"
            >
              Live
            </RouterLink>

            <!-- Saved activities and services -->
            <RouterLink
              to="/saved"
              class="navbar-link"
            >
              Saved
            </RouterLink>

            <!-- =========================
                 Epic 7 Personal Calendar
            ========================== -->
            <!--
              This new navigation link opens
              CalendarView.vue through the
              /calendar route.

              The Calendar page allows users to:
              1. View saved activities by date.
              2. Set planned visit dates for
                 saved services.
              3. View both together in one place.
            -->
            <RouterLink
              to="/calendar"
              class="navbar-link"
            >
              Calendar
            </RouterLink>

            <!-- Accessibility preferences -->
            <RouterLink
              to="/preferences"
              class="navbar-link"
            >
              Preferences
            </RouterLink>

          </div>

          <!-- =========================
               Text-size quick menu
          ========================== -->
          <div class="navbar-text-size">

            <!--
              Button used to open or close
              the text-size popup.
            -->
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
              <!-- Text-size icon -->
              <span
                class="navbar-text-icon"
                aria-hidden="true"
              >
                Aa
              </span>

              <!-- Current text-size label -->
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

              <!-- Dropdown arrow -->
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
                 Text-size popup
            ========================== -->
            <div
              v-if="textMenuOpen"
              id="text-size-menu"
              class="navbar-text-menu"
              role="dialog"
              aria-label="Text size"
            >

              <!-- Popup header -->
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

                <!-- Close popup button -->
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
                   Text-size choices
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
                  <!--
                    Visual preview of
                    the selected text size.
                  -->
                  <span
                    class="navbar-text-preview"
                    :class="
                      `navbar-text-preview--${option.value}`
                    "
                    aria-hidden="true"
                  >
                    Aa
                  </span>

                  <!-- Option name and description -->
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

                  <!--
                    Show a tick next to
                    the currently selected option.
                  -->
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
                   Link to full Preferences
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