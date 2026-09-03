<script setup>
import {
  onMounted,
  ref,
} from 'vue'

import {
  RouterLink,
  useRoute,
} from 'vue-router'

import {
  getActivityById,
} from '@/services/activityService'

import {
  getSavedActivityIds,
  toggleSavedActivityId,
} from '@/services/savedItemsService'

// Get the current route to access the activity ID from the URL
const route = useRoute()

// used to store the activity data, loading state, error message, and saved state
const activity = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const saved = ref(false)

//Activity loading begins after the page is mounted.
onMounted(async () => {
  try {
    activity.value =
      await getActivityById(
        route.params.id,
      )

    if (!activity.value) {
      errorMessage.value =
        'This activity could not be found.'
      return
    }

    saved.value =
      getSavedActivityIds().includes(
        activity.value.id,
      )
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load this activity.'
  } finally {
    loading.value = false
  }
})

const toggleSave = () => {
  if (!activity.value) {
    return
  }

  const ids =
    toggleSavedActivityId(
      activity.value.id,
    )

  saved.value =
    ids.includes(
      activity.value.id,
    )
}
</script>

<template>
  <section class="activity-detail-page">
    <div class="page-container">
      <RouterLink
        class="activity-back-link"
        to="/activities"
      >
        ← Back to activities
      </RouterLink>

      <div
        v-if="loading"
        class="activity-state-card"
      >
        <h1>
          Loading activity
        </h1>
      </div>

      <div
        v-else-if="errorMessage"
        class="activity-state-card"
      >
        <h1>
          Activity unavailable
        </h1>

        <p>
          {{ errorMessage }}
        </p>
      </div>

      <template v-else>
        <div class="activity-detail-hero">
          <div class="activity-detail-image-wrap">
            <img
              :src="activity.image"
              :alt="`${activity.name} activity`"
              class="activity-detail-image"
            />
          </div>

          <div class="activity-detail-summary">
            <p class="section-kicker">
              {{ activity.primaryTag }}
            </p>

            <h1>
              {{ activity.name }}
            </h1>

            <p class="activity-detail-location">
              {{ activity.venue }}
              <span aria-hidden="true">·</span>
              {{ activity.suburb }}
            </p>

            <span
              class="activity-suitability"
              :class="{
                'activity-suitability--yes':
                  activity.suitability ===
                  'yes',
                'activity-suitability--partial':
                  activity.suitability ===
                  'partial',
                'activity-suitability--no':
                  activity.suitability ===
                  'no',
              }"
            >
              {{
                activity.suitabilityLabel
              }}
            </span>

            <button
              class="activity-detail-save-button"
              type="button"
              :aria-pressed="saved"
              @click="toggleSave"
            >
              <span aria-hidden="true">
                {{ saved ? '★' : '☆' }}
              </span>

              {{
                saved
                  ? 'Saved activity'
                  : 'Save activity'
              }}
            </button>
          </div>
        </div>

        <div class="activity-detail-grid">
          <section class="activity-detail-card">
            <p class="section-kicker">
              Activity information
            </p>

            <h2>
              What you need to know
            </h2>

            <dl class="activity-detail-list">
              <div>
                <dt>Schedule</dt>
                <dd>
                  {{
                    activity.schedule ||
                    'Not provided by this source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Exact date</dt>
                <dd>
                  {{
                    activity.exactDate ||
                    'Not provided by this source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Schedule type</dt>
                <dd>
                  {{
                    activity.recurrence
                  }}
                </dd>
              </div>

              <div>
                <dt>Organiser</dt>
                <dd>
                  {{
                    activity.organiser ||
                    'Not provided by this source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Availability</dt>
                <dd>
                  {{
                    activity.availability ||
                    'Not provided by this source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Access details</dt>
                <dd>
                  {{
                    activity.accessibility ||
                    'Not provided by this source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Joining information</dt>
                <dd>
                  {{
                    activity.joiningInformation ||
                    'Not provided by this source'
                  }}
                </dd>
              </div>
            </dl>
          </section>

          <aside class="activity-source-card">
            <p class="section-kicker">
              Source information
            </p>

            <h2>
              Where this information came from
            </h2>

            <p>
              {{ activity.source }}
            </p>

            <div
              v-if="activity.nearestTransportStop"
              class="service-detail-transport"
            >
              <strong>
                Nearby transport
              </strong>

              <p>
                {{ activity.nearestTransportStop.stopName }}
                <span aria-hidden="true">·</span>
                {{ activity.nearestTransportStop.distanceLabel }}
              </p>
            </div>  
            
            <div class="activity-source-notice">
              Details that are not supplied by the
              current source are not guessed or
              generated.
            </div>
          </aside>
        </div>
      </template>
    </div>
  </section>
</template>