import {
  calculateDistanceKm,
  formatDistance,
} from '@/services/distanceService'

// decide where the frontend should visit the backend
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// Cache transit stops after the first backend request.
// This prevents repeatedly downloading ~4,994 stops.
let cachedStops = null
let loadingPromise = null

/**
 * Load transit stops from the backend API.
 *
 * Backend:
 * GET /api/transit-stops
 */
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

/**
 * Find the nearest stop using an already-loaded
 * list of transit stops.
 */
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

  let nearest = null
  let nearestDistance = Infinity

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

/**
 * Clear cache if data needs to be refreshed.
 */
export function clearTransitStopsCache() {
  cachedStops = null
}