import csvText from '../../data/sample/gtfs_stops_southeast_melbourne.csv?raw'
import { parseCsv } from '@/utils/csvParser'
import { calculateDistanceKm, formatDistance } from '@/services/distanceService'

let cachedStops = null

function getStops() {
  if (cachedStops) {
    return cachedStops
  }

  const rows = parseCsv(csvText)

  cachedStops = rows
    .map((row) => {
      const lat = Number(row.latitude)
      const lon = Number(row.longitude)

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return null
      }

      return {
        stopId: row.stop_id,
        stopName: row.stop_name,
        latitude: lat,
        longitude: lon,
      }
    })
    .filter(Boolean)

  return cachedStops
}

export function findNearestStop(coordinates) {
  if (!coordinates) {
    return null
  }

  const stops = getStops()

  let nearest = null
  let nearestDistance = Infinity

  for (const stop of stops) {
    const distanceKm = calculateDistanceKm(coordinates, {
      latitude: stop.latitude,
      longitude: stop.longitude,
    })

    if (distanceKm < nearestDistance) {
      nearest = stop
      nearestDistance = distanceKm
    }
  }

  if (!nearest) {
    return null
  }

  return {
    stopName: nearest.stopName,
    distanceKm: nearestDistance,
    distanceLabel: formatDistance(nearestDistance),
  }
}