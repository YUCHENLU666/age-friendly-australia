import {
  findNearestStop,
  getTransitStops,
} from '@/services/transitStopsService'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

function cleanText(value) {
  return String(value ?? '').trim()
}

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

/**
 * Load services and transit stops from the backend
 * at the same time.
 */
export async function getServices() {
  const [
    serviceRows,
    transitStops,
  ] = await Promise.all([
    fetchServices(),
    getTransitStops(),
  ])

  return serviceRows.map(
    (row, index) =>
      normaliseService(
        row,
        index,
        transitStops,
      ),
  )
}

export async function getServiceById(
  id,
) {
  const services =
    await getServices()

  return (
    services.find(
      (service) =>
        service.id ===
        String(id),
    ) ?? null
  )
}