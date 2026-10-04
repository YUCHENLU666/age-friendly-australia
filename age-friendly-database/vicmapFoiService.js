const BASE_URL =
  'https://services-ap1.arcgis.com/P744lA0wf4LlBZ84/ArcGIS/rest/services/Vicmap_Features_of_Interest/FeatureServer/1/query'

/**
 * Escape string values used inside an ArcGIS SQL where clause.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeArcgisString(value) {
  return String(value).replace(/'/g, "''")
}

/**
 * Query community venue facilities from Vicmap Features of Interest.
 *
 * @param {string} featureType
 *   Example: 'community venue'
 *
 * @param {string|null} featureSubtype
 *   Optional.
 *   Example: 'senior citizens'
 *
 * @param {number} limit
 *   Maximum number of results to return.
 *
 * @returns {Promise<Array>}
 */
async function getCommunityVenues(
  featureType = 'community venue',
  featureSubtype = null,
  limit = 50,
) {
  const safeFeatureType = escapeArcgisString(featureType)

  let where = `feature_type='${safeFeatureType}'`

  if (featureSubtype) {
    const safeFeatureSubtype = escapeArcgisString(featureSubtype)
    where += ` AND feature_subtype='${safeFeatureSubtype}'`
  }

  // Keep request size within a reasonable range.
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

    // ArcGIS can return an API error object as valid JSON.
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