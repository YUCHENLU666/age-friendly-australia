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
  getTextSize,
  saveTextSize,
} from '@/services/textSizeService'

const route = useRoute()

const textMenuOpen = ref(false)

const currentTextSize = ref(
  getTextSize(),
)

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

const openTextMenu = () => {
  currentTextSize.value =
    getTextSize()

  textMenuOpen.value =
    !textMenuOpen.value
}

const setTextSize = (value) => {
  saveTextSize(value)

  currentTextSize.value =
    value

  textMenuOpen.value = false
}

const handleTextSizeUpdate = (
  event,
) => {
  if (event.detail?.textSize) {
    currentTextSize.value =
      event.detail.textSize
  }
}

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

watch(
  () => route.fullPath,
  () => {
    textMenuOpen.value =
      false
  },
)

onMounted(() => {
  window.addEventListener(
    'age-friendly-text-size-updated',
    handleTextSizeUpdate,
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

onBeforeUnmount(() => {
  window.removeEventListener(
    'age-friendly-text-size-updated',
    handleTextSizeUpdate,
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

        <div class="navbar-right">
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

          </div>

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

            <div
              v-if="textMenuOpen"
              id="text-size-menu"
              class="navbar-text-menu"
              role="dialog"
              aria-label="Text size"
            >
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

            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
