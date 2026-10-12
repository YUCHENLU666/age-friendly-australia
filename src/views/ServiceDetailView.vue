<!--
src/views/ServiceDetailView.vue

Show one service and its nearest stop when available.

How calls move:
onMounted -> getServiceById -> getServices ->
getTransitStops -> findNearestStop;
toggleSave -> toggleSavedServiceId.

Reading tips:
  Examples show one possible case, not fixed API or model results.
  Promise: a result to wait for; await gets the result when the work finishes.
  ref: a page value; changing it lets Vue update the screen.

Functions:
  toggleSave - Save or unsave this service and update the button.

Fixed values and data:
  route - Current page URL; route.params.id is the requested service ID.

Page values and kept data:
  service - The selected service object, or null when it is missing.
  loading - True while the page is loading; false when loading ends.
  errorMessage - Error text shown on the page when data loading fails.
  saved - True if this service is saved; controls the Save button.

Page start and API handlers:
  onMounted callback - Read the URL ID, load its service,
  and set its saved button state.

Notes:
  Details come from the service list, not a separate
  /api/services/:id API.

  If stop loading fails, the service details can still be shown.

  Optional service fields are displayed only when real data
  is available.

  Missing fields are hidden instead of displaying
  "Not provided by source".
-->

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
  getServiceById,
} from '@/services/serviceService'

import {
  getSavedServiceIds,
  toggleSavedServiceId,
} from '@/services/savedItemsService'


// ======================================================
// Current route
// ======================================================

// Current page URL.
// route.params.id is the requested service ID.
const route =
  useRoute()


// ======================================================
// Page state
// ======================================================

// The selected service object,
// or null when it is missing.
const service =
  ref(null)

// True while the page is loading.
const loading =
  ref(true)

// Error text shown when service loading fails.
const errorMessage =
  ref('')

// True if this service is currently saved.
const saved =
  ref(false)


// ======================================================
// Load service
// ======================================================

// Read the service ID from the URL,
// load the matching service,
// and restore its saved state.
//
// Example input:
// /services/7
//
// Example result:
// service contains record 7,
// loading becomes false,
// and saved reflects localStorage.
onMounted(async () => {
  try {
    service.value =
      await getServiceById(
        route.params.id,
      )

    if (!service.value) {
      errorMessage.value =
        'This service could not be found.'

      return
    }

    saved.value =
      getSavedServiceIds().includes(
        service.value.id,
      )
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load this service.'
  } finally {
    loading.value = false
  }
})


// ======================================================
// Save / unsave service
// ======================================================

// Save or unsave this service
// and update the button state.
//
// Example input:
// service.id='7', saved=false
//
// Example result:
// localStorage includes '7'
// and saved becomes true.
const toggleSave = () => {
  if (!service.value) {
    return
  }

  const savedIds =
    toggleSavedServiceId(
      service.value.id,
    )

  saved.value =
    savedIds.includes(
      service.value.id,
    )
}
</script>


<template>
  <main class="service-detail-page">
    <div class="page-container">

      <!-- ============================================
           Back navigation
      ============================================= -->
      <RouterLink
        to="/services"
        class="service-back-link"
      >
        ← Back to services
      </RouterLink>


      <!-- ============================================
           Loading state
      ============================================= -->
      <div
        v-if="loading"
        class="service-state-card"
      >
        <div
          class="service-state-icon"
          aria-hidden="true"
        >
          …
        </div>

        <h1>
          Loading service
        </h1>

        <p>
          Please wait a moment.
        </p>
      </div>


      <!-- ============================================
           Error state
      ============================================= -->
      <div
        v-else-if="
          errorMessage
        "
        class="service-state-card"
      >
        <div
          class="service-state-icon"
          aria-hidden="true"
        >
          !
        </div>

        <h1>
          Service unavailable
        </h1>

        <p>
          {{ errorMessage }}
        </p>

        <RouterLink
          to="/services"
          class="activity-empty-button"
        >
          Return to services
        </RouterLink>
      </div>


      <!-- ============================================
           Service content
      ============================================= -->
      <template v-else>

        <!-- ==========================================
             Service header
        =========================================== -->
        <section class="service-detail-header">
          <div class="service-detail-header-copy">

            <!-- Service type -->
            <p
              v-if="service.type"
              class="section-kicker"
            >
              {{ service.type }}
            </p>

            <!-- Service name -->
            <h1>
              {{ service.name }}
            </h1>

            <!-- Provider -->
            <p
              v-if="
                service.provider
              "
            >
              {{ service.provider }}
            </p>
          </div>


          <!-- Save button -->
          <button
            type="button"
            class="service-detail-save"
            :class="{
              'service-detail-save--saved':
                saved,
            }"
            :aria-pressed="saved"
            @click="
              toggleSave
            "
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
                ? 'Saved service'
                : 'Save service'
            }}
          </button>
        </section>


        <!-- ==========================================
             Main detail layout
        =========================================== -->
        <div class="service-detail-grid">

          <!-- ========================================
               Service information
          ========================================= -->
          <section class="service-detail-card">
            <p class="section-kicker">
              Service information
            </p>

            <h2>
              What you need to know
            </h2>


            <!--
              Only fields containing real service
              information are rendered.

              Empty values are hidden instead of showing
              placeholder text such as
              "Not provided by source".
            -->
            <dl>

              <!-- Service purpose -->
              <div
                v-if="
                  service.purpose
                "
              >
                <dt>
                  Service purpose
                </dt>

                <dd>
                  {{ service.purpose }}
                </dd>
              </div>


              <!-- Eligibility -->
              <div
                v-if="
                  service.eligibility
                "
              >
                <dt>
                  Eligibility
                </dt>

                <dd>
                  {{ service.eligibility }}
                </dd>
              </div>


              <!-- Opening hours -->
              <div
                v-if="
                  service.openingHours
                "
              >
                <dt>
                  Opening hours
                </dt>

                <dd>
                  {{ service.openingHours }}
                </dd>
              </div>


              <!-- Location -->
              <div
                v-if="
                  service.address ||
                  service.suburb
                "
              >
                <dt>
                  Location
                </dt>

                <dd>
                  {{
                    service.address ||
                    service.suburb
                  }}
                </dd>
              </div>


              <!-- Contact phone -->
              <div
                v-if="
                  service.phone
                "
              >
                <dt>
                  Contact phone
                </dt>

                <dd>
                  {{ service.phone }}
                </dd>
              </div>


              <!-- Website -->
              <div
                v-if="
                  service.website
                "
              >
                <dt>
                  Website
                </dt>

                <dd>
                  <a
                    :href="
                      service.website
                    "
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit service website
                  </a>
                </dd>
              </div>


              <!-- Accessibility -->
              <div
                v-if="
                  service.accessibility?.length
                "
              >
                <dt>
                  Access details
                </dt>

                <dd>
                  {{
                    service.accessibility.join(
                      ', ',
                    )
                  }}
                </dd>
              </div>

            </dl>
          </section>


          <!-- ========================================
               Trusted information
          ========================================= -->
          <aside class="service-detail-source">
            <p class="section-kicker">
              Trusted information
            </p>

            <h2>
              Data source
            </h2>


            <!-- Source description -->
            <p
              v-if="
                service.source
              "
            >
              {{ service.source }}
            </p>


            <!-- Original source link -->
            <a
              v-if="
                service.sourceUrl
              "
              :href="
                service.sourceUrl
              "
              target="_blank"
              rel="noopener noreferrer"
              class="service-source-link"
            >
              View original source

              <span aria-hidden="true">
                ↗
              </span>
            </a>


            <!-- ======================================
                 Nearby transport
            ======================================= -->
            <div
              v-if="
                service.nearestTransportStop
              "
              class="service-detail-transport"
            >
              <strong>
                Nearby transport
              </strong>

              <p>
                {{
                  service.nearestTransportStop
                }}

                <span
                  v-if="
                    service.transportDistance
                  "
                >
                  ·
                  {{
                    service.transportDistance
                  }}
                </span>
              </p>
            </div>


            <!-- ======================================
                 Data integrity notice
            ======================================= -->
            <div class="activity-source-notice">
              Details that are not supplied
              by the verified source are not
              guessed or generated.
            </div>
          </aside>

        </div>
      </template>
    </div>
  </main>
</template>