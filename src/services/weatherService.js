// Cards share one download instead of fetching
// the large JSON separately for every activity.
let cachedRequest = null
let cachedAt = 0

const CACHE_DURATION =
  5 * 60 * 1000

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

export function loadWeatherData() {
  const cacheExpired =
    Date.now() - cachedAt >=
    CACHE_DURATION

  if (
    !cachedRequest ||
    cacheExpired
  ) {
    cachedAt = Date.now()

    cachedRequest = Promise.all([
      readJson(
        '/data/melbourne_suburb_weather.json',
      ),

      // The status file records whether
      // the latest API refresh succeeded.
      readJson(
        '/data/weather_refresh_status.json',
      ).catch(() => null),
    ])
      .then(([data, status]) => {
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
        cachedRequest = null
        throw error
      })
  }

  return cachedRequest
}