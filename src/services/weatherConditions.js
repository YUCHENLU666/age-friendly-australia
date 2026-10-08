// ======================================================
// Weather conditions utilities
// ======================================================
//
// This module contains the reusable logic used by
// WeatherCard to interpret activity weather data.
//
// Main responsibilities:
//
// 1. Validate numeric weather values.
// 2. Convert activity date/time into a Melbourne
//    hourly forecast key.
// 3. Read hourly weather and air-quality values.
// 4. Determine forecast coverage / availability.
// 5. Evaluate refresh freshness.
// 6. Classify UV and AQI values.
// 7. Produce a simplified outdoor-condition summary.
//
// This module does not fetch data itself.
// Data loading is handled by weatherService.
//


// ======================================================
// Weather number validation
// ======================================================

/**
 * Check whether a weather value is a valid finite number.
 *
 * This prevents null, undefined, NaN and Infinity from
 * being treated as usable forecast values.
 */
export function isWeatherNumber(
  value,
) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}


// ======================================================
// Activity time normalisation
// ======================================================

/**
 * Convert an activity date/time into the hourly timestamp
 * format used by the weather dataset.
 *
 * Example:
 *
 * 2026-10-06 14:30:00
 *
 * becomes:
 *
 * 2026-10-06T14:00
 *
 * Two input types are supported:
 *
 * 1. Date/time without an explicit timezone offset
 *    → treated as Melbourne local time.
 *
 * 2. Date/time with UTC / timezone offset
 *    → converted into Melbourne local time.
 *
 * Invalid dates return null.
 */
export function activityTimeToHour(
  value,
) {
  const text =
    String(value ?? '').trim()

  // Accept:
  //
  // YYYY-MM-DD HH:mm:ss
  // YYYY-MM-DDTHH:mm:ss
  // optional milliseconds
  // optional UTC / timezone offset
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/,
  )

  if (!match) {
    return null
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = '00',
    offset,
  ] = match

  // Build a UTC date only for validation of calendar
  // values such as invalid days or impossible times.
  const check = new Date(
    Date.UTC(
      +year,
      +month - 1,
      +day,
      +hour,
      +minute,
      +second,
    ),
  )

  if (
    check.getUTCFullYear() !==
      +year ||
    check.getUTCMonth() !==
      +month - 1 ||
    check.getUTCDate() !==
      +day ||
    +hour > 23 ||
    +minute > 59 ||
    +second > 59
  ) {
    return null
  }

  // Eventfinda dates without an explicit offset are
  // already expressed in Melbourne local time.
  if (!offset) {
    return (
      `${year}-${month}-${day}` +
      `T${hour}:00`
    )
  }

  // Dates with an explicit UTC / timezone offset must
  // be converted into Melbourne local time before they
  // can be matched against the weather dataset.
  const date = new Date(
    text.replace(' ', 'T'),
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  const melbourne =
    date.toLocaleString(
      'sv-SE',
      {
        timeZone:
          'Australia/Melbourne',
        hour12: false,
      },
    )

  return (
    `${melbourne
      .slice(0, 13)
      .replace(' ', 'T')}:00`
  )
}


// ======================================================
// Hourly value lookup
// ======================================================

/**
 * Read one field from an hourly forecast at a specific
 * activity hour.
 *
 * Returns null when:
 *
 * - the activity hour is unavailable
 * - hourly timestamps are unavailable
 * - the requested hour is outside the dataset
 * - the value is not a valid weather number
 */
export function getHourlyValue(
  hourly,
  hour,
  field,
) {
  if (
    !hour ||
    !Array.isArray(hourly?.time)
  ) {
    return null
  }

  const index =
    hourly.time.indexOf(hour)

  if (index === -1) {
    return null
  }

  const value =
    hourly[field]?.[index]

  return isWeatherNumber(value)
    ? value
    : null
}


// ======================================================
// Forecast coverage state
// ======================================================

/**
 * Determine whether usable forecast data exists for the
 * requested activity hour.
 *
 * Possible states:
 *
 * available
 *   At least one requested field has a usable value.
 *
 * future
 *   The requested activity hour is later than the
 *   available forecast range.
 *
 * past
 *   The requested activity hour is earlier than the
 *   available forecast range.
 *
 * missing
 *   Forecast structure or usable values are unavailable.
 */
export function getForecastState(
  hourly,
  hour,
  fields,
) {
  if (
    !hour ||
    !Array.isArray(hourly?.time)
  ) {
    return 'missing'
  }

  // Ignore timestamps where every requested weather
  // field is unavailable.
  const validTimes =
    hourly.time.filter(
      (time, index) =>
        typeof time === 'string' &&
        fields.some((field) =>
          isWeatherNumber(
            hourly[field]?.[index],
          ),
        ),
    )

  if (!validTimes.length) {
    return 'missing'
  }

  const firstTime =
    validTimes[0]

  const lastTime =
    validTimes[
      validTimes.length - 1
    ]

  if (hour > lastTime) {
    return 'future'
  }

  if (hour < firstTime) {
    return 'past'
  }

  // The hour may fall inside the general forecast range
  // while still having no usable value for the requested
  // fields.
  const valueAvailable =
    fields.some(
      (field) =>
        getHourlyValue(
          hourly,
          hour,
          field,
        ) !== null,
    )

  return valueAvailable
    ? 'available'
    : 'missing'
}


// ======================================================
// Weather refresh state
// ======================================================

/**
 * Determine whether the stored weather dataset should be
 * treated as current, stale or failed.
 *
 * failed:
 *   The latest refresh attempt failed after the saved
 *   forecast was generated.
 *
 * stale:
 *   The saved forecast is missing a valid timestamp or
 *   is older than 36 hours.
 *
 * current:
 *   The saved forecast is sufficiently recent.
 */
export function getRefreshState(
  fetchedAt,
  status,
  now = Date.now(),
) {
  const fetched =
    Date.parse(fetchedAt)

  const attempted =
    Date.parse(
      status?.last_attempt_at,
    )

  // A failed refresh is relevant only when the failed
  // attempt happened after the currently saved forecast
  // was generated.
  if (
    status?.status === 'failed' &&
    Number.isFinite(attempted) &&
    (
      !Number.isFinite(fetched) ||
      attempted >= fetched
    )
  ) {
    return 'failed'
  }

  // Weather data older than 36 hours is considered stale.
  const maximumAge =
    36 * 60 * 60 * 1000

  if (
    !Number.isFinite(fetched) ||
    now - fetched > maximumAge
  ) {
    return 'stale'
  }

  return 'current'
}


// ======================================================
// Forecast message
// ======================================================

/**
 * Build the user-facing message shown when forecast data
 * is unavailable for the requested activity time.
 */
export function getForecastMessage(
  weatherState,
  airQualityState,
  refreshState,
) {
  // No warning is needed when either weather or AQI data
  // is available for the activity hour.
  if (
    weatherState === 'available' ||
    airQualityState === 'available'
  ) {
    return ''
  }

  // If the stored dataset is stale or the latest refresh
  // failed, advise the user to check again after an update.
  if (
    refreshState !== 'current'
  ) {
    return (
      'The saved forecast does not ' +
      'cover this activity time. ' +
      'Please check again after ' +
      'the next update.'
    )
  }

  // A future state means the activity is outside the
  // current forecast horizon.
  if (
    weatherState === 'future' ||
    airQualityState === 'future'
  ) {
    return (
      'Forecast available closer ' +
      'to the activity date'
    )
  }

  return (
    'Forecast unavailable for ' +
    'this activity time.'
  )
}


// ======================================================
// UV classification
// ======================================================

/**
 * Convert a numeric UV index into a user-facing category
 * and visual tone.
 *
 * The numeric UV value is still displayed separately by
 * WeatherCard.
 */
export function classifyUv(
  value,
) {
  if (
    !isWeatherNumber(value) ||
    value < 0
  ) {
    return {
      label: 'Unavailable',
      tone: 'neutral',
    }
  }

  if (value < 3) {
    return {
      label: 'Low',
      tone: 'good',
    }
  }

  if (value < 6) {
    return {
      label: 'Moderate',
      tone: 'moderate',
    }
  }

  if (value < 8) {
    return {
      label: 'High',
      tone: 'caution',
    }
  }

  if (value < 11) {
    return {
      label: 'Very High',
      tone: 'danger',
    }
  }

  return {
    label: 'Extreme',
    tone: 'severe',
  }
}


// ======================================================
// AQI classification
// ======================================================

/**
 * Convert a US AQI value into a user-facing category
 * and visual tone.
 *
 * The original numeric AQI value is retained for display.
 */
export function classifyAqi(
  value,
) {
  if (
    !isWeatherNumber(value) ||
    value < 0
  ) {
    return {
      label: 'Unavailable',
      tone: 'neutral',
    }
  }

  if (value <= 50) {
    return {
      label: 'Good',
      tone: 'good',
    }
  }

  if (value <= 100) {
    return {
      label: 'Moderate',
      tone: 'moderate',
    }
  }

  if (value <= 150) {
    return {
      label:
        'Unhealthy for Sensitive Groups',
      tone: 'caution',
    }
  }

  if (value <= 200) {
    return {
      label: 'Unhealthy',
      tone: 'danger',
    }
  }

  if (value <= 300) {
    return {
      label: 'Very Unhealthy',
      tone: 'severe',
    }
  }

  return {
    label: 'Hazardous',
    tone: 'hazardous',
  }
}


// ======================================================
// Outdoor conditions summary
// ======================================================

/**
 * Create a simple outdoor-condition summary using:
 *
 * - UV index
 * - rain probability
 * - US AQI
 *
 * The result contains:
 *
 * label
 *   Short overall message shown to the user.
 *
 * tone
 *   Visual category used by WeatherCard.
 *
 * reasons
 *   Specific conditions that contributed to the result.
 */
export function getOutdoorConditions({
  uv,
  rain,
  aqi,
  stale = false,
}) {
  // Validate each input before applying thresholds.
  const validUv =
    isWeatherNumber(uv) &&
    uv >= 0

  const validRain =
    isWeatherNumber(rain) &&
    rain >= 0 &&
    rain <= 100

  const validAqi =
    isWeatherNumber(aqi) &&
    aqi >= 0

  const reasons = []

  // --------------------------------------
  // UV warnings
  // --------------------------------------
  if (
    validUv &&
    uv >= 6
  ) {
    reasons.push('High UV')
  } else if (
    validUv &&
    uv >= 3
  ) {
    reasons.push(
      'Sun protection recommended',
    )
  }

  // --------------------------------------
  // Rain warning
  // --------------------------------------
  if (
    validRain &&
    rain >= 60
  ) {
    reasons.push('Rain likely')
  }

  // --------------------------------------
  // Air-quality warnings
  // --------------------------------------
  if (
    validAqi &&
    aqi > 100
  ) {
    reasons.push(
      'Poor air quality',
    )
  } else if (
    validAqi &&
    aqi > 50
  ) {
    reasons.push(
      'Moderate air quality',
    )
  }

  // --------------------------------------
  // Stale forecast
  // --------------------------------------
  //
  // Stale data should not be presented as a confident
  // outdoor recommendation.
  if (stale) {
    reasons.push(
      'Data may be out of date',
    )

    return {
      label:
        'Check latest forecast',
      tone: 'neutral',
      reasons,
    }
  }

  // --------------------------------------
  // Incomplete forecast
  // --------------------------------------
  //
  // All three values are required before producing a
  // complete outdoor-condition recommendation.
  if (
    !validUv ||
    !validRain ||
    !validAqi
  ) {
    reasons.push(
      'Some forecast values are unavailable',
    )

    return {
      label:
        'Forecast incomplete',
      tone: 'neutral',
      reasons,
    }
  }

  // --------------------------------------
  // Strong warning
  // --------------------------------------
  //
  // Extreme UV or poor air quality produces the most
  // restrictive summary.
  if (
    uv >= 11 ||
    aqi > 150
  ) {
    return {
      label: 'Not ideal',
      tone: 'danger',
      reasons,
    }
  }

  // --------------------------------------
  // Caution
  // --------------------------------------
  //
  // Any lower-level warning means outdoor conditions
  // require some care.
  if (reasons.length) {
    return {
      label: 'Take care',
      tone: 'caution',
      reasons,
    }
  }

  // --------------------------------------
  // No flagged conditions
  // --------------------------------------
  return {
    label:
      'No flagged conditions',
    tone: 'good',
    reasons: [
      'No concerns flagged by the UV, rain or US AQI checks',
    ],
  }
}