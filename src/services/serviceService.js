import csvText from '../../data/sample/EP2_aged_care_services_sample.csv?raw'
import { parseCsv } from '@/utils/csvParser'
import { findNearestStop } from '@/services/transitStopsService'

const USE_REMOTE_API =
  import.meta.env.VITE_USE_REMOTE_API === 'true'

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
  const lat = Number(row.latitude)
  const lon = Number(row.longitude)

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null
  }

  return { latitude: lat, longitude: lon }
}

function normaliseService(
  row,
  index,
) {
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
      row.eligibility || '',
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
      row.postcode || '',
    ),

    coordinates:
      normaliseCoordinates(row),

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

    ...(() => {
      const coordinates = normaliseCoordinates(row)
      const nearestStop = coordinates
        ? findNearestStop(coordinates)
        : null

      return {
        nearestTransportStop: nearestStop
          ? nearestStop.stopName
          : '',
        transportDistance: nearestStop
          ? nearestStop.distanceLabel
          : '',
      }
    })(),
  }
}

async function getLocalServices() {
  const rows = parseCsv(csvText)

  return rows.map(
    normaliseService,
  )
}

async function getRemoteServices() {
  const response = await fetch(
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

  return data.map(
    normaliseService,
  )
}

export async function getServices() {
  if (USE_REMOTE_API) {
    return getRemoteServices()
  }

  return getLocalServices()
}

export async function getServiceById(
  id,
) {
  const services =
    await getServices()

  return (
    services.find(
      (service) =>
        service.id === String(id),
    ) ?? null
  )
}