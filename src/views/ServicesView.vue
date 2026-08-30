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

import {
  getSavedServiceIds,
  toggleSavedServiceId,
} from '@/services/savedItemsService'

import { calculateDistanceKm } from '@/services/distanceService'
import { getSuburbCoordinates } from '@/services/suburbCoordinates'

const services = ref([])

const savedServiceIds =
  ref([])

const loading =
  ref(true)

const errorMessage =
  ref('')

const filters = ref({
  search: '',
  area: '',
  type: '',
  accessibility: '',
})

onMounted(async () => {
  savedServiceIds.value =
    getSavedServiceIds()

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
 * Filters automatically become available
 * once verified service records are connected.
 */
const dataAvailable =
  computed(() => {
    return (
      services.value.length > 0
    )
  })

/*
 * General area options come directly
 * from the connected dataset.
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
 * Service types come directly
 * from verified service records.
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
 * Accessibility options are built
 * only from supplied source data.
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
 * Apply all search and filter choices.
 */
const filteredServices =
  computed(() => {
    const search =
      filters.value.search
        .trim()
        .toLowerCase()

    const results = services.value.filter(
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
          filters.value
            .accessibility &&
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

    const referenceCoordinates =
      filters.value.area
        ? getSuburbCoordinates(filters.value.area)
        : null

    if (!referenceCoordinates) {
      return results
    }

    return [...results].sort((serviceA, serviceB) => {
      const distanceA = serviceA.coordinates
        ? calculateDistanceKm(referenceCoordinates, serviceA.coordinates)
        : Infinity

      const distanceB = serviceB.coordinates
        ? calculateDistanceKm(referenceCoordinates, serviceB.coordinates)
        : Infinity

      return distanceA - distanceB
    })
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

const isServiceSaved = (
  id,
) => {
  return savedServiceIds.value.includes(
    String(id),
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

        <!-- ================= DATA NOT CONNECTED ================= -->
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
            :saved="
              isServiceSaved(
                service.id,
              )
            "
            @toggle-save="
              toggleServiceSave
            "
          />
        </div>
      </div>
    </section>
  </main>
</template>