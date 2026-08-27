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

const route = useRoute()

const service = ref(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    service.value =
      await getServiceById(
        route.params.id,
      )

    if (!service.value) {
      errorMessage.value =
        'This service could not be found.'
    }
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load this service.'
  } finally {
    loading.value = false
  }
})
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

      <div
        v-if="loading"
        class="service-state-card"
      >
        <h1>
          Loading service
        </h1>
      </div>

      <div
        v-else-if="errorMessage"
        class="service-state-card"
      >
        <h1>
          Service unavailable
        </h1>

        <p>
          {{ errorMessage }}
        </p>
      </div>

      <template v-else>
        <section class="service-detail-header">
          <p class="section-kicker">
            {{ service.type }}
          </p>

          <h1>
            {{ service.name }}
          </h1>

          <p v-if="service.provider">
            {{ service.provider }}
          </p>
        </section>

        <div class="service-detail-grid">
          <section class="service-detail-card">
            <h2>
              Service information
            </h2>

            <dl>
              <div>
                <dt>Purpose</dt>

                <dd>
                  {{
                    service.purpose ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Eligibility</dt>

                <dd>
                  {{
                    service.eligibility ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Opening hours</dt>

                <dd>
                  {{
                    service.openingHours ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Location</dt>

                <dd>
                  {{
                    service.address ||
                    service.suburb ||
                    'Not provided by source'
                  }}
                </dd>
              </div>

              <div>
                <dt>Contact</dt>

                <dd>
                  {{
                    service.phone ||
                    'Not provided by source'
                  }}
                </dd>
              </div>
            </dl>
          </section>

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
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>