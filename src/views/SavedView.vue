<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  RouterLink,
} from 'vue-router'

//Pages that directly reuse ActivityCard.vue and ServiceCard.vue
import ActivityCard from '@/components/activities/ActivityCard.vue'
import ServiceCard from '@/components/services/ServiceCard.vue'

// now we have saved IDs for activities and services, but we need to get the full information for each saved item
import {
  getActivities,
} from '@/services/activityService'

import {
  getServices,
} from '@/services/serviceService'

import {
  getSavedActivityIds,
  getSavedServiceIds,
  toggleSavedActivityId,
  toggleSavedServiceId,
} from '@/services/savedItemsService'

//This is where complete data on activities and services is stored.
const activities = ref([])
const services = ref([])

//ID read from localStorage
const savedActivityIds =
  ref([])

const savedServiceIds =
  ref([])

//This is the active tab, which can be "all", "activities", or "services"
const activeTab =
  ref('all')

const loading =
  ref(true)
  //after API finished, return true: saved are loading

const errorMessage =
  ref('')
  //if API failed, return error message

//onMounted: Execute code after page component loads
//homepage -> click find saved -> route to SavedView -> SavedView mounted -> onMounted()
onMounted(async () => {
  // Load saved activity and service IDs from local storage
  savedActivityIds.value =
    getSavedActivityIds()

  savedServiceIds.value =
    getSavedServiceIds()

  try {
    const results =
      await Promise.allSettled([
        getActivities(),
        getServices(),
      ])

      //check the activities API call result, if fulfilled, store the data in activities.value
    if (
      results[0].status ===
      'fulfilled'
    ) {
      activities.value =
        results[0].value
    }
      //check the services API call result, if fulfilled, store the data in services.value
    if (
      results[1].status ===
      'fulfilled'
    ) {
      services.value =
        results[1].value
    }

    //if both API calls failed, set an error message
    if (
      results.every(
        (result) =>
          result.status ===
          'rejected',
      )
    ) {
      errorMessage.value =
        'We could not load your saved items.'
    }
  } finally {
    loading.value = false
  }
})

//check the saved activities and services IDs in full data, and return the full data for each saved item
//that's why we just need to store the IDs in localStorage, and we can get the full data from the API when needed
const savedActivities =
  computed(() => {
    return activities.value.filter(
      (activity) =>
        savedActivityIds.value.includes(
          activity.id,
        ),
    )
  })

const savedServices =
  computed(() => {
    return services.value.filter(
      (service) =>
        savedServiceIds.value.includes(
          service.id,
        ),
    )
  })

// calculate the total number of saved items
const totalSaved =
  computed(() => {
    return (
      savedActivities.value.length +
      savedServices.value.length
    )
  })

// define the tabs for the saved items view, including the label and count for each tab
const tabs = computed(() => [
  {
    id: 'all',
    label: 'All saved',
    count:
      totalSaved.value,
  },
  {
    id: 'activities',
    label: 'Activities',
    count:
      savedActivities.value.length,
  },
  {
    id: 'services',
    label: 'Services',
    count:
      savedServices.value.length,
  },
])

// if activeTab is "all" show both activities and services
// if activeTab is "activities" show only activities, 
// if activeTab is "services" show only services
const showActivities =
  computed(() => {
    return (
      activeTab.value === 'all' ||
      activeTab.value ===
        'activities'
    )
  })

const showServices =
  computed(() => {
    return (
      activeTab.value === 'all' ||
      activeTab.value ===
        'services'
    )
  })

// check if the current tab is empty, and return true if there are no saved items for the active tab
const currentTabEmpty =
  computed(() => {
    if (
      activeTab.value ===
      'activities'
    ) {
      return (
        savedActivities.value.length ===
        0
      )
    }

    if (
      activeTab.value ===
      'services'
    ) {
      return (
        savedServices.value.length ===
        0
      )
    }

    return (
      totalSaved.value === 0
    )
  })

//used to toggle the saved state of an activity or service when the user clicks the save button on the card
const toggleActivitySave = (
  id,
) => {
  savedActivityIds.value =
    toggleSavedActivityId(
      id,
    )
}

const toggleServiceSave = (
  id,
) => {
  savedServiceIds.value =
    toggleSavedServiceId(
      id,
    )
}
</script>

<template>
  <main class="saved-page">
    <!-- ================= HERO ================= -->
    <section class="saved-hero">
      <div class="page-container">
        <div class="saved-hero-grid">
          <div>
            <p class="section-kicker">
              Saved items
            </p>

            <h1>
              Keep useful information
              easy to find.
            </h1>

            <p>
              Save activities and services
              that you may want to revisit
              later.
            </p>
          </div>

          <aside class="saved-device-note">
            <span aria-hidden="true">
              ✓
            </span>

            <div>
              <strong>
                Saved on this device
              </strong>

              <p>
                Your saved item references
                stay in this browser and can
                be removed at any time.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- ================= MAIN ================= -->
    <section class="saved-main">
      <div class="page-container">
        <!-- Summary -->
        <div class="saved-summary-grid">
          <article>
            <span>
              Total saved
            </span>

            <strong>
              {{ totalSaved }}
            </strong>
          </article>

          <article>
            <span>
              Activities
            </span>

            <strong>
              {{
                savedActivities.length
              }}
            </strong>
          </article>

          <article>
            <span>
              Services
            </span>

            <strong>
              {{
                savedServices.length
              }}
            </strong>
          </article>
        </div>

        <!-- Tabs -->
        <div class="saved-toolbar">
          <div
            class="saved-tabs"
            role="tablist"
            aria-label="Saved item type"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="saved-tab"
              :class="{
                'saved-tab--active':
                  activeTab ===
                  tab.id,
              }"
              role="tab"
              :aria-selected="
                activeTab ===
                tab.id
              "
              @click="
                activeTab =
                  tab.id
              "
            >
              {{ tab.label }}

              <span>
                {{ tab.count }}
              </span>
            </button>
          </div>

          <p>
            Remove an item by selecting
            Saved again.
          </p>
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="saved-state-card"
        >
          <div
            class="activity-loading-spinner"
            aria-hidden="true"
          ></div>

          <h2>
            Loading saved items
          </h2>

          <p>
            Please wait a moment.
          </p>
        </div>

        <!-- Error -->
        <div
          v-else-if="
            errorMessage
          "
          class="saved-state-card"
          role="alert"
        >
          <h2>
            Unable to load saved items
          </h2>

          <p>
            {{ errorMessage }}
          </p>
        </div>

        <!-- Empty -->
        <div
          v-else-if="
            currentTabEmpty
          "
          class="saved-state-card saved-empty-state"
        >
          <div
            class="saved-empty-icon"
            aria-hidden="true"
          >
            ☆
          </div>

          <p class="section-kicker">
            Nothing here yet
          </p>

          <h2>
            {{
              activeTab ===
                'services'
                ? 'No saved services yet.'
                : activeTab ===
                    'activities'
                  ? 'No saved activities yet.'
                  : 'Nothing saved yet.'
            }}
          </h2>

          <p>
            Browse useful information
            and select Save whenever
            you want to return to it
            later.
          </p>

          <div class="saved-empty-actions">
            <RouterLink
              to="/activities"
              class="saved-primary-link"
            >
              Browse activities
            </RouterLink>

            <RouterLink
              to="/services"
              class="saved-secondary-link"
            >
              Browse services
            </RouterLink>
          </div>
        </div>

        <!-- Results -->
        <template v-else>
          <!-- Activities -->
          <section
            v-if="
              showActivities &&
              savedActivities.length
            "
            class="saved-content-section"
          >
            <div class="saved-section-heading">
              <div>
                <p class="section-kicker">
                  Activities
                </p>

                <h2>
                  Saved activities
                </h2>
              </div>

              <span>
                {{
                  savedActivities.length
                }}
                saved
              </span>
            </div>

            <div class="activity-results-grid">
              <ActivityCard
                v-for="
                  activity in
                  savedActivities
                "
                :key="activity.id"
                :activity="activity"
                saved
                @toggle-save="
                  toggleActivitySave
                "
              />
            </div>
          </section>

          <!-- Services -->
          <section
            v-if="
              showServices &&
              savedServices.length
            "
            class="saved-content-section"
          >
            <div class="saved-section-heading">
              <div>
                <p class="section-kicker">
                  Services
                </p>

                <h2>
                  Saved services
                </h2>
              </div>

              <span>
                {{
                  savedServices.length
                }}
                saved
              </span>
            </div>

            <div class="service-results-grid">
              <ServiceCard
                v-for="
                  service in
                  savedServices
                "
                :key="service.id"
                :service="service"
                saved
                @toggle-save="
                  toggleServiceSave
                "
              />
            </div>
          </section>
        </template>
      </div>
    </section>
  </main>
</template>