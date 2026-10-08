// src/services/distanceService.js
// Find straight-line distances and turn them into page text.
//
// How calls move:
// calculateDistanceKm -> toRadians -> Haversine distance; formatDistance -> readable kilometre label.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   toRadians - Change an angle in degrees into radians for the distance formula.
//   calculateDistanceKm - Find the straight-line map distance between two points, in kilometres.
//   formatDistance - Turn a distance into page text with one number after the dot.
//
// Fixed values and data:
//   EARTH_RADIUS_KM - Earth radius used by the distance formula: about 6371 kilometres.
//
// Notes:
//   This is a straight line on the map, not a walking route or travel time.

// Earth radius used by the distance formula: about 6371 kilometres.
const EARTH_RADIUS_KM = 6371

// Change an angle in degrees into radians for the distance formula.
// Example input: 180
// Example result: Math.PI, about 3.14159.
function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

// Find the straight-line map distance between two points, in kilometres.
// Example input: pointA={latitude:0, longitude:0}, pointB={latitude:0, longitude:1}
// Example result: about 111.19; a missing point gives null.
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

// Turn a distance into page text with one number after the dot.
// Example input: 1.234
// Example result: '1.2 km away'; null gives 'Distance not available'.
export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return 'Distance not available'
  }

  return `${distanceKm.toFixed(1)} km away`
}