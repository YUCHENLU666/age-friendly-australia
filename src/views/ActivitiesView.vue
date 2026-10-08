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


// ======================================================
// Activities page
// ======================================================
//
// ActivitiesView is the main parent component for the
// activity discovery feature.
//
// Main data flow:
//
// SQLite
//   ↓
// Backend GET /api/activities
//   ↓
// activityService
//   ↓
// Normalised activity objects
//   ↓
// ActivitiesView
//   ↓
// ActivityFilters + ActivityCard
//
// This component is responsible for:
// - loading activities
// - generating available filter options
// - filtering the activity catalogue
// - managing saved activity state
// - rendering loading, error and empty states
//


// ======================================================
// Page state
// ======================================================

// Complete activity catalogue returned by activityService.
const activities = ref([])

// IDs of activities currently saved by the user.
// These IDs are persisted through savedItemsService.
const savedActivityIds =
  ref([])

// Loading state while activity data is being requested.
const loading = ref(true)

// User-facing message shown if activity loading fails.
const errorMessage =
  ref('')


// ======================================================
// Filter state
// ======================================================

// Return a fresh default filter object.
//
// Using a function allows clearFilters() to create a new
// object whenever the filters need to be reset.
const defaultFilters = () => ({
  search: '',
  area: '',
  interest: '',
  day: '',
  recurrence: '',
  suitability: 'all',
})

// Current filter selections.
//
// ActivityFilters updates this object through emitted
// events. Any change automatically causes the computed
// filteredActivities list to recalculate.
const filters = ref(
  defaultFilters(),
)


// ======================================================
// Load activity data
// ======================================================
//
// When this page opens:
//
// 1. Read saved activity IDs.
// 2. Request the activity catalogue.
// 3. Store the normalised activities.
// 4. Display an error message if loading fails.
// 5. End the loading state.
//
// Activity data flow:
//
// ActivitiesView
//   ↓
// getActivities()
//   ↓
// activityService
//   ↓
// GET /api/activities
//   ↓
// Express backend
//   ↓
// SQLite
//
onMounted(async () => {
  // Restore previously saved activity IDs.
  savedActivityIds.value =
    getSavedActivityIds()

  try {
    // activityService returns activity data that has
    // already been normalised for frontend use.
    activities.value =
      await getActivities()
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load the activity information. Please try again.'
  } finally {
    // Stop the loading state whether the request
    // succeeds or fails.
    loading.value = false
  }
})


// ======================================================
// Dynamic filter options
// ======================================================

// Build a unique, alphabetically sorted suburb list
// from the currently loaded activities.
//
// This means the Area filter always reflects the
// activity catalogue rather than using hard-coded values.
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


// Build a unique interest list from activity tags.
//
// Generic source tags that are not useful as user-facing
// interests are removed before the list is displayed.
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


// Preferred display order for activity days.
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

// Build the Day filter using only days that actually
// exist in the current activity catalogue.
//
// dayOrder keeps weekdays in a natural calendar order
// instead of alphabetical order.
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


// Build a unique, alphabetically sorted list of
// recurrence / schedule types from the activity data.
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


// ======================================================
// Activity filtering
// ======================================================
//
// filteredActivities automatically recalculates whenever
// either the activity catalogue or filter selections
// change.
//
// An activity must pass every active filter before it is
// included in the results.
//
const filteredActivities =
  computed(() => {
    // Normalise the free-text search so that matching
    // is case-insensitive and ignores surrounding spaces.
    const search =
      filters.value.search
        .trim()
        .toLowerCase()

    const results =
      activities.value.filter(
        (activity) => {
          // ------------------------------------------
          // Free-text search
          // ------------------------------------------
          //
          // Search across several useful activity fields
          // instead of checking the activity name only.
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

          // ------------------------------------------
          // Area filter
          // ------------------------------------------
          if (
            filters.value.area &&
            activity.suburb !==
              filters.value.area
          ) {
            return false
          }

          // ------------------------------------------
          // Interest filter
          // ------------------------------------------
          if (
            filters.value.interest &&
            !activity.tags.includes(
              filters.value.interest,
            )
          ) {
            return false
          }

          // ------------------------------------------
          // Preferred day filter
          // ------------------------------------------
          if (
            filters.value.day &&
            activity.day !==
              filters.value.day
          ) {
            return false
          }

          // ------------------------------------------
          // Schedule / recurrence filter
          // ------------------------------------------
          if (
            filters.value.recurrence &&
            activity.recurrence !==
              filters.value.recurrence
          ) {
            return false
          }

          // ------------------------------------------
          // Older-adult suitability filter
          // ------------------------------------------

          // Recommended includes activities unless they
          // are explicitly marked as unsuitable.
          if (
            filters.value
              .suitability ===
              'recommended' &&
            activity.suitability ===
              'no'
          ) {
            return false
          }

          // Show only activities explicitly marked
          // as suitable.
          if (
            filters.value
              .suitability ===
              'yes' &&
            activity.suitability !==
              'yes'
          ) {
            return false
          }

          // Show only activities marked as potentially
          // suitable.
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


// ======================================================
// Filter actions
// ======================================================

// ActivityFilters emits a complete updated filter object.
//
// Data flow:
//
// User changes a filter
//   ↓
// ActivityFilters
//   ↓
// emit update:filters
//   ↓
// ActivitiesView.updateFilters()
//   ↓
// filters.value changes
//   ↓
// filteredActivities recalculates
//
const updateFilters = (
  nextFilters,
) => {
  filters.value =
    nextFilters
}


// Restore every filter to its default value.
//
// Because filteredActivities is computed, resetting
// filters automatically refreshes the displayed results.
const clearFilters = () => {
  filters.value =
    defaultFilters()
}


// ======================================================
// Saved activity actions
// ======================================================

// Check whether a particular activity ID is currently
// stored in the user's saved activity list.
const isSaved = (
  activityId,
) => {
  return savedActivityIds.value.includes(
    String(activityId),
  )
}


// Save or remove an activity.
//
// Data flow:
//
// ActivityCard
//   ↓
// emit toggle-save(activityId)
//   ↓
// ActivitiesView.toggleSave()
//   ↓
// savedItemsService
//   ↓
// localStorage
//   ↓
// updated saved IDs
//   ↓
// UI updates automatically
//
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
    <!-- ==============================================
         Page introduction
    =============================================== -->
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


    <!-- ==============================================
         Activity discovery content
    =============================================== -->
    <section
      class="activities-main"
    >
      <div class="page-container">

        <!--
          ActivityFilters receives the available filter
          options from this parent component.

          It sends filter changes back through:
          update:filters

          The Clear button sends:
          clear
        -->
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


        <!--
          Explain an important limitation of the pilot
          activity dataset to the user.
        -->
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


        <!-- ==========================================
             Result count
        =========================================== -->
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


        <!-- ==========================================
             Loading state
        =========================================== -->
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


        <!-- ==========================================
             Error state
        =========================================== -->
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


        <!-- ==========================================
             No matching activities
        =========================================== -->
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


        <!-- ==========================================
             Activity result cards
        =========================================== -->
        <!--
          One ActivityCard is rendered for every
          filtered activity.

          The parent provides:
          - the complete activity object
          - whether the activity is currently saved

          ActivityCard sends toggle-save back when
          the user clicks Save / Saved.
        -->
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