<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'
// computed: The result is automatically calculated based on other states
// onMounted: Execute code after page component loads
// ref: save reactive state

//import components
// ActivityCard: Activity name, venue, suburb, day, time, recurrence, tags, suitability, savebutton
import ActivityCard from '@/components/activities/ActivityCard.vue'
// ActivityFilters: Search, Area, Interest, Day, Recurrence, Suitability
import ActivityFilters from '@/components/activities/ActivityFilters.vue'

//ActivitiesVies -> activityService -> Backend API -> SQLite
import {
  getActivities,
} from '@/services/activityService'

import {
  getSavedActivityIds,//get the activity IDs which are saved by the user
  toggleSavedActivityId,//if the activity ID is saved, remove it from the saved list; if not, add it to the saved list
} from '@/services/savedItemsService'

//why use ref for activities, savedActivityIds, loading, errorMessage, filters
//because vue must be aware of data changes and automatically re-render the page
const activities = ref([])
//[{
//   id: 1,
//   name: 'Activity 1',
//   venue: 'Venue 1',
//   suburb: 'Suburb 1',
//   day: 'Monday',
//   time: '10:00',
//   recurrence: 'Weekly',
//   tags: ['Tag 1', 'Tag 2'],
//   suitability: 'yes'
// }]

const savedActivityIds =
  ref([])
//[
//'1', 
//'2', 
//'3']

const loading = ref(true)
//after API finished, return true: activities are loading

const errorMessage =
  ref('')
//if API failed, return error message

const defaultFilters = () => ({
  search: '', //walking, swimming, etc.
  area: '', //clayton, melbourne, etc.
  interest: '', //craft, music, etc.
  day: '', //Monday, Tuesday, etc.
  recurrence: '', // one-off, recurring calendar, series
  suitability: 'all', //all relevance levels, marked suitable, may be suitable
})
//defaultFilters: return an object with default filter values

const filters = ref(
  defaultFilters(),
)
// This object will change if the user modifies their selection later

//onMounted: Execute code after page component loads
//homepage -> click find activities -> route to activitiesView -> ActivitiesView mounted -> onMounted()
onMounted(async () => {
  //get the activity IDs which are saved by the user
  savedActivityIds.value =
    getSavedActivityIds()

  //wait getActivities() to finish, then assign the result to activities.value
  //ActivitiesView -> getActivities() -> activityService.js -> get /api/activities -> Express -> SQLite -> JSON response -> ActivityService nomalise -> return activities -> activities.value
  //if getActivities() failed, catch the error and show error message
  try {
    activities.value =
      await getActivities()
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load the activity information. Please try again.'
  } finally {
    // Set loading to false once the API call is complete whether it was successful or not
    loading.value = false
  }
})

//Get a list of unique suburbs from all activities
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

//Get a list of unique interests from all activities, excluding certain tags
const interests =
  computed(() => {
    const excludedTags =
      new Set([
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
                !excludedTags.has(
                  tag,
                ),
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

//Get a list of unique days from all activities, sorted in a specific order
const days = computed(() => {
  const availableDays =
    new Set(
      activities.value.map(
        (activity) =>
          activity.day,
      ),
    )

  return dayOrder.filter(
    (day) =>
      availableDays.has(day),
  )
})

//Get a list of unique recurrence options from all activities, sorted alphabetically
const recurrenceOptions =
  computed(() => {
    return [
      ...new Set(
        activities.value.map(
          (activity) =>
            activity.recurrence,
        ),
      ),
    ].sort()
  })

// Filter activities based on the selected filters
const filteredActivities =
  computed(() => {
    const search =
    // Get the search term from the filters and normalize it
      filters.value.search
        .trim()
        .toLowerCase()

    const results =
    // normalize the activities and filter them based on the selected filters
      activities.value.filter(
        (activity) => {
          if (search) {
            const searchableText = [
              activity.name,
              activity.venue,
              activity.suburb,
              activity.activityType,
              ...activity.tags,
            ]
              .join(' ')
              .toLowerCase()

            if (
              !searchableText.includes(
                search,
              )
            ) {
              return false
            }
          }
          // Check each filter and return false if the activity does not match the filter
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
            filters.value
              .suitability ===
              'recommended' &&
            activity.suitability ===
              'no'
          ) {
            return false
          }

          if (
            filters.value
              .suitability ===
              'yes' &&
            activity.suitability !==
              'yes'
          ) {
            return false
          }

          if (
            filters.value
              .suitability ===
              'partial' &&
            activity.suitability !==
              'partial'
          ) {
            return false
          }

          return true
        },
      )

    return results
  })

  // Update the filters based on user input
  // user chooses a filter option -> ActivityFilters emit new filters -> ActivitiesView get -> updateFilters(nextFilters) -> filters.value = nextFilters -> filteredActivities recomputed
const updateFilters = (
  nextFilters,
) => {
  filters.value =
    nextFilters
}

// Reset the filters to their default values
//filters changed -> computed automatically reruns -> all activities are shown
const clearFilters = () => {
  filters.value =
    defaultFilters()
}

// Check if an activity is saved by the user (check by the activity ID)
const isSaved = (
  activityId,
) => {
  return savedActivityIds.value.includes(
    String(activityId),
  )
}

//ActivityCard -> emit toggle-save -> ActivitiesView.toggleSave(id) -> savedItemsService -> update localStorage -> return latest IDs -> savedActivityIds.value updated -> update UI
const toggleSave = (
  activityId,
) => {
  savedActivityIds.value =
    toggleSavedActivityId(
      activityId,
    )
}
</script>

<template>
  <div class="activities-page">
    <section
      class="activity-page-hero"
    >
      <div class="page-container">
        <div
          class="activity-page-hero-inner"
        >
          <div>
            <p class="section-kicker">
              Local activities
            </p>

            <h1>
              Find something that
              interests you.
            </h1>

            <p>
              Search activities by
              general area, interests
              and preferred schedule
              using simple, optional
              choices.
            </p>
          </div>

          <div
            class="activity-page-privacy"
          >
            <span aria-hidden="true">
              ✓
            </span>

            <p>
              General area and interest
              selections are used only
              to improve your results.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section
      class="activities-main"
    >
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

        <div
          class="activity-data-note"
        >
          <span
            class="activity-data-note-icon"
            aria-hidden="true"
          >
            i
          </span>

          <p>
            Current pilot records may
            provide a recurring schedule
            rather than an exact event
            date. Availability and access
            details are shown only when
            supplied by the source.
          </p>
        </div>

        <div
          class="activity-results-heading"
        >
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
          v-else-if="
            errorMessage
          "
          class="activity-state-card"
          role="alert"
        >
          <h2>
            Unable to load
            activities
          </h2>

          <p>
            {{ errorMessage }}
          </p>
        </div>

        <div
          v-else-if="
            filteredActivities.length ===
            0
          "
          class="activity-state-card"
        >
          <h2>
            No matching activities
          </h2>

          <p>
            Try changing one or more
            filters to see more
            results.
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
              activity in
              filteredActivities
            "
            :key="activity.id"
            :activity="activity"
            :saved="
              isSaved(activity.id)
            "
            @toggle-save="
              toggleSave
            "
          />
        </div>
      </div>
    </section>
  </div>
</template>
