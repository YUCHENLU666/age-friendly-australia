const BASE_URL = 'https://services-ap1.arcgis.com/P744lA0wf4LlBZ84/ArcGIS/rest/services/Vicmap_Features_of_Interest/FeatureServer/1/query'

/**
 * Query live community venue facilities from Vicmap Features of Interest.
 * @param {string} featureType - e.g. 'community venue'
 * @param {string} [featureSubtype] - optional, e.g. 'senior citizens'
 * @param {number} [limit=50]
 */
async function getCommunityVenues(featureType = 'community venue', featureSubtype = null, limit = 50) {
  let where = `feature_type='${featureType}'`
  if (featureSubtype) {
    where += ` AND feature_subtype='${featureSubtype}'`
  }

  const params = new URLSearchParams({
    where,
    outFields: 'name,feature_type,feature_subtype',
    f: 'geojson',
    resultRecordCount: String(limit),
  })

  const response = await fetch(`${BASE_URL}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Vicmap FOI request failed: ${response.status}`)
  }

  const data = await response.json()

  return data.features.map((feature) => ({
    name: feature.properties.name,
    featureType: feature.properties.feature_type,
    featureSubtype: feature.properties.feature_subtype,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
  }))
}

module.exports = { getCommunityVenues }