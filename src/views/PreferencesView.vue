<!--
src/views/PreferencesView.vue
Let the user choose and save activity preferences and text size.

How calls move:
Selection -> toggleArrayValue -> save -> preferencesService.savePreferences -> localStorage; HomeView requests recommendations separately.

Reading tips:
  Examples show one possible case, not fixed API or model results.
  Promise: a result to wait for; await gets the result when the work finishes.
  computed: Vue updates this value when the data it uses changes.
  ref: a page value; changing it lets Vue update the screen.

Functions:
  getActivityTypeMeta - Find the short name and help text for an activity type.
  toggleArrayValue - Add a choice if it is missing; remove it if it is already selected.
  showStatus - Show a message, then remove it after 3 seconds.
  save - Save the current choices, remember the saved copy, and show a message.
  reset - Clear saved choices, use the starting values, and show a message.

Values Vue updates for you:
  areas - Get area names from activities, remove repeats, and sort them.
  interests - Get activity tags, leave out hidden tags, remove repeats, and sort them.
  activityTypes - Get activity types, remove empty names and repeats, and sort them.
  hasUnsavedChanges - Check if the current choices differ from the last saved choices.
  textSizeLabel - Turn the text-size code into a name shown on the page.

Fixed values and data:
  excludedInterestTags - Tags to hide from interest choices, such as Adult and Children.
  days - Weekday choices plus Flexible.
  activityTypeMeta - Keep a short name and help text for each activity type.

Page values and kept data:
  activities - Activity objects loaded for this page or test.
  loading - True while the page is loading; false when loading ends.
  preferences - Current activity choices and text-size setting.
  savedSnapshot - JSON copy of the last saved choices; used to check for unsaved changes.
  statusMessage - Short save or clear message shown on the page.
  statusTimer - Timer ID used to clear the message after 3 seconds.

Page start and API handlers:
  onMounted callback - Load activities to build choices after the page opens; do not ask AI here.

Notes:
  areas, interests, activityTypes, hasUnsavedChanges, and textSizeLabel are computed values: Vue updates them when their source data changes.
  excludedInterestTags, days, and activityTypeMeta are fixed data, not functions.
  Clicking a choice does not save it. Click Save to write it to localStorage.
  Save does not call AI. HomeView asks for recommendations when it loads.
  Flexible is shown as a choice, but the backend day rule only matches weekday names.
-->
<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  RouterLink,
} from 'vue-router'

import {
  getActivities,
} from '@/services/activityService'

import {
  clearPreferences,
  getPreferences,
  savePreferences,
} from '@/services/preferencesService'

// Activity objects loaded for this page or test.
const activities = ref([])
// True while the page is loading; false when loading ends.
const loading = ref(true)

// Current activity choices and text-size setting.
const preferences = ref(
  getPreferences(),
)

// JSON copy of the last saved choices; used to check for unsaved changes.
const savedSnapshot = ref(
  JSON.stringify(preferences.value),
)

// Short save or clear message shown on the page.
const statusMessage = ref('')

// Timer ID used to clear the message after 3 seconds.
let statusTimer = null

// Load activities to build choices after the page opens; do not ask AI here.
// Example input: Open Preferences; getActivities gives two records.
// Example result: activities gets those records, choices update, and loading becomes false.
onMounted(async () => {
  try {
    activities.value =
      await getActivities()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})

// Get area names from activities, remove repeats, and sort them.
// Example input: suburbs ['Clayton', 'Box Hill', 'Clayton']
// Example result: ['Box Hill', 'Clayton'].
const areas = computed(() => {
  return [
    ...new Set(
      activities.value
        .map(
          (activity) =>
            activity.suburb,
        )
        .filter(Boolean),
    ),
  ].sort()
})

// Tags to hide from interest choices, such as Adult and Children.
const excludedInterestTags =
  new Set([
    'PALS',
    'Adult',
    'Event Series',
    'Children',
    'Storytime',
  ])

// Get activity tags, leave out hidden tags, remove repeats, and sort them.
// Example input: tags ['Music', 'Adult', 'Music', 'Art']
// Example result: ['Art', 'Music']; 'Adult' is hidden.
const interests = computed(() => {
  return [
    ...new Set(
      activities.value.flatMap(
        (activity) =>
          activity.tags.filter(
            (tag) =>
              !excludedInterestTags.has(
                tag,
              ),
          ),
      ),
    ),
  ].sort()
})

// Weekday choices plus Flexible.
const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Flexible',
]

// Get activity types, remove empty names and repeats, and sort them.
// Example input: types ['Arts & crafts', '', 'Arts & crafts']
// Example result: ['Arts & crafts'].
const activityTypes =
  computed(() => {
    return [
      ...new Set(
        activities.value
          .map(
            (activity) =>
              activity.activityType,
          )
          .filter(Boolean),
      ),
    ].sort()
  })

// Keep a short name and help text for each activity type.
// Example input: type 'Arts & crafts'
// Example result: short name 'AC' and help text 'Creative and hands-on activities.'.
const activityTypeMeta = {
  'Arts & crafts': {
    short: 'AC',
    description:
      'Creative and hands-on activities.',
  },

  'General activity': {
    short: 'GA',
    description:
      'A wider mix of local activities.',
  },

  'Health & wellbeing': {
    short: 'HW',
    description:
      'Activities supporting active living.',
  },

  'Learning & technology': {
    short: 'LT',
    description:
      'Digital skills and practical learning.',
  },

  'Learning & development': {
    short: 'LD',
    description:
      'Learning and personal development.',
  },

  'Outdoor & nature': {
    short: 'ON',
    description:
      'Walking, nature and outdoor activities.',
  },

  'Social & cultural': {
    short: 'SC',
    description:
      'Conversation and cultural activities.',
  },
}

// Find the short name and help text for an activity type.
// Example input: 'Arts & crafts'
// Example result: {short: 'AC', description: 'Creative and hands-on activities.'}; an unknown type uses 'AF'.
const getActivityTypeMeta = (
  type,
) => {
  return (
    activityTypeMeta[type] || {
      short: 'AF',
      description:
        'Local activity option.',
    }
  )
}

// Add a choice if it is missing; remove it if it is already selected.
// Example input: field='interests', value='Music', current list=[]
// Example result: preferences.interests becomes ['Music']; click again and it becomes []. Returns no value.
const toggleArrayValue = (
  field,
  value,
) => {
  // Read the choices in the clicked group.
  const current =
    preferences.value[field]

  // Already selected: remove this choice.
  if (current.includes(value)) {
    preferences.value[field] =
      current.filter(
        (item) =>
          item !== value,
      )

    return
  }

  // Not selected yet: add this choice.
  preferences.value[field] = [
    ...current,
    value,
  ]
}

// Check if the current choices differ from the last saved choices.
// Example input: saved interests=[], current interests=['Music']
// Example result: true; after Save, false.
const hasUnsavedChanges =
  computed(() => {
    return (
      JSON.stringify(
        preferences.value,
      ) !==
      savedSnapshot.value
    )
  })

// Turn the text-size code into a name shown on the page.
// Example input: preferences.textSize='extra-large'
// Example result: 'Extra large'.
const textSizeLabel =
  computed(() => {
    if (
      preferences.value.textSize ===
      'extra-large'
    ) {
      return 'Extra large'
    }

    if (
      preferences.value.textSize ===
      'large'
    ) {
      return 'Large'
    }

    return 'Standard'
  })

// Show a message, then remove it after 3 seconds.
// Example input: message='Saved'
// Example result: statusMessage becomes 'Saved', then ''; returns no value.
const showStatus = (
  message,
) => {
  statusMessage.value =
    message

  // Stop the old timer before starting a new one.
  if (statusTimer) {
    clearTimeout(
      statusTimer,
    )
  }

  statusTimer =
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
}

// Save the current choices, remember the saved copy, and show a message.
// Example input: click Save with interests=['Music']
// Example result: choices are saved in localStorage; hasUnsavedChanges becomes false. Returns no value.
const save = () => {
  preferences.value =
    savePreferences(
      preferences.value,
    )

  // Remember the saved choices for the unsaved-change check.
  savedSnapshot.value =
    JSON.stringify(
      preferences.value,
    )

  showStatus(
    'Your preferences have been saved on this device.',
  )
}

// Clear saved choices, use the starting values, and show a message.
// Example input: click Clear with interests=['Music']
// Example result: interests=[], generalArea='', textSize='standard'. Returns no value.
const reset = () => {
  preferences.value =
    clearPreferences()

  // Remember the saved choices for the unsaved-change check.
  savedSnapshot.value =
    JSON.stringify(
      preferences.value,
    )

  showStatus(
    'Your saved preferences have been cleared.',
  )
}

</script>

<template>
  <main class="preferences-page">
    <section class="preferences-v2-hero">
      <div class="page-container">
        <div class="preferences-v2-hero-grid">
          <div class="preferences-v2-hero-copy">
            <p class="section-kicker">
              Personalise your experience
            </p>

            <h1>
              Tell us what matters
              to you.
            </h1>

            <p class="preferences-v2-lead">
              Choose a few optional preferences
              to make activity discovery more
              useful and comfortable.
            </p>

            <div class="preferences-hero-points">
              <span>
                <strong>Optional</strong>
                Choose only what you want
              </span>

              <span>
                <strong>Local</strong>
                Saved on this device
              </span>

              <span>
                <strong>Flexible</strong>
                Change it at any time
              </span>
            </div>
          </div>

          <aside class="preferences-hero-note">
            <div
              class="preferences-hero-note-icon"
              aria-hidden="true"
            >
              ✓
            </div>

            <div>
              <p class="preferences-note-label">
                Privacy-aware by design
              </p>

              <h2>
                No exact address or
                health information needed.
              </h2>

              <p>
                General area, interests,
                preferred days and display
                settings are enough.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section class="preferences-v2-main">
      <div class="page-container">
        <div
          v-if="statusMessage"
          class="preferences-toast"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">
            ✓
          </span>

          {{ statusMessage }}
        </div>

        <form
          class="preferences-v2-layout"
          @submit.prevent="save"
        >
          <div class="preferences-v2-content">
            <!-- GENERAL AREA -->
            <section class="preference-v2-card">
              <div class="preference-v2-heading">
                <div class="preference-v2-index">
                  01
                </div>

                <div>
                  <p class="preference-v2-eyebrow">
                    Location
                  </p>

                  <h2>
                    Preferred general area
                  </h2>

                  <p>
                    A broad area helps bring
                    nearby options forward.
                    An exact address is not
                    required.
                  </p>
                </div>
              </div>

              <div class="preference-v2-select-wrap">
                <label for="preferred-area">
                  General area
                </label>

                <select
                  id="preferred-area"
                  v-model="
                    preferences.generalArea
                  "
                  :disabled="loading"
                >
                  <option value="">
                    No area preference
                  </option>

                  <option
                    v-for="area in areas"
                    :key="area"
                    :value="area"
                  >
                    {{ area }}
                  </option>
                </select>

                <p class="preference-v2-helper">
                  Only the selected broad area
                  is stored.
                </p>
              </div>
            </section>

            <!-- INTERESTS -->
            <section class="preference-v2-card">
              <div class="preference-v2-heading">
                <div class="preference-v2-index">
                  02
                </div>

                <div>
                  <p class="preference-v2-eyebrow">
                    Interests
                  </p>

                  <h2>
                    What interests you?
                  </h2>

                  <p>
                    Pick as many as you like.
                    Matching activities can
                    appear earlier in results.
                  </p>
                </div>
              </div>

              <div
                v-if="loading"
                class="preference-v2-loading"
              >
                Loading interests...
              </div>

              <div
                v-else
                class="preference-v2-chip-grid"
              >
                <button
                  v-for="
                    interest in interests
                  "
                  :key="interest"
                  type="button"
                  class="preference-v2-chip"
                  :class="{
                    'preference-v2-chip--selected':
                      preferences.interests.includes(
                        interest,
                      ),
                  }"
                  :aria-pressed="
                    preferences.interests.includes(
                      interest,
                    )
                  "
                  @click="
                    toggleArrayValue(
                      'interests',
                      interest,
                    )
                  "
                >
                  <span
                    class="preference-v2-chip-icon"
                    aria-hidden="true"
                  >
                    {{
                      preferences.interests.includes(
                        interest,
                      )
                        ? '✓'
                        : '+'
                    }}
                  </span>

                  {{ interest }}
                </button>
              </div>
            </section>

            <!-- DAYS -->
            <section class="preference-v2-card">
              <div class="preference-v2-heading">
                <div class="preference-v2-index">
                  03
                </div>

                <div>
                  <p class="preference-v2-eyebrow">
                    Schedule
                  </p>

                  <h2>
                    Preferred days
                  </h2>

                  <p>
                    Choose the days that are
                    usually easiest for you.
                  </p>
                </div>
              </div>

              <div class="preference-day-grid">
                <button
                  v-for="day in days"
                  :key="day"
                  type="button"
                  class="preference-day-button"
                  :class="{
                    'preference-day-button--selected':
                      preferences.preferredDays.includes(
                        day,
                      ),
                  }"
                  :aria-pressed="
                    preferences.preferredDays.includes(
                      day,
                    )
                  "
                  @click="
                    toggleArrayValue(
                      'preferredDays',
                      day,
                    )
                  "
                >
                  <span
                    class="preference-day-indicator"
                    aria-hidden="true"
                  >
                    {{
                      preferences.preferredDays.includes(
                        day,
                      )
                        ? '✓'
                        : '+'
                    }}
                  </span>

                  <span>
                    {{ day }}
                  </span>
                </button>
              </div>
            </section>

            <!-- ACTIVITY TYPES -->
            <section class="preference-v2-card">
              <div class="preference-v2-heading">
                <div class="preference-v2-index">
                  04
                </div>

                <div>
                  <p class="preference-v2-eyebrow">
                    Activity style
                  </p>

                  <h2>
                    Activities you may enjoy
                  </h2>

                  <p>
                    Select broad activity types
                    to improve the ordering of
                    your activity results.
                  </p>
                </div>
              </div>

              <div
                v-if="loading"
                class="preference-v2-loading"
              >
                Loading activity types...
              </div>

              <div
                v-else
                class="preference-v2-type-grid"
              >
                <button
                  v-for="
                    type in activityTypes
                  "
                  :key="type"
                  type="button"
                  class="preference-v2-type-card"
                  :class="{
                    'preference-v2-type-card--selected':
                      preferences.activityTypes.includes(
                        type,
                      ),
                  }"
                  :aria-pressed="
                    preferences.activityTypes.includes(
                      type,
                    )
                  "
                  @click="
                    toggleArrayValue(
                      'activityTypes',
                      type,
                    )
                  "
                >
                  <div class="preference-type-top">
                    <span
                      class="preference-type-monogram"
                      aria-hidden="true"
                    >
                      {{
                        getActivityTypeMeta(
                          type,
                        ).short
                      }}
                    </span>

                    <span
                      class="preference-type-state"
                      aria-hidden="true"
                    >
                      {{
                        preferences.activityTypes.includes(
                          type,
                        )
                          ? '✓'
                          : '+'
                      }}
                    </span>
                  </div>

                  <strong>
                    {{ type }}
                  </strong>

                  <p>
                    {{
                      getActivityTypeMeta(
                        type,
                      ).description
                    }}
                  </p>
                </button>
              </div>
            </section>

            <!-- TEXT SIZE -->
            <section class="preference-v2-card">
              <div class="preference-v2-heading">
                <div class="preference-v2-index">
                  05
                </div>

                <div>
                  <p class="preference-v2-eyebrow">
                    Reading experience
                  </p>

                  <h2>
                    Choose your text size
                  </h2>

                  <p>
                    Preview each option using
                    real interface text.
                  </p>
                </div>
              </div>

              <div class="preference-v2-text-grid">
                <label
                  class="preference-v2-text-card"
                  :class="{
                    'preference-v2-text-card--selected':
                      preferences.textSize ===
                      'standard',
                  }"
                >
                  <input
                    v-model="
                      preferences.textSize
                    "
                    type="radio"
                    value="standard"
                  />

                  <div class="text-card-top">
                    <span>
                      Standard
                    </span>

                    <span
                      v-if="
                        preferences.textSize ===
                        'standard'
                      "
                      class="text-card-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </div>

                  <p class="text-preview text-preview--standard">
                    Find activities with
                    confidence.
                  </p>

                  <small>
                    Default reading size
                  </small>
                </label>

                <label
                  class="preference-v2-text-card"
                  :class="{
                    'preference-v2-text-card--selected':
                      preferences.textSize ===
                      'large',
                  }"
                >
                  <input
                    v-model="
                      preferences.textSize
                    "
                    type="radio"
                    value="large"
                  />

                  <div class="text-card-top">
                    <span>
                      Large
                    </span>

                    <span
                      v-if="
                        preferences.textSize ===
                        'large'
                      "
                      class="text-card-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </div>

                  <p class="text-preview text-preview--large">
                    Find activities with
                    confidence.
                  </p>

                  <small>
                    Larger throughout
                  </small>
                </label>

                <label
                  class="preference-v2-text-card"
                  :class="{
                    'preference-v2-text-card--selected':
                      preferences.textSize ===
                      'extra-large',
                  }"
                >
                  <input
                    v-model="
                      preferences.textSize
                    "
                    type="radio"
                    value="extra-large"
                  />
                  <div class="text-card-top">
                    <span>
                      Extra large
                    </span>

                    <span
                      v-if="
                        preferences.textSize ===
                        'extra-large'
                      "
                      class="text-card-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </div>

                  <p class="text-preview text-preview--extra">
                    Find activities with
                    confidence.
                  </p>

                  <small>
                    Maximum reading size
                  </small>
                </label>
              </div>
            </section>
          </div>

          <!-- STICKY SUMMARY -->
          <aside class="preferences-summary-column">
            <div class="preferences-summary-card">
              <div class="preferences-summary-header">
                <p class="section-kicker">
                  Your setup
                </p>

                <h2>
                  Preference summary
                </h2>

                <p>
                  Review your choices before
                  saving them on this device.
                </p>
              </div>

              <dl class="preferences-summary-list">
                <div>
                  <dt>General area</dt>

                  <dd>
                    {{
                      preferences.generalArea ||
                      'No preference'
                    }}
                  </dd>
                </div>

                <div>
                  <dt>Interests</dt>

                  <dd>
                    {{
                      preferences.interests.length
                        ? `${preferences.interests.length} selected`
                        : 'None selected'
                    }}
                  </dd>
                </div>

                <div>
                  <dt>Preferred days</dt>

                  <dd>
                    {{
                      preferences.preferredDays.length
                        ? `${preferences.preferredDays.length} selected`
                        : 'None selected'
                    }}
                  </dd>
                </div>

                <div>
                  <dt>Activity types</dt>

                  <dd>
                    {{
                      preferences.activityTypes.length
                        ? `${preferences.activityTypes.length} selected`
                        : 'None selected'
                    }}
                  </dd>
                </div>

                <div>
                  <dt>Text size</dt>

                  <dd>
                    {{ textSizeLabel }}
                  </dd>
                </div>
              </dl>

              <div
                class="preferences-unsaved-state"
                :class="{
                  'preferences-unsaved-state--active':
                    hasUnsavedChanges,
                }"
              >
                <span
                  class="preferences-unsaved-dot"
                  aria-hidden="true"
                ></span>

                {{
                  hasUnsavedChanges
                    ? 'You have unsaved changes.'
                    : 'Your saved settings are up to date.'
                }}
              </div>

              <button
                class="preferences-v2-save"
                type="submit"
              >
                Save preferences
              </button>

              <button
                class="preferences-v2-clear"
                type="button"
                @click="reset"
              >
                Clear preferences
              </button>

              <RouterLink
                class="preferences-v2-view-link"
                to="/activities"
              >
                View activities

                <span aria-hidden="true">
                  →
                </span>
              </RouterLink>

              <p class="preferences-summary-footnote">
                These settings are optional
                and can be changed whenever
                you like.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  </main>
</template>