// venue name → { latitude, longitude }
// Coordinates verified via Google Places, Aug 2026.
// "Mulgrave Neighbourhood Library" is the same physical venue as "Mulgrave Library".
// VENUE_COORDINATES is from EP1_sample_data/venues.csv, unique by venue name, with coordinates added manually
export const VENUE_COORDINATES = {
  'Oakleigh Senior Citizens Centre': { latitude: -37.897269, longitude: 145.090282 },
  'Wheelers Hill Library': { latitude: -37.907744, longitude: 145.190674 },
  'Mulgrave Library': { latitude: -37.926698, longitude: 145.162394 },
  'Mulgrave Neighbourhood Library': { latitude: -37.926698, longitude: 145.162394 },
  'Glen Waverley Library': { latitude: -37.882280, longitude: 145.163841 },
  'Oakleigh Library': { latitude: -37.897201, longitude: 145.090457 },
}

export function getVenueCoordinates(venueName) {
  return VENUE_COORDINATES[venueName] ?? null
}