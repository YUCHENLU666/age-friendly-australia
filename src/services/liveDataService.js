const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

/**
 * Load senior-friendly community venues
 * from the backend Vicmap proxy.
 */
export async function getLiveCommunityVenues(
  limit = 10,
) {
  const params =
    new URLSearchParams({
      subtype: 'senior citizens',
      limit: String(limit),
    })

  const response =
    await fetch(
      `${API_BASE_URL}/realtime/community-venues?${params.toString()}`,
    )

  if (!response.ok) {
    throw new Error(
      `Unable to load community venues (${response.status}).`,
    )
  }

  const data =
    await response.json()

  if (!Array.isArray(data)) {
    throw new Error(
      'The community venue API returned an unexpected format.',
    )
  }

  return data
}

/**
 * Load realtime bus positions
 * from the backend PTV proxy.
 */
export async function getLiveBusPositions({
  routeId = '',
  limit = 10,
} = {}) {
  const params =
    new URLSearchParams({
      limit: String(limit),
    })

  if (routeId.trim()) {
    params.set(
      'routeId',
      routeId.trim(),
    )
  }

  const response =
    await fetch(
      `${API_BASE_URL}/realtime/bus-positions?${params.toString()}`,
    )

  if (!response.ok) {
    throw new Error(
      `Unable to load live bus positions (${response.status}).`,
    )
  }

  const data =
    await response.json()

  if (!Array.isArray(data)) {
    throw new Error(
      'The live bus API returned an unexpected format.',
    )
  }

  return data
}