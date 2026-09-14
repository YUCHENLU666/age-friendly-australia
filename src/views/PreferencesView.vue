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

//Activity and loading states
const activities = ref([])
const loading = ref(true)

//Load saved preferences
const preferences = ref(
  getPreferences(),
)

//Preserve the original state
//Convert the preferences present when the page first opens into a string and save them
const savedSnapshot = ref(
  JSON.stringify(preferences.value),
)

//Status Notification
//After saving or clearing preferences, the page will display a notification
const statusMessage = ref('')

let statusTimer = null

//Call `getActivities()`, and upon success, 
// save the complete list of activities to `activities.value`
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

//Generate region options
//Set used to remove same suburb
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

// ======================================================
// Generate interest options
// ======================================================
//Exclude unsuitable tags
const excludedInterestTags =
  new Set([
    'PALS',
    'Adult',
    'Event Series',
    'Children',
    'Storytime',
  ])

//Collect tags from all activities
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

//Day of the week options
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

//Generate interests type options
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

//Add the following to the activity type buttons:
// - Short letter/abbreviation
// - Descriptive text
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

//If a new activity type appears without configuration instructions, use the default content
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

//User selection and deselection
const toggleArrayValue = (
  field,
  value,
) => {
  const current =
    preferences.value[field]

  //if the current value not in the field, add it in the field
  //if in the field, remove it
  if (current.includes(value)) {
    preferences.value[field] =
      current.filter(
        (item) =>
          item !== value,
      )

    return
  }

  preferences.value[field] = [
    ...current,
    value,
  ]
}

//This state is used to control on-page prompts or the state of the save button
//same, dont have not saved changes
//not same, have not saved changes
const hasUnsavedChanges =
  computed(() => {
    return (
      JSON.stringify(
        preferences.value,
      ) !==
      savedSnapshot.value
    )
  })

  //Font size
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

//Save tips
//Display a status message and automatically clear it after 3 seconds
const showStatus = (
  message,
) => {
  statusMessage.value =
    message

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

//Save preferences
const save = () => {
  preferences.value =
    savePreferences(
      preferences.value,
    )

  savedSnapshot.value =
    JSON.stringify(
      preferences.value,
    )

  showStatus(
    'Your preferences have been saved on this device.',
  )
}

//Clear preferences
const reset = () => {
  preferences.value =
    clearPreferences()

  savedSnapshot.value =
    JSON.stringify(
      preferences.value,
    )

  showStatus(
    'Your saved preferences have been cleared.',
  )
}

//Preference Summary is in line 818
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