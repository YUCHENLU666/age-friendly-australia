<!--
src/views/ServicesView.vue
Show services, filters, and Save buttons.

How calls move:
ServiceFilters.updateField -> updateFilters -> filteredServices -> ServiceCard; toggleServiceSave -> savedItemsService.

Reading tips:
  Examples show one possible case, not fixed API or model results.
  Promise: a result to wait for; await gets the result when the work finishes.
  computed: Vue updates this value when the data it uses changes.
  ref: a page value; changing it lets Vue update the screen.

Functions:
  updateFilters - Copy the new filter choices into the page filters.
  clearFilters - Set all filter choices to empty text.
  isServiceSaved - Check if this service ID is in the saved ID list.
  toggleServiceSave - Save or unsave a service and update the page saved ID list.

Values Vue updates for you:
  dataAvailable - Check if the service list has any items.
  areas - Get area names from services, remove repeats, and sort them.
  serviceTypes - Get service types, remove repeats, and sort them.
  accessibilityOptions - Get access labels from services and remove repeats.
  filteredServices - Keep services that match the filters; sort by distance when an area point is known.

Page values and kept data:
  services - Service objects loaded for this page.
  savedServiceIds - Saved service IDs read from this browser storage.
  loading - True while the page is loading; false when loading ends.
  errorMessage - Error text shown on the page when data loading fails.
  filters - Current search, area, type, and access choices.

Page start and API handlers:
  onMounted callback - Read saved IDs and load the service list after the page opens.

Notes:
  Filters run in the browser on the loaded list; they do not send a new database query.
  Distance starts from a fixed area point, not the user GPS location.
  dataAvailable checks if there are rows; it does not check if every field is filled.
-->
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

import { getSuburbCoordinates } from '@/services/suburbCoordinates'
import { calculateDistanceKm, formatDistance } from '@/services/distanceService'


// Service objects loaded for this page.
const services = ref([])

// Saved service IDs read from this browser storage.
const savedServiceIds =
  ref([])

// True while the page is loading; false when loading ends.
const loading =
  ref(true)

// Error text shown on the page when data loading fails.
const errorMessage =
  ref('')

// Current search, area, type, and access choices.
const filters = ref({
  search: '',
  area: '',
  type: '',
  accessibility: '',
})

// Read saved IDs and load the service list after the page opens.
// Example input: Open Services; saved IDs include 7 and the API gives two services.
// Example result: services has two page objects, savedServiceIds includes 7, loading=false.
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

// Check if the service list has any items.
// Example input: services=[]
// Example result: false; services=[one service] gives true.
const dataAvailable =
  computed(() => {
    return (
      services.value.length > 0
    )
  })

// Get area names from services, remove repeats, and sort them.
// Example input: suburbs ['Clayton', 'Box Hill', 'Clayton']
// Example result: ['Box Hill', 'Clayton'].
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

// Get service types, remove repeats, and sort them.
// Example input: types ['Home Care', 'Residential', 'Home Care']
// Example result: ['Home Care', 'Residential'].
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

// Get access labels from services and remove repeats.
// Example input: access lists [['Ramp'], ['Ramp', 'Lift']]
// Example result: ['Lift', 'Ramp'] after sorting.
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

// Keep services that match the filters; sort by distance when an area point is known.
// Example input: filters.area='Clayton', services in Clayton and Box Hill
// Example result: only Clayton services remain; measured distances are sorted from near to far.
const filteredServices =
  computed(() => {
    const search =
      filters.value.search
        .trim()
        .toLowerCase()

    const results = services.value.filter(
      (service) => {
        if (search) {
          // Join service fields into one lowercase search text.
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

    // Find the fixed map point for the selected area.
    const referenceCoordinates =
      filters.value.area
        ? getSuburbCoordinates(filters.value.area)
        : null

    // No known area point: return the list without distance sorting.
    if (!referenceCoordinates) {
      return results
    }

    return results
      .map((service) => {
        // Find the straight-line distance from the area point to this service.
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
      .sort((serviceA, serviceB) => {
        // Treat missing distance as Infinity so it sorts after known distances.
        const distanceA =
          serviceA.distanceKm ?? Infinity
        const distanceB =
          serviceB.distanceKm ?? Infinity

        return distanceA - distanceB
      })
  })

// Copy the new filter choices into the page filters.
// Example input: new filters with search='care' and area='Clayton'
// Example result: the page filters now use those values; returns no value.
const updateFilters = (
  nextFilters,
) => {
  filters.value =
    nextFilters
}

// Set all filter choices to empty text.
// Example input: click Clear with search='care', area='Clayton'
// Example result: all filters become ''; saved services stay saved. Returns no value.
const clearFilters = () => {
  filters.value = {
    search: '',
    area: '',
    type: '',
    accessibility: '',
  }
}

// Check if this service ID is in the saved ID list.
// Example input: id=7, savedServiceIds=['7']
// Example result: true.
const isServiceSaved = (
  id,
) => {
  return savedServiceIds.value.includes(
    String(id),
  )
}

// Save or unsave a service and update the page saved ID list.
// Example input: id=7, savedServiceIds=[]
// Example result: savedServiceIds becomes ['7']; click again and it becomes []. Returns no value.
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