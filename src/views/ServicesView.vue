<!--
src/views/ServicesView.vue
Show services, filters, and Save buttons.

How calls move:
ServiceFilters.updateField -> updateFilters -> filteredServices -> ServiceCard;
toggleServiceSave -> savedItemsService.

Reading tips:
  Examples show one possible case, not fixed API or model results.
  Promise: a result to wait for; await gets the result when the work finishes.
  computed: Vue updates this value when the data it uses changes.
  ref: a page value; changing it lets Vue update the screen.

Functions:
  updateFilters - Copy the new filter choices into the page filters.
  clearFilters - Reset all filter choices.
  isServiceSaved - Check if this service ID is in the saved ID list.
  toggleServiceSave - Save or unsave a service and update the page saved ID list.

Values Vue updates for you:
  dataAvailable - Check if the service list has any items.
  areas - Get area names from services, remove repeats, and sort them.
  serviceTypes - Get service types, remove repeats, and sort them.
  accessibilityOptions - Get access labels from services and remove repeats.
  filteredServices - Keep services that match the filters;
                     sort by distance when an area point is known.

Page values and kept data:
  services - Service objects loaded for this page.
  savedServiceIds - Saved service IDs read from this browser storage.
  loading - True while the page is loading; false when loading ends.
  errorMessage - Error text shown on the page when data loading fails.
  filters - Current area, type, and accessibility choices.

Page start and API handlers:
  onMounted callback - Read saved IDs and load the service list
                       after the page opens.

Notes:
  Filters run in the browser on the loaded list;
  they do not send a new database query.
  Distance starts from a fixed area point,
  not the user GPS location.
  dataAvailable checks if there are rows;
  it does not check if every field is filled.
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

import {
  getSuburbCoordinates,
} from '@/services/suburbCoordinates'

import {
  calculateDistanceKm,
  formatDistance,
} from '@/services/distanceService'


// ======================================================
// Page state
// ======================================================

// Service objects loaded for this page.
const services = ref([])

// Saved service IDs read from browser storage.
const savedServiceIds =
  ref([])

// True while the page is loading.
const loading =
  ref(true)

// Error text shown when loading fails.
const errorMessage =
  ref('')


// ======================================================
// Filter state
// ======================================================

// Current area, service type,
// and accessibility choices.
const filters = ref({
  area: '',
  type: '',
  accessibility: '',
})


// ======================================================
// Load service data
// ======================================================
//
// Read saved IDs and load the service list
// after the page opens.
//
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


// ======================================================
// Data availability
// ======================================================

// Check if the service list has any items.
const dataAvailable =
  computed(() => {
    return (
      services.value.length > 0
    )
  })


// ======================================================
// Dynamic filter options
// ======================================================

// Get area names from services,
// remove repeats, and sort them.
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


// Get service types,
// remove repeats, and sort them.
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


// Get access labels from services
// and remove repeats.
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


// ======================================================
// Service filtering
// ======================================================
//
// Keep services that match the selected filters.
//
// If an area is selected and its reference coordinates
// are known, calculate service distance and sort
// from nearest to furthest.
//
const filteredServices =
  computed(() => {
    const results =
      services.value.filter(
        (service) => {
          // ------------------------------------------
          // Area filter
          // ------------------------------------------
          if (
            filters.value.area &&
            service.suburb !==
              filters.value.area
          ) {
            return false
          }

          // ------------------------------------------
          // Service type filter
          // ------------------------------------------
          if (
            filters.value.type &&
            service.type !==
              filters.value.type
          ) {
            return false
          }

          // ------------------------------------------
          // Accessibility filter
          // ------------------------------------------
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

    // Find the fixed map point
    // for the selected area.
    const referenceCoordinates =
      filters.value.area
        ? getSuburbCoordinates(
            filters.value.area,
          )
        : null

    // If there is no known area point,
    // return the filtered list without
    // distance sorting.
    if (!referenceCoordinates) {
      return results
    }

    return results
      .map((service) => {
        // Find the straight-line distance
        // from the selected area point
        // to this service.
        const distanceKm =
          service.coordinates
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
              ? formatDistance(
                  distanceKm,
                )
              : null,
        }
      })
      .sort(
        (
          serviceA,
          serviceB,
        ) => {
          // Missing distance is treated
          // as Infinity so services with
          // known distances appear first.
          const distanceA =
            serviceA.distanceKm ??
            Infinity

          const distanceB =
            serviceB.distanceKm ??
            Infinity

          return (
            distanceA -
            distanceB
          )
        },
      )
  })


// ======================================================
// Filter actions
// ======================================================

// Copy the new filter choices
// into the page filters.
const updateFilters = (
  nextFilters,
) => {
  filters.value =
    nextFilters
}


// Reset every service filter.
const clearFilters = () => {
  filters.value = {
    area: '',
    type: '',
    accessibility: '',
  }
}


// ======================================================
// Saved service actions
// ======================================================

// Check if this service ID
// is in the saved ID list.
const isServiceSaved = (
  id,
) => {
  return savedServiceIds.value.includes(
    String(id),
  )
}


// Save or unsave a service
// and update the page saved ID list.
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
              filter options.
            </p>
          </div>

          <aside
            class="services-privacy-note"
          >
            <span aria-hidden="true">
              ✓
            </span>

            <div>
              <strong>
                No health records needed
              </strong>

              <p>
                Filters use only broad,
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
        <div
          class="service-results-heading"
        >
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

          <div
            class="service-source-plan"
          >
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
            filter options to see more
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