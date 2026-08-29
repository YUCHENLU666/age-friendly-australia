const EARTH_RADIUS_KM = 6371

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

// Returns distance in kilometres between two lat/long points.
export function calculateDistanceKm(pointA, pointB) {
  if (!pointA || !pointB) {
    return null
  }

  const dLat = toRadians(pointB.latitude - pointA.latitude)
  const dLon = toRadians(pointB.longitude - pointA.longitude)

  const lat1 = toRadians(pointA.latitude)
  const lat2 = toRadians(pointB.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return 'Distance not available'
  }

  return `${distanceKm.toFixed(1)} km away`
}