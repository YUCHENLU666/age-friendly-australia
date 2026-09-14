import {
  findNearestStop,
  getTransitStops,
} from '@/services/transitStopsService'

// decide where the frontend should visit the backend
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// convert all service data from the backend into a consistent format for the frontend
function cleanText(value) {
  return String(value ?? '').trim()
}

//Normalise the accessibility field to always be an array of strings, even if the backend returns a single string or null
function normaliseAccessibility(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        cleanText(item),
      )
      .filter(Boolean)
  }

  if (!value) {
    return []
  }

  return String(value)
    .split(';')
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean)
}

// Normalise the coordinates from the backend to always be an object with latitude and longitude as numbers, or null if invalid
function normaliseCoordinates(row) {
  const latitude =
    Number(row.latitude)

  const longitude =
    Number(row.longitude)

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return null
  }

  return {
    latitude,
    longitude,
  }
}

// Normalise a service row from the backend into a consistent format for the frontend, including finding the nearest transit stop if coordinates are available
function normaliseService(
  row,
  index,
  transitStops,
) {
  const coordinates =
    normaliseCoordinates(row)

  const nearestStop =
    coordinates
      ? findNearestStop(
          coordinates,
          transitStops,
        )
      : null

  return {
    id: String(
      row.id ??
        row.service_id ??
        `service-${index + 1}`,
    ),

    name: cleanText(
      row.name ??
        row.service_name ??
        row.provider ??
        'Unnamed service',
    ),

    provider: cleanText(
      row.provider ??
        row.provider_name ??
        '',
    ),

    type: cleanText(
      row.type ??
        row.care_type ??
        row.service_type ??
        'Essential service',
    ),

    purpose: cleanText(
      row.purpose ??
        row.organisation_type ??
        row.description ??
        '',
    ),

    eligibility: cleanText(
      row.eligibility ??
        '',
    ),

    openingHours: cleanText(
      row.opening_hours ??
        row.openingHours ??
        '',
    ),

    address: cleanText(
      row.address ??
        row.location ??
        '',
    ),

    suburb: cleanText(
      row.suburb ??
        row.general_area ??
        '',
    ),

    postcode: cleanText(
      row.postcode ??
        '',
    ),

    coordinates,

    phone: cleanText(
      row.phone ??
        row.contact_phone ??
        '',
    ),

    website: cleanText(
      row.website ??
        row.contact_url ??
        '',
    ),

    accessibility:
      normaliseAccessibility(
        row.accessibility,
      ),

    source: cleanText(
      row.source ??
        row.source_note ??
        row.source_name ??
        '',
    ),

    sourceUrl: cleanText(
      row.source_url ??
        row.sourceUrl ??
        '',
    ),

    nearestTransportStop:
      nearestStop
        ? nearestStop.stopName
        : '',

    transportDistance:
      nearestStop
        ? nearestStop.distanceLabel
        : '',
  }
}

/**
 * Load services from the backend.
 *
 * GET /api/services
 */
async function fetchServices() {
  const response =
    await fetch(
      `${API_BASE_URL}/services`,
    )

  if (!response.ok) {
    throw new Error(
      `Unable to load services (${response.status}).`,
    )
  }

  const data =
    await response.json()

  if (!Array.isArray(data)) {
    throw new Error(
      'The service API returned an unexpected format.',
    )
  }

  return data
}

// ======================================================
// Services cache
// ======================================================
//
// The services list does not change while the user is
// navigating through the current frontend session.
//
// Caching prevents repeated requests when the user:
// Services -> Home -> Services
//
let cachedServices = null
let servicesLoadingPromise = null

/**
 * Load services from the backend.
 *
 * IMPORTANT PERFORMANCE CHANGE:
 *
 * The services LIST page no longer downloads all transit
 * stops or calculates the nearest stop for every service.
 *
 * Previously:
 *
 * services
 *   +
 * ~4,994 transit stops
 *   +
 * nearest-stop calculation for every service
 *
 * Now:
 *
 * services only
 *
 * Transit information is calculated only when the user
 * opens one individual service detail page.
 */
export async function getServices() {
  // Return the existing in-memory result immediately.
  if (cachedServices) {
    return cachedServices
  }

  // If another component has already started loading
  // services, reuse the same request instead of making
  // another backend request.
  if (servicesLoadingPromise) {
    return servicesLoadingPromise
  }

  servicesLoadingPromise =
    fetchServices()
      .then((serviceRows) => {
        cachedServices =
          serviceRows.map(
            (row, index) =>
              normaliseService(
                row,
                index,

                // Empty list intentionally prevents
                // nearest-stop calculation on the
                // services listing page.
                [],
              ),
          )

        return cachedServices
      })
      .finally(() => {
        servicesLoadingPromise = null
      })

  return servicesLoadingPromise
}

/**
 * Load one service by ID.
 *
 * Transit-stop information is loaded lazily here because
 * it is useful on the detail page, but unnecessary when
 * rendering the complete service catalogue.
 */
export async function getServiceById(
  id,
) {
  const services =
    await getServices()

  const service =
    services.find(
      (item) =>
        item.id ===
        String(id),
    ) ?? null

  if (!service) {
    return null
  }

  // If coordinates are unavailable, we cannot calculate
  // nearby transport, so return the service immediately.
  if (!service.coordinates) {
    return service
  }

  try {
    const transitStops =
      await getTransitStops()

    const nearestStop =
      findNearestStop(
        service.coordinates,
        transitStops,
      )

    if (!nearestStop) {
      return service
    }

    return {
      ...service,

      nearestTransportStop:
        nearestStop.stopName,

      transportDistance:
        nearestStop.distanceLabel,
    }
  } catch (error) {
    // Transit information is supplementary.
    // A transit failure should never prevent the service
    // itself from being displayed.
    console.error(
      'Unable to load nearby transport for service:',
      error,
    )

    return service
  }
}

/**
 * Clear the in-memory service cache.
 *
 * This can be used later if live service refreshing is
 * introduced.
 */
export function clearServicesCache() {
  cachedServices = null
  servicesLoadingPromise = null
}