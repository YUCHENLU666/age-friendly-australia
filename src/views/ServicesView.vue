<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'
// computed: The result is automatically calculated based on other states
// onMounted: Execute code after page component loads
// ref: save reactive state

import ServiceCard from '@/components/services/ServiceCard.vue'
import ServiceFilters from '@/components/services/ServiceFilters.vue'

import {
  getServices,
} from '@/services/serviceService'

import {
  getSavedServiceIds,
  toggleSavedServiceId,
} from '@/services/savedItemsService'

import { getSuburbCoordinates } from '@/services/suburbCoordinates'
import { calculateDistanceKm, formatDistance } from '@/services/distanceService'

//why use ref for activities, savedActivityIds, loading, errorMessage, filters
//because vue must be aware of data changes and automatically re-render the page

const services = ref([])
//([
// service1, 
// service2, 
// service3
//])

const savedServiceIds =
  ref([])
//([
// '1',
// '2',
// '3'
// ])

const loading =
  ref(true)
  //after API finished, return true: services are loading

const errorMessage =
  ref('')
  //if API failed, return error message

const filters = ref({
  search: '',
  area: '',
  type: '',
  accessibility: '',
})
//defaultFilters: return an object with default filter values

//onMounted: Execute code after page component loads
//homepage -> click find services -> route to ServicesView -> ServicesView mounted -> onMounted()
onMounted(async () => {
  //get the service IDs which are saved by the user
  savedServiceIds.value =
    getSavedServiceIds()

    //wait getServices() to finish, then assign the result to services.value
  //ServicesView -> getServices() -> serviceService.js -> get /api/services -> Express -> SQLite -> JSON response -> ServiceService normalise -> return services -> services.value
  //if getServices() failed, catch the error and show error message
  try {
    services.value =
      await getServices()
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'We could not load the service directory.'
  } finally {
    // Set loading to false once the API call is complete whether it was successful or not
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
//Get a list of unique service types from all services
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
//Get a list of unique accessibility options from all services
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
// Filter services based on the selected filters
const filteredServices =
  computed(() => {
    const search =
      filters.value.search
        .trim()
        .toLowerCase()

    const results = services.value.filter(
      (service) => {
        if (search) {
          //// normalize the services and filter them based on the selected filters
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
        
        // Check each filter and return false if the service does not match the filter
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

    // If a general area is selected, calculate the distance for each service and sort by distance
    const referenceCoordinates =
      filters.value.area
        ? getSuburbCoordinates(filters.value.area)
        : null

    if (!referenceCoordinates) {
      return results
    }

    // Map each service to include suburb center distance from the reference coordinates, then sort by distance
    return results
      .map((service) => {
        const distanceKm = service.coordinates
          ? calculateDistanceKm(
              referenceCoordinates,
              service.coordinates,
            )
          : null

        return {
          ...service,
          distanceKm,
          distanceLabel:
            distanceKm !== null
              ? formatDistance(distanceKm)
              : null,
        }
      })
      // Sort the services by distance, placing those without a distance at the end
      .sort((serviceA, serviceB) => {
        const distanceA =
          serviceA.distanceKm ?? Infinity
        const distanceB =
          serviceB.distanceKm ?? Infinity

        return distanceA - distanceB
      })
  })

  // Update the filters based on user input
  // user chooses a filter option -> ServiceFilters emit new filters -> ServicesView get -> updateFilters(nextFilters) -> filters.value = nextFilters -> filteredServices recomputed
const updateFilters = (
  nextFilters,
) => {
  filters.value =
    nextFilters
}

// Reset the filters to their default values
//filters changed -> computed automatically reruns -> all services are shown
const clearFilters = () => {
  filters.value = {
    search: '',
    area: '',
    type: '',
    accessibility: '',
  }
}

// Check if a service is saved by the user (check by the Service ID)
const isServiceSaved = (
  id,
) => {
  return savedServiceIds.value.includes(
    String(id),
  )
}

//ServiceCard -> emit toggle-save -> ServicesView.toggleSave(id) -> savedItemsService -> update localStorage -> return latest IDs -> savedServiceIds.value updated -> update UI
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