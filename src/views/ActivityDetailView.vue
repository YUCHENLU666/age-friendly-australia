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


// ======================================================
// Current route
// ======================================================

// Get the current route so the activity ID
// can be read from route.params.id.
const route =
  useRoute()


// ======================================================
// Page state
// ======================================================

// Selected activity returned by activityService.
const activity =
  ref(null)

// True while activity data is loading.
const loading =
  ref(true)

// Message displayed when activity loading fails.
const errorMessage =
  ref('')

// True when the current activity has been saved.
const saved =
  ref(false)


// ======================================================
// Load activity
// ======================================================

// Load the requested activity when the page opens.
//
// Example:
// /activities/7
//
// The activity with ID 7 is loaded and its saved
// state is restored from savedItemsService.
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


// ======================================================
// Save / unsave activity
// ======================================================

// Save or unsave the current activity
// and update the button state.
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

      <!-- ============================================
           Back navigation
      ============================================= -->
      <RouterLink
        class="activity-back-link"
        to="/activities"
      >
        ← Back to activities
      </RouterLink>


      <!-- ============================================
           Loading state
      ============================================= -->
      <div
        v-if="loading"
        class="activity-state-card"
      >
        <h1>
          Loading activity
        </h1>
      </div>


      <!-- ============================================
           Error state
      ============================================= -->
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


      <!-- ============================================
           Activity content
      ============================================= -->
      <template v-else>

        <!-- ==========================================
             Activity hero
        =========================================== -->
        <div class="activity-detail-hero">

          <!-- Activity image -->
          <div class="activity-detail-image-wrap">
            <img
              :src="activity.image"
              :alt="`${activity.name} activity`"
              class="activity-detail-image"
            />
          </div>


          <!-- Activity summary -->
          <div class="activity-detail-summary">

            <!-- Primary category -->
            <p
              v-if="activity.primaryTag"
              class="section-kicker"
            >
              {{ activity.primaryTag }}
            </p>


            <!-- Activity name -->
            <h1>
              {{ activity.name }}
            </h1>


            <!-- Location -->
            <p
              v-if="
                (
                  activity.venue &&
                  activity.venue !==
                    'Venue not provided'
                ) ||
                (
                  activity.suburb &&
                  activity.suburb !==
                    'Area not provided'
                )
              "
              class="activity-detail-location"
            >
              <span
                v-if="
                  activity.venue &&
                  activity.venue !==
                    'Venue not provided'
                "
              >
                {{ activity.venue }}
              </span>

              <span
                v-if="
                  activity.venue &&
                  activity.venue !==
                    'Venue not provided' &&
                  activity.suburb &&
                  activity.suburb !==
                    'Area not provided'
                "
                aria-hidden="true"
              >
                ·
              </span>

              <span
                v-if="
                  activity.suburb &&
                  activity.suburb !==
                    'Area not provided'
                "
              >
                {{ activity.suburb }}
              </span>
            </p>


            <!--
              Suitability is displayed only when
              actual suitability information exists.

              activityService uses "unknown" when
              suitability was not provided.
            -->
            <span
              v-if="
                activity.suitability !==
                'unknown'
              "
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


            <!-- Save button -->
            <button
              class="activity-detail-save-button"
              type="button"
              :aria-pressed="saved"
              @click="toggleSave"
            >
              <span aria-hidden="true">
                {{
                  saved
                    ? '★'
                    : '☆'
                }}
              </span>

              {{
                saved
                  ? 'Saved activity'
                  : 'Save activity'
              }}
            </button>
          </div>
        </div>


        <!-- ==========================================
             Main detail layout
        =========================================== -->
        <div class="activity-detail-grid">

          <!-- ========================================
               Activity information
          ========================================= -->
          <section class="activity-detail-card">
            <p class="section-kicker">
              Activity information
            </p>

            <h2>
              What you need to know
            </h2>


            <!--
              Only fields containing useful activity
              information are displayed.

              Missing values are hidden instead of
              showing "Not provided by this source".
            -->
            <dl class="activity-detail-list">

              <!-- Schedule -->
              <div
                v-if="
                  activity.schedule
                "
              >
                <dt>
                  Schedule
                </dt>

                <dd>
                  {{ activity.schedule }}
                </dd>
              </div>


              <!-- Exact date -->
              <div
                v-if="
                  activity.exactDate
                "
              >
                <dt>
                  Exact date
                </dt>

                <dd>
                  {{ activity.exactDate }}
                </dd>
              </div>


              <!-- Schedule type -->
              <div
                v-if="
                  activity.recurrence &&
                  activity.recurrence !==
                    'Not provided'
                "
              >
                <dt>
                  Schedule type
                </dt>

                <dd>
                  {{ activity.recurrence }}
                </dd>
              </div>


              <!-- Organiser -->
              <div
                v-if="
                  activity.organiser
                "
              >
                <dt>
                  Organiser
                </dt>

                <dd>
                  {{ activity.organiser }}
                </dd>
              </div>


              <!-- Availability -->
              <div
                v-if="
                  activity.availability
                "
              >
                <dt>
                  Availability
                </dt>

                <dd>
                  {{ activity.availability }}
                </dd>
              </div>


              <!-- Access details -->
              <div
                v-if="
                  activity.accessibility
                "
              >
                <dt>
                  Access details
                </dt>

                <dd>
                  {{ activity.accessibility }}
                </dd>
              </div>


              <!-- Joining information -->
              <div
                v-if="
                  activity.joiningInformation
                "
              >
                <dt>
                  Joining information
                </dt>

                <dd>
                  {{
                    activity.joiningInformation
                  }}
                </dd>
              </div>

            </dl>
          </section>


          <!-- ========================================
               Source information
          ========================================= -->
          <aside class="activity-source-card">
            <p class="section-kicker">
              Source information
            </p>

            <h2>
              Where this information came from
            </h2>


            <!--
              activityService may use
              "Source not provided" as a fallback.

              Do not display the fallback as real
              source information.
            -->
            <p
              v-if="
                activity.source &&
                activity.source !==
                  'Source not provided'
              "
            >
              {{ activity.source }}
            </p>


            <!-- ======================================
                 Nearby transport
            ======================================= -->
            <div
              v-if="
                activity.nearestTransportStop
              "
              class="service-detail-transport"
            >
              <strong>
                Nearby transport
              </strong>

              <p>
                {{
                  activity
                    .nearestTransportStop
                    .stopName
                }}

                <span
                  v-if="
                    activity
                      .nearestTransportStop
                      .distanceLabel
                  "
                  aria-hidden="true"
                >
                  ·
                </span>

                <span
                  v-if="
                    activity
                      .nearestTransportStop
                      .distanceLabel
                  "
                >
                  {{
                    activity
                      .nearestTransportStop
                      .distanceLabel
                  }}
                </span>
              </p>
            </div>


            <!-- ======================================
                 Data integrity notice
            ======================================= -->
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