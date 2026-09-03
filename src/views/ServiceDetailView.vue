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

// Get the current route to access the service ID from the URL
const route =
  useRoute()

// used to store the service data, loading state, error message, and saved state
const service =
  ref(null)

const loading =
  ref(true)

const errorMessage =
  ref('')

const saved =
  ref(false)

//Service loading begins after the page is mounted.
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
      <RouterLink
        to="/services"
        class="service-back-link"
      >
        ← Back to services
      </RouterLink>

      <!-- ================= LOADING ================= -->
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

      <!-- ================= ERROR ================= -->
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

      <!-- ================= SERVICE ================= -->
      <template v-else>
        <!-- Header -->
        <section class="service-detail-header">
          <div class="service-detail-header-copy">
            <p class="section-kicker">
              {{ service.type }}
            </p>

            <h1>
              {{ service.name }}
            </h1>

            <p
              v-if="
                service.provider
              "
            >
              {{ service.provider }}
            </p>
          </div>

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

        <!-- Main detail layout -->
        <div class="service-detail-grid">
          <!-- Service information -->
          <section class="service-detail-card">
            <p class="section-kicker">
              Service information
            </p>

            <h2>
              What you need to know
            </h2>

            <dl>
              <div>
                <dt>
                  Service purpose
                </dt>

                <dd>
                  {{
                    service.purpose ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>
                  Eligibility
                </dt>

                <dd>
                  {{
                    service.eligibility ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>
                  Opening hours
                </dt>

                <dd>
                  {{
                    service.openingHours ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>
                  Location
                </dt>

                <dd>
                  {{
                    service.address ||
                    service.suburb ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>
                  Contact phone
                </dt>

                <dd>
                  {{
                    service.phone ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>
                  Website
                </dt>

                <dd>
                  <a
                    v-if="
                      service.website
                    "
                    :href="
                      service.website
                    "
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit service website
                  </a>

                  <span v-else>
                    Not provided by source
                  </span>
                </dd>
              </div>

              <div>
                <dt>
                  Access details
                </dt>

                <dd>
                  {{
                    service.accessibility.length
                      ? service.accessibility.join(
                          ', ',
                        )
                      : 'Not provided by source'
                  }}
                </dd>
              </div>
            </dl>
          </section>

          <!-- Trusted source -->
          <aside class="service-detail-source">
            <p class="section-kicker">
              Trusted information
            </p>

            <h2>
              Data source
            </h2>

            <p>
              {{
                service.source ||
                'Source not provided'
              }}
            </p>

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

            <!-- Transport -->
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

            <!-- Data integrity notice -->
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