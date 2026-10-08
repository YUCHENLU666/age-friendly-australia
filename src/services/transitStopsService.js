// src/services/transitStopsService.js
// Load static stops and find the nearest stop.
//
// How calls move:
// getServiceById/getActivityById -> getTransitStops -> GET /api/transit-stops -> findNearestStop -> distanceService.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   getTransitStops - Request and clean the stop list, then keep it for later calls.
//   findNearestStop - Check all given stops and return the closest one with its distance.
//   clearTransitStopsCache - Forget the kept stop list; do not cancel a request already running.
//
// Fixed values and data:
//   API_BASE_URL - Backend API address used by this file; remove the final slash if there is one.
//
// Page values and kept data:
//   cachedStops - Stop list kept in memory for later calls.
//   loadingPromise - Stop request already running; other calls wait for the same result.
//
// Notes:
//   These are static stop details, not live arrival times.
//   Clearing the kept list does not cancel an active request.

import {
  calculateDistanceKm,
  formatDistance,
} from '@/services/distanceService'

// Backend API address used by this file; remove the final slash if there is one.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// Stop list kept in memory for later calls.
let cachedStops = null
// Stop request already running; other calls wait for the same result.
let loadingPromise = null

// Request and clean the stop list, then keep it for later calls.
// Example input: API row={stop_id:'S1', stop_name:'Main Stop', latitude:'-37.9', longitude:'145.1'}
// Example result: Promise gives [{stopId:'S1', stopName:'Main Stop', latitude:-37.9, longitude:145.1}].
export async function getTransitStops() {
  if (cachedStops) {
    return cachedStops
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = fetch(
    `${API_BASE_URL}/transit-stops`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Unable to load transit stops (${response.status}).`,
        )
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        throw new Error(
          'The transit stops API returned an unexpected format.',
        )
      }

      cachedStops = data
        .map((row) => {
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
            stopId:
              row.stop_id ??
              row.stopId ??
              '',

            stopName:
              row.stop_name ??
              row.stopName ??
              'Unknown stop',

            latitude,
            longitude,
          }
        })
        .filter(Boolean)

      return cachedStops
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}

// Check all given stops and return the closest one with its distance.
// Example input: point={latitude:0, longitude:0}, stops=[{stopId:'S1', stopName:'Here', latitude:0,
// longitude:0}]
// Example result: {stopId:'S1', stopName:'Here', distanceKm:0, distanceLabel:'0.0 km away'}.
export function findNearestStop(
  coordinates,
  stops,
) {
  if (
    !coordinates ||
    !Array.isArray(stops) ||
    stops.length === 0
  ) {
    return null
  }

  // Keep track of the closest stop found so far.
  let nearest = null
  let nearestDistance = Infinity

  // Check this venue against each stop.
  for (const stop of stops) {
    const distanceKm =
      calculateDistanceKm(
        coordinates,
        {
          latitude: stop.latitude,
          longitude: stop.longitude,
        },
      )

    if (
      distanceKm <
      nearestDistance
    ) {
      nearest = stop
      nearestDistance =
        distanceKm
    }
  }

  if (!nearest) {
    return null
  }

  return {
    stopId: nearest.stopId,
    stopName: nearest.stopName,
    distanceKm:
      nearestDistance,
    distanceLabel:
      formatDistance(
        nearestDistance,
      ),
  }
}

// Forget the kept stop list; do not cancel a request already running.
// Example input: call after loading stops
// Example result: cachedStops=null; returns no value.
export function clearTransitStopsCache() {
  cachedStops = null
}