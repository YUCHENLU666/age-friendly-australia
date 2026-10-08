// age-friendly-database/vicmapFoiService.js
// Ask Vicmap for community places and clean the map reply.
//
// How calls move:
// server realtime/community-venues callback -> getCommunityVenues -> ArcGIS fetch -> normalised venue array.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   escapeArcgisString - Double each quote so text can be used inside the ArcGIS query.
//   getCommunityVenues - Ask Vicmap for places of this type and turn map data into venue objects.
//
// Fixed values and data:
//   BASE_URL - Vicmap ArcGIS API address for place queries.
//
// Notes:
//   The query does not limit results by user location or a Melbourne map box.
//   GeoJSON stores longitude first and latitude second.

// Vicmap ArcGIS API address for place queries.
const BASE_URL =
  'https://services-ap1.arcgis.com/P744lA0wf4LlBZ84/ArcGIS/rest/services/Vicmap_Features_of_Interest/FeatureServer/1/query'

// Double each quote so text can be used inside the ArcGIS query.
// Example input: "O'Brien"
// Example result: "O''Brien".
function escapeArcgisString(value) {
  return String(value).replace(/'/g, "''")
}

// Ask Vicmap for places of this type and turn map data into venue objects.
// Example input: featureType='community venue', featureSubtype='senior citizens', limit=10; feature has
// coordinates=[145.1,-37.9]
// Example result: Promise gives up to 10 venues with latitude:-37.9, longitude:145.1.
async function getCommunityVenues(
  featureType = 'community venue',
  featureSubtype = null,
  limit = 50,
) {
  const safeFeatureType = escapeArcgisString(featureType)

  // Start with feature type; add subtype when given.
  let where = `feature_type='${safeFeatureType}'`

  if (featureSubtype) {
    const safeFeatureSubtype = escapeArcgisString(featureSubtype)
    where += ` AND feature_subtype='${safeFeatureSubtype}'`
  }

  // Keep the result limit between 1 and 200; use 50 when not set.
  // if limit is null or undefined, return 50, max(50,1) = 50, min(50,200) = 50
  const safeLimit = Math.min(
    Math.max(Number.parseInt(limit, 10) || 50, 1),
    200,
  )

  const params = new URLSearchParams({
    where,
    outFields: 'name,feature_type,feature_subtype',
    returnGeometry: 'true',
    f: 'geojson',
    resultRecordCount: String(safeLimit),
  })

  const requestUrl = `${BASE_URL}?${params.toString()}`

  try {
    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(
        `Vicmap FOI request failed with HTTP status ${response.status}`,
      )
    }

    const data = await response.json()

    // ArcGIS can return JSON that contains an API error.
    if (data.error) {
      throw new Error(
        `Vicmap API error: ${data.error.message || 'Unknown ArcGIS error'}`,
      )
    }

    if (!Array.isArray(data.features)) {
      throw new Error(
        'Vicmap response does not contain a valid features array.',
      )
    }

    // Keep usable map features and build page-ready place objects.
    return data.features
      .filter(
        (feature) =>
          feature &&
          feature.properties &&
          feature.geometry &&
          Array.isArray(feature.geometry.coordinates) &&
          feature.geometry.coordinates.length >= 2,
      )
      .map((feature) => ({
        name: feature.properties.name ?? null,
        featureType: feature.properties.feature_type ?? null,
        featureSubtype: feature.properties.feature_subtype ?? null,
        latitude: feature.geometry.coordinates[1] ?? null,
        longitude: feature.geometry.coordinates[0] ?? null,
      }))
  } catch (error) {
    console.error('Vicmap service error:', error.message)
    throw error
  }
}

module.exports = {
  getCommunityVenues,
}