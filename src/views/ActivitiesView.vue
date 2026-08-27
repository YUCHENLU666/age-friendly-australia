<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import ActivityCard from '@/components/activities/ActivityCard.vue'
import ActivityFilters from '@/components/activities/ActivityFilters.vue'

import {
  getActivities,
} from '@/services/activityService'

import {
  getSavedActivityIds,
  toggleSavedActivityId,
} from '@/services/savedItemsService'

const activities = ref([])
const savedActivityIds = ref([])

const loading = ref(true)
const errorMessage = ref('')

const defaultFilters = () => ({
  search: '',
  area: '',
  interest: '',
  day: '',
  recurrence: '',
  suitability: 'recommended',
})

const filters = ref(
  defaultFilters(),
)

onMounted(async () => {
  savedActivityIds.value =
    getSavedActivityIds()

  try {
    activities.value =
      await getActivities()
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load the activity information. Please try again.'
  } finally {
    loading.value = false
  }
})

const areas = computed(() => {
  return [
    ...new Set(
      activities.value.map(
        (activity) =>
          activity.suburb,
      ),
    ),
  ].sort()
})

const interests = computed(() => {
  const lessUsefulFilterTags = new Set([
    'PALS',
    'Adult',
    'Event Series',
    'Children',
    'Storytime',
  ])

  return [
    ...new Set(
      activities.value.flatMap(
        (activity) =>
          activity.tags.filter(
            (tag) =>
              !lessUsefulFilterTags.has(tag),
          ),
      ),
    ),
  ].sort()
})

const dayOrder = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Flexible',
]

const days = computed(() => {
  const availableDays = new Set(
    activities.value.map(
      (activity) => activity.day,
    ),
  )

  return dayOrder.filter(
    (day) =>
      availableDays.has(day),
  )
})

const recurrenceOptions = computed(() => {
  return [
    ...new Set(
      activities.value.map(
        (activity) =>
          activity.recurrence,
      ),
    ),
  ].sort()
})

const filteredActivities = computed(() => {
  const search =
    filters.value.search
      .trim()
      .toLowerCase()

  return activities.value.filter(
    (activity) => {
      if (search) {
        const searchableText = [
          activity.name,
          activity.venue,
          activity.suburb,
          ...activity.tags,
        ]
          .join(' ')
          .toLowerCase()

        if (
          !searchableText.includes(search)
        ) {
          return false
        }
      }

      if (
        filters.value.area &&
        activity.suburb !==
          filters.value.area
      ) {
        return false
      }

      if (
        filters.value.interest &&
        !activity.tags.includes(
          filters.value.interest,
        )
      ) {
        return false
      }

      if (
        filters.value.day &&
        activity.day !==
          filters.value.day
      ) {
        return false
      }

      if (
        filters.value.recurrence &&
        activity.recurrence !==
          filters.value.recurrence
      ) {
        return false
      }

      if (
        filters.value.suitability ===
          'recommended' &&
        activity.suitability === 'no'
      ) {
        return false
      }

      if (
        filters.value.suitability ===
          'yes' &&
        activity.suitability !== 'yes'
      ) {
        return false
      }

      if (
        filters.value.suitability ===
          'partial' &&
        activity.suitability !==
          'partial'
      ) {
        return false
      }

      return true
    },
  )
})

const updateFilters = (
  nextFilters,
) => {
  filters.value = nextFilters
}

const clearFilters = () => {
  filters.value = defaultFilters()
}

const isSaved = (activityId) => {
  return savedActivityIds.value.includes(
    String(activityId),
  )
}

const toggleSave = (activityId) => {
  savedActivityIds.value =
    toggleSavedActivityId(activityId)
}
</script>

<template>
  <div class="activities-page">
    <section class="activity-page-hero">
      <div class="page-container">
        <div class="activity-page-hero-inner">
          <div>
            <p class="section-kicker">
              Local activities
            </p>

            <h1>
              Find something that interests you.
            </h1>

            <p>
              Search activities by general area,
              interests and preferred schedule using
              simple, optional choices.
            </p>
          </div>

          <div class="activity-page-privacy">
            <span aria-hidden="true">✓</span>

            <p>
              General area and interest selections
              are used only to improve your results.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="activities-main">
      <div class="page-container">
        <ActivityFilters
          :filters="filters"
          :areas="areas"
          :interests="interests"
          :days="days"
          :recurrence-options="
            recurrenceOptions
          "
          @update:filters="
            updateFilters
          "
          @clear="clearFilters"
        />

        <div class="activity-data-note">
          <span
            class="activity-data-note-icon"
            aria-hidden="true"
          >
            i
          </span>

          <p>
            Current pilot records may provide a
            recurring schedule rather than an exact
            event date. Availability and access details
            are shown only when supplied by the source.
          </p>
        </div>

        <div class="activity-results-heading">
          <div>
            <p class="section-kicker">
              Results
            </p>

            <h2>
              {{
                filteredActivities.length
              }}
              {{
                filteredActivities.length ===
                1
                  ? 'activity'
                  : 'activities'
              }}
              found
            </h2>
          </div>

          <p
            v-if="
              filters.suitability ===
              'recommended'
            "
            class="activity-results-note"
          >
            Showing results marked suitable or
            potentially suitable for older adults.
          </p>
        </div>

        <div
          v-if="loading"
          class="activity-state-card"
        >
          <div
            class="activity-loading-spinner"
            aria-hidden="true"
          ></div>

          <h2>
            Loading activities
          </h2>

          <p>
            Please wait a moment.
          </p>
        </div>

        <div
          v-else-if="errorMessage"
          class="activity-state-card"
          role="alert"
        >
          <h2>
            Unable to load activities
          </h2>

          <p>
            {{ errorMessage }}
          </p>
        </div>

        <div
          v-else-if="
            filteredActivities.length === 0
          "
          class="activity-state-card"
        >
          <h2>
            No matching activities
          </h2>

          <p>
            Try changing one or more filters to
            see more results.
          </p>

          <button
            class="activity-empty-button"
            type="button"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>

        <div
          v-else
          class="activity-results-grid"
        >
          <ActivityCard
            v-for="
              activity in filteredActivities
            "
            :key="activity.id"
            :activity="activity"
            :saved="isSaved(activity.id)"
            @toggle-save="toggleSave"
          />
        </div>
      </div>
    </section>
  </div>
</template>