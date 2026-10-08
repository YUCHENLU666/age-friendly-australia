// src/services/liveDataService.js
// Ask the backend for live places and bus positions.
//
// How calls move:
// LiveInformationView loaders -> getLiveCommunityVenues/getLiveBusPositions -> backend realtime routes.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   getLiveCommunityVenues - Ask the backend for senior-citizens places and check the reply is a list.
//   getLiveBusPositions - Ask the backend for bus positions; send a route only when it is not empty.
//
// Fixed values and data:
//   API_BASE_URL - Backend API address used by this file; remove the final slash if there is one.
//
// Notes:
//   The API key stays on the backend; the browser receives JSON, not the binary PTV feed.
//   A failed HTTP status throws an error; these helpers do not read the backend error text.

// Backend API address used by this file; remove the final slash if there is one.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// Ask the backend for senior-citizens places and check the reply is a list.
// Example input: limit=10
// Example result: GET /api/realtime/community-venues?subtype=senior%20citizens&limit=10 (URL may use + for
// spaces); Promise gives the venue list. The backend uses type=community venue by default.
export async function getLiveCommunityVenues(
  limit = 10,
) {
  // Build URL query values safely.
  const params =
    new URLSearchParams({
      subtype: 'senior citizens',
      limit: String(limit),
    })

  const response =
    await fetch(
      `${API_BASE_URL}/realtime/community-venues?${params.toString()}`,
    )

  // Throw an error for a failed HTTP status.
  if (!response.ok) {
    throw new Error(
      `Unable to load community venues (${response.status}).`,
    )
  }

  // covert the response to JavaScript list
  const data =
    await response.json()

  // The reply must be a list; otherwise throw an error.
  if (!Array.isArray(data)) {
    throw new Error(
      'The community venue API returned an unexpected format.',
    )
  }

  return data
}

// Ask the backend for bus positions; send a route only when it is not empty.
// Example input: {routeId:' R1 ', limit:10}
// Example result: GET /api/realtime/bus-positions?limit=10&routeId=R1; Promise gives the bus list.
export async function getLiveBusPositions({
  routeId = '',
  limit = 10,
} = {}) {
  // Build URL query values safely.
  const params =
    new URLSearchParams({
      limit: String(limit),
    })

  // Only add a route filter when the trimmed text is not empty.
  if (routeId.trim()) {
    params.set(
      'routeId',
      routeId.trim(),//delete spaces
    )
  }

  const response =
    await fetch(
      `${API_BASE_URL}/realtime/bus-positions?${params.toString()}`,
    )

  // Throw an error for a failed HTTP status.
  if (!response.ok) {
    throw new Error(
      `Unable to load live bus positions (${response.status}).`,
    )
  }

  const data =
    await response.json()

  // The reply must be a list; otherwise throw an error.
  if (!Array.isArray(data)) {
    throw new Error(
      'The live bus API returned an unexpected format.',
    )
  }

  return data
}