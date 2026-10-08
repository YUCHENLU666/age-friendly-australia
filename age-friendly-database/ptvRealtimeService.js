// age-friendly-database/ptvRealtimeService.js
// Read the live PTV bus feed and turn it into bus objects.
//
// How calls move:
// server realtime/bus-positions callback -> getBusPositions -> fetch -> FeedMessage.decode -> filter -> slice.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   getBusPositions - Read the PTV bus feed, turn binary data into objects, filter by route, and limit the
//   list.
//
// Fixed values and data:
//   PTV_API_URL - PTV API address for live bus positions.
//
// Notes:
//   The backend sends PTV_API_KEY in the KeyId header; the browser does not get the key.
//   routeId must exactly match trip.routeId in the feed; a displayed bus number may be different.
//   Positions show where buses are, not when they will arrive.

require('dotenv').config()
const GtfsRealtimeBindings = require('gtfs-realtime-bindings')

// PTV API address for live bus positions.
const PTV_API_URL = 'https://api.opendata.transport.vic.gov.au/opendata/public-transport/gtfs/realtime/v1/bus/vehicle-positions'

// Read the PTV bus feed, turn binary data into objects, filter by route, and limit the list.
// Example input: routeId='R1', limit=2; feed has three buses on R1 and one on R2
// Example result: Promise gives the first two R1 bus objects; no matching bus gives [].
async function getBusPositions(routeId = null, limit = 50) {
  const response = await fetch(PTV_API_URL, {
    headers: { KeyId: process.env.PTV_API_KEY },
  })

  if (!response.ok) {
    throw new Error(`PTV GTFS-R request failed: ${response.status}`)
  }

  // Read binary bytes from the PTV reply.
  const buffer = await response.arrayBuffer()
  // Decode protobuf: turn the binary bytes into bus data objects.
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer))

  // Keep buses with positions; copy only fields the page uses.
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

  // Keep only this exact feed route ID when one is given.
  if (routeId) {
    vehicles = vehicles.filter((v) => v.routeId === routeId)
  }

  // Take up to the requested count after filtering.
  return vehicles.slice(0, limit)
}

module.exports = { getBusPositions }