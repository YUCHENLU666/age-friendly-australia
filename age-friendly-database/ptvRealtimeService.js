require('dotenv').config()
const GtfsRealtimeBindings = require('gtfs-realtime-bindings')

const PTV_API_URL = 'https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/bus/vehicle-positions'

/**
 * Fetch live bus vehicle positions from PTV GTFS-Realtime.
 * @param {string} [routeId] - optional, filter to a specific route (e.g. '901')
 * @param {number} [limit=50]
 */
async function getBusPositions(routeId = null, limit = 50) {
  const response = await fetch(PTV_API_URL, {
    headers: { KeyId: process.env.PTV_API_KEY },
  })

  if (!response.ok) {
    throw new Error(`PTV GTFS-R request failed: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer))

  let vehicles = feed.entity
    .filter((entity) => entity.vehicle && entity.vehicle.position)
    .map((entity) => ({
      vehicleId: entity.vehicle.vehicle?.id ?? null,
      routeId: entity.vehicle.trip?.routeId ?? null,
      latitude: entity.vehicle.position.latitude,
      longitude: entity.vehicle.position.longitude,
      bearing: entity.vehicle.position.bearing ?? null,
      timestamp: entity.vehicle.timestamp ? String(entity.vehicle.timestamp) : null,
    }))

  if (routeId) {
    vehicles = vehicles.filter((v) => v.routeId === routeId)
  }

  return vehicles.slice(0, limit)
}

module.exports = { getBusPositions }