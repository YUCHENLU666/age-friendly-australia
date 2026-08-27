<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import ServiceCard from '@/components/services/ServiceCard.vue'
import ServiceFilters from '@/components/services/ServiceFilters.vue'

import {
  getServices,
} from '@/services/serviceService'

const services = ref([])

const loading = ref(true)

const errorMessage = ref('')

const filters = ref({
  search: '',
  area: '',
  type: '',
  accessibility: '',
})

onMounted(async () => {
  try {
    services.value =
      await getServices()
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load the service directory.'
  } finally {
    loading.value = false
  }
})

/*
 * The filters become available automatically
 * once verified service records are connected.
 */
const dataAvailable = computed(() => {
  return services.value.length > 0
})

/*
 * General areas come directly from the
 * connected service dataset.
 */
const areas = computed(() => {
  return [
    ...new Set(
      services.value
        .map(
          (service) =>
            service.suburb,
        )
        .filter(Boolean),
    ),
  ].sort()
})

/*
 * Service types also come directly from
 * the connected service dataset.
 */
const serviceTypes =
  computed(() => {
    return [
      ...new Set(
        services.value
          .map(
            (service) =>
              service.type,
          )
          .filter(Boolean),
      ),
    ].sort()
  })

/*
 * Accessibility choices are created only
 * from verified access information included
 * in service records.
 */
const accessibilityOptions =
  computed(() => {
    return [
      ...new Set(
        services.value.flatMap(
          (service) =>
            service.accessibility,
        ),
      ),
    ].sort()
  })

/*
 * Apply all currently selected filters.
 */
const filteredServices =
  computed(() => {
    const search =
      filters.value.search
        .trim()
        .toLowerCase()

    return services.value.filter(
      (service) => {
        if (search) {
          const searchableText = [
            service.name,
            service.provider,
            service.type,
            service.purpose,
            service.suburb,
            service.address,
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

        if (
          filters.value.area &&
          service.suburb !==
            filters.value.area
        ) {
          return false
        }

        if (
          filters.value.type &&
          service.type !==
            filters.value.type
        ) {
          return false
        }

        if (
          filters.value.accessibility &&
          !service.accessibility.includes(
            filters.value
              .accessibility,
          )
        ) {
          return false
        }

        return true
      },
    )
  })

const updateFilters = (
  nextFilters,
) => {
  filters.value =
    nextFilters
}

const clearFilters = () => {
  filters.value = {
    search: '',
    area: '',
    type: '',
    accessibility: '',
  }
}
</script>

<template>
  <main class="services-page">
    <!-- ================= HERO ================= -->
    <section class="services-hero">
      <div class="page-container">
        <div class="services-hero-grid">
          <div>
            <p class="section-kicker">
              Essential services
            </p>

            <h1>
              Find practical support
              with clear information.
            </h1>

            <p>
              Discover healthcare,
              aged-care support and
              everyday services using
              simple, privacy-aware
              search options.
            </p>
          </div>

          <aside class="services-privacy-note">
            <span aria-hidden="true">
              ✓
            </span>

            <div>
              <strong>
                No health records needed
              </strong>

              <p>
                Search uses only broad,
                optional choices such as
                general area and service
                type.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- ================= MAIN ================= -->
    <section class="services-main">
      <div class="page-container">
        <!-- ================= CATEGORIES ================= -->
        <div class="service-category-intro">
          <article>
            <span aria-hidden="true">
              01
            </span>

            <h2>
              Healthcare
            </h2>

            <p>
              Find health facilities and
              clear service information.
            </p>
          </article>

          <article>
            <span aria-hidden="true">
              02
            </span>

            <h2>
              Aged-care support
            </h2>

            <p>
              Discover support options
              for independent living.
            </p>
          </article>

          <article>
            <span aria-hidden="true">
              03
            </span>

            <h2>
              Everyday services
            </h2>

            <p>
              Find practical facilities
              and essential local
              services.
            </p>
          </article>
        </div>

        <!-- ================= FILTERS ================= -->
        <ServiceFilters
          :filters="filters"
          :areas="areas"
          :service-types="
            serviceTypes
          "
          :accessibility-options="
            accessibilityOptions
          "
          :data-available="
            dataAvailable
          "
          @update:filters="
            updateFilters
          "
          @clear="
            clearFilters
          "
        />

        <!-- ================= DATA NOTE ================= -->
        <div class="services-data-note">
          <span aria-hidden="true">
            i
          </span>

          <p>
            Service results are displayed
            only when the required
            information is available from
            a verified source. Missing
            provider details are not
            guessed.
          </p>
        </div>

        <!-- ================= RESULTS HEADING ================= -->
        <div class="service-results-heading">
          <div>
            <p class="section-kicker">
              Results
            </p>

            <h2>
              {{
                filteredServices.length
              }}
              {{
                filteredServices.length ===
                1
                  ? 'service'
                  : 'services'
              }}
              found
            </h2>
          </div>
        </div>

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

          <h2>
            Loading services
          </h2>

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
          role="alert"
        >
          <div
            class="service-state-icon"
            aria-hidden="true"
          >
            !
          </div>

          <h2>
            Unable to load services
          </h2>

          <p>
            {{ errorMessage }}
          </p>
        </div>

        <!-- ================= NO DATASET YET ================= -->
        <div
          v-else-if="
            !dataAvailable
          "
          class="
            service-state-card
            service-data-pending
          "
        >
          <div
            class="service-state-icon"
            aria-hidden="true"
          >
            i
          </div>

          <p class="section-kicker">
            Data connection
          </p>

          <h2>
            Service directory data
            is being prepared.
          </h2>

          <p>
            The interface is ready for
            verified service information.
            Provider, eligibility,
            opening-hours and access
            details will be displayed
            when the service dataset is
            connected.
          </p>

          <div class="service-source-plan">
            <span>
              Healthcare & care facilities
            </span>

            <span>
              Essential facilities
            </span>

            <span>
              Transport access
            </span>
          </div>
        </div>

        <!-- ================= NO MATCHES ================= -->
        <div
          v-else-if="
            filteredServices.length ===
            0
          "
          class="service-state-card"
        >
          <div
            class="service-state-icon"
            aria-hidden="true"
          >
            ?
          </div>

          <h2>
            No matching services
          </h2>

          <p>
            Try changing one or more
            search options to see more
            results.
          </p>

          <button
            type="button"
            class="activity-empty-button"
            @click="
              clearFilters
            "
          >
            Clear filters
          </button>
        </div>

        <!-- ================= SERVICE RESULTS ================= -->
        <div
          v-else
          class="service-results-grid"
        >
          <ServiceCard
            v-for="
              service in
              filteredServices
            "
            :key="service.id"
            :service="service"
          />
        </div>
      </div>
    </section>
  </main>
</template>