// ======================================================
// Weather service
// ======================================================
//
// This service loads the shared weather dataset used by
// WeatherCard components.
//
// Main responsibilities:
//
// 1. Load suburb weather and air-quality data.
// 2. Load the latest weather refresh status.
// 3. Reuse the same request across multiple WeatherCards.
// 4. Cache the request for a short period to avoid
//    repeatedly downloading the large weather JSON.
//
// Main data flow:
//
// WeatherCard
//   ↓
// loadWeatherData()
//   ↓
// weatherService
//   ↓
// melbourne_suburb_weather.json
// + weather_refresh_status.json
//

// Shared request cache.
//
// ActivitiesView may render many WeatherCard components
// at the same time. Instead of each card downloading the
// same large JSON file separately, they reuse one Promise.
let cachedRequest = null

// Time when the current cached request was created.
let cachedAt = 0

// Keep the shared weather request for 5 minutes.
const CACHE_DURATION =
  5 * 60 * 1000


// ======================================================
// JSON loader
// ======================================================

/**
 * Load and parse one JSON resource.
 *
 * Browser HTTP caching is disabled here because this
 * service manages its own short-lived in-memory cache.
 */
async function readJson(url) {
  const response = await fetch(
    url,
    {
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(
      `Could not load ${url}`,
    )
  }

  return response.json()
}


// ======================================================
// Shared weather-data loader
// ======================================================

/**
 * Load the weather dataset and refresh-status file.
 *
 * Multiple WeatherCard components can call this function,
 * but they reuse the same cached Promise while the cache
 * is still valid.
 *
 * The main weather file is required.
 * The refresh-status file is optional.
 */
export function loadWeatherData() {
  // Check whether the current in-memory cache has reached
  // its five-minute lifetime.
  const cacheExpired =
    Date.now() - cachedAt >=
    CACHE_DURATION

  // Start a new request when:
  //
  // - no cached request exists, or
  // - the existing cache has expired.
  if (
    !cachedRequest ||
    cacheExpired
  ) {
    cachedAt = Date.now()

    // Load the main weather dataset and refresh status
    // in parallel.
    cachedRequest = Promise.all([
      readJson(
        '/data/melbourne_suburb_weather.json',
      ),

      // The status file records whether the latest
      // weather-data refresh completed successfully.
      //
      // It is optional, so failure to load this file
      // should not prevent weather data from displaying.
      readJson(
        '/data/weather_refresh_status.json',
      ).catch(() => null),
    ])
      .then(([data, status]) => {
        // Validate the minimum structure expected by
        // WeatherCard before returning the dataset.
        if (
          !data ||
          !Array.isArray(
            data.locations,
          )
        ) {
          throw new Error(
            'Invalid weather JSON',
          )
        }

        return {
          data,
          status,
        }
      })
      .catch((error) => {
        // Remove the failed cached Promise so a future
        // call can attempt to load the data again.
        cachedRequest = null

        throw error
      })
  }

  // Return either the existing shared Promise or the
  // newly created one.
  return cachedRequest
}