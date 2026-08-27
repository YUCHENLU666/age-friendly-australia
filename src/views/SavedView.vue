<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import { RouterLink } from 'vue-router'

import ActivityCard from '@/components/activities/ActivityCard.vue'

import {
  getActivities,
} from '@/services/activityService'

import {
  getSavedActivityIds,
  toggleSavedActivityId,
} from '@/services/savedItemsService'

const activities = ref([])
const savedIds = ref([])
const loading = ref(true)

onMounted(async () => {
  savedIds.value =
    getSavedActivityIds()

  try {
    activities.value =
      await getActivities()
  } finally {
    loading.value = false
  }
})

const savedActivities = computed(() => {
  return activities.value.filter(
    (activity) =>
      savedIds.value.includes(
        activity.id,
      ),
  )
})

const toggleSave = (id) => {
  savedIds.value =
    toggleSavedActivityId(id)
}
</script>

<template>
  <div class="saved-page">
    <section class="activity-page-hero">
      <div class="page-container">
        <div class="activity-page-hero-inner">
          <div>
            <p class="section-kicker">
              Saved items
            </p>

            <h1>
              Return to useful information.
            </h1>

            <p>
              Activities you choose to save are
              stored on this device so you can
              easily find them again.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="activities-main">
      <div class="page-container">
        <div class="activity-results-heading">
          <div>
            <p class="section-kicker">
              Your saved activities
            </p>

            <h2>
              {{ savedActivities.length }}
              saved
            </h2>
          </div>
        </div>

        <div
          v-if="loading"
          class="activity-state-card"
        >
          <h2>
            Loading saved items
          </h2>
        </div>

        <div
          v-else-if="
            savedActivities.length === 0
          "
          class="activity-state-card"
        >
          <h2>
            Nothing saved yet
          </h2>

          <p>
            Browse activities and save anything
            you may want to revisit.
          </p>

          <RouterLink
            class="activity-empty-button"
            to="/activities"
          >
            Browse activities
          </RouterLink>
        </div>

        <div
          v-else
          class="activity-results-grid"
        >
          <ActivityCard
            v-for="
              activity in savedActivities
            "
            :key="activity.id"
            :activity="activity"
            saved
            @toggle-save="toggleSave"
          />
        </div>
      </div>
    </section>
  </div>
</template>