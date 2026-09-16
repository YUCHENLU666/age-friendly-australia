// ======================================================
// AI Recommendation Service
// ======================================================
//
// This file is responsible for:
// 1. Sending the user's saved preferences to the backend
// 2. Calling POST /api/recommendations
// 3. Returning the AI recommendation results to Vue
//
// Backend endpoint:
// POST /api/recommendations
//
// ======================================================

// Decide which backend API the frontend should use.
//
// Local development:
// http://localhost:3000/api
//
// Production:
// VITE_API_BASE_URL can be configured in .env.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// ======================================================
// Clean preference arrays
// ======================================================
//
// This protects the backend from receiving unexpected
// values such as null, undefined or non-array data.
//
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

// ======================================================
// Request AI recommendations
// ======================================================
//
// preferences should contain:
//
// {
//   generalArea: '',
//   interests: [],
//   preferredDays: [],
//   activityTypes: []
// }
//
// The backend returns:
//
// {
//   recommendations: [
//     {
//       activityId,
//       score,
//       reasons,
//       breakdown
//     }
//   ]
// }
//
export async function getRecommendations(
  preferences,
) {
  // Prepare only the fields required by the AI model.
  // textSize is intentionally excluded because it is
  // a UI preference rather than an activity preference.
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
  //Send a POST request
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

  // If the backend returns a non-200 response,
  // turn it into a normal JavaScript error so the
  // homepage can display an accessible error message.
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
      // Keep the default message if the response
      // is not valid JSON.
    }

    throw new Error(message)
  }

  const data =
    await response.json()

  // Protect the UI against malformed backend responses.
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