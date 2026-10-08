// src/services/recommendationService.js
// Send activity preferences to the backend recommendation API.
//
// How calls move:
// HomeView.loadRecommendations -> getRecommendations -> POST /api/recommendations -> array of ranking results.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   cleanArray - Turn items into text and remove spaces and empty items.
//   getRecommendations - Send the four activity choices to the backend and return its recommendation list.
//
// Fixed values and data:
//   API_BASE_URL - Backend API address used by this file; remove the final slash if there is one.
//
// Notes:
//   This file sends HTTP requests. Scoring happens in age-friendly-database/ai/recommendationService.js.
//   textSize and saved service or activity IDs are not sent in this request.


// Backend API address used by this file; remove the final slash if there is one.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// Turn items into text and remove spaces and empty items.
// Example input: [' Music ', '', null, 'Music']
// Example result: ['Music', 'Music']; repeats are kept here.
function cleanArray(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) =>
      String(item ?? '').trim(),
    )
    .filter(Boolean)
}

// Send the four activity choices to the backend and return its recommendation list.
// Example input: {generalArea:'Clayton', interests:['Music'], textSize:'large'}
// Example result: sends generalArea, interests, preferredDays, activityTypes; leaves out textSize; Promise
// gives recommendation objects.
export async function getRecommendations(
  preferences,
) {
  // Copy only generalArea, interests, preferredDays, and activityTypes; do not send textSize.
  const requestBody = {
    generalArea:
      String(
        preferences?.generalArea ?? '',
      ).trim(),

    interests:
      cleanArray(
        preferences?.interests,
      ),

    preferredDays:
      cleanArray(
        preferences?.preferredDays,
      ),

    activityTypes:
      cleanArray(
        preferences?.activityTypes,
      ),
  }
  // Send the request and wait for the HTTP reply.
  const response =
    await fetch(
      `${API_BASE_URL}/recommendations`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            requestBody,
          ),
      },
    )

  // Read the backend error message if the status is not successful.
  if (!response.ok) {
    let message =
      `Unable to generate recommendations (${response.status}).`

    try {
      const errorData =
        await response.json()

      if (errorData?.error) {
        message =
          String(errorData.error)
      }
    } catch {
    }

    throw new Error(message)
  }

  // Read JSON from the successful reply.
  const data =
    await response.json()

  if (
    !data ||
    !Array.isArray(
      data.recommendations,
    )
  ) {
    throw new Error(
      'The recommendation API returned an unexpected format.',
    )
  }

  return data.recommendations
}