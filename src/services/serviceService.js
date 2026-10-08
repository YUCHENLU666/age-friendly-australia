// src/services/serviceService.js
// Load and clean services; keep the list and add stop details for one service.
//
// How calls move:
// getServices -> fetchServices -> GET /api/services -> normaliseService; getServiceById -> getTransitStops -> findNearestStop.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   cleanText - Turn a value into text and remove spaces at both ends.
//   normaliseAccessibility - Turn access data into a list of non-empty labels.
//   normaliseCoordinates - Turn latitude and longitude into numbers; return null if a value is not a number.
//   normaliseService - Build the service object used by the page; add nearest-stop details when possible.
//   fetchServices - Request the service list from the backend and check the reply.
//   getServices - Return the kept service list, or request and clean it once.
//   getServiceById - Find one service by ID and try to add its nearest stop.
//   clearServicesCache - Forget the kept service list and request so it can be loaded again.
//
// Fixed values and data:
//   API_BASE_URL - Backend API address used by this file; remove the final slash if there is one.
//
// Page values and kept data:
//   cachedServices - Service list kept in memory so later calls do not load it again.
//   servicesLoadingPromise - Request already running; other calls wait for the same result.
//
// Notes:
//   Number checks reject NaN; empty and out-of-range map values are not fully checked.
//   Missing fields stay empty; this code does not make up service details.

import {
  findNearestStop,
  getTransitStops,
} from '@/services/transitStopsService'

// Backend API address used by this file; remove the final slash if there is one.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// Turn a value into text and remove spaces at both ends.
// Example input: '  Care Home  '
// Example result: 'Care Home'; null gives ''.
function cleanText(value) {
  return String(value ?? '').trim()
}

// Turn access data into a list of non-empty labels.
// Example input: 'Ramp; Lift; '
// Example result: ['Ramp', 'Lift'].
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

// Turn latitude and longitude into numbers; return null if a value is not a number.
// Example input: {latitude: '-37.9', longitude: '145.1'}
// Example result: {latitude: -37.9, longitude: 145.1}; latitude='abc' gives null.
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

// Build the service object used by the page; add nearest-stop details when possible.
// Example input: row={id:7, name:' Care Home ', suburb:'Clayton'}, index=0, transitStops=[]
// Example result: object includes id:'7', name:'Care Home', suburb:'Clayton', accessibility:[], and empty
// transport text.
function normaliseService(
  row,
  index,
  transitStops,
) {
  const coordinates =
    normaliseCoordinates(row)

  // Find a stop only when a point and stop list are usable.
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

// Request the service list from the backend and check the reply.
// Example input: call with no arguments; API returns [{id:7, name:'Care Home'}]
// Example result: a Promise that gives that list; HTTP 500 throws an error.
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

// Service list kept in memory so later calls do not load it again.
let cachedServices = null
// Request already running; other calls wait for the same result.
let servicesLoadingPromise = null

// Return the kept service list, or request and clean it once.
// Example input: call with no arguments; API row has id:7
// Example result: Promise gives service list with id:'7'; a later call reuses that list.
export async function getServices() {
  // Reuse the service list already loaded.
  if (cachedServices) {
    return cachedServices
  }

  // Wait for the service request already running.
  if (servicesLoadingPromise) {
    return servicesLoadingPromise
  }

  servicesLoadingPromise =
    fetchServices()
      .then((serviceRows) => {
        // Clean the rows once and keep the result.
        cachedServices =
          serviceRows.map(
            (row, index) =>
              normaliseService(
                row,
                index,

                [],
              ),
          )

        return cachedServices
      })
      .finally(() => {
        // Forget the finished request; keep the service list.
        servicesLoadingPromise = null
      })

  return servicesLoadingPromise
}

// Find one service by ID and try to add its nearest stop.
// Example input: id='7', service list contains '7'
// Example result: Promise gives that service with stop details if available; unknown ID gives null.
export async function getServiceById(
  id,
) {
  const services =
    await getServices()

  // Find the ID in the loaded service list.
  const service =
    services.find(
      (item) =>
        item.id ===
        String(id),
    ) ?? null

  if (!service) {
    return null
  }

  // No map point: return the service without stop details.
  if (!service.coordinates) {
    return service
  }

  try {
    // Load stops only for this detail request.
    const transitStops =
      await getTransitStops()

    // Find a stop only when a point and stop list are usable.
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
    console.error(
      'Unable to load nearby transport for service:',
      error,
    )

    return service
  }
}

// Forget the kept service list and request so it can be loaded again.
// Example input: call after services were loaded
// Example result: cachedServices=null, servicesLoadingPromise=null; returns no value.
export function clearServicesCache() {
  // Clean the rows once and keep the result.
  cachedServices = null
  // Forget the finished request; keep the service list.
  servicesLoadingPromise = null
}