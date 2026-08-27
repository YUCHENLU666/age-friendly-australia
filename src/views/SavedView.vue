<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  RouterLink,
} from 'vue-router'

import ActivityCard from '@/components/activities/ActivityCard.vue'
import ServiceCard from '@/components/services/ServiceCard.vue'

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

const activities = ref([])
const services = ref([])

const savedActivityIds =
  ref([])

const savedServiceIds =
  ref([])

const activeTab =
  ref('all')

const loading =
  ref(true)

const errorMessage =
  ref('')

onMounted(async () => {
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

    if (
      results[0].status ===
      'fulfilled'
    ) {
      activities.value =
        results[0].value
    }

    if (
      results[1].status ===
      'fulfilled'
    ) {
      services.value =
        results[1].value
    }

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

const totalSaved =
  computed(() => {
    return (
      savedActivities.value.length +
      savedServices.value.length
    )
  })

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