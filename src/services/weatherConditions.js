export function isWeatherNumber(
  value,
) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

export function activityTimeToHour(
  value,
) {
  const text =
    String(value ?? '').trim()

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

  // Eventfinda dates without an offset
  // already use Melbourne local time.
  if (!offset) {
    return (
      `${year}-${month}-${day}` +
      `T${hour}:00`
    )
  }

  // Convert explicit UTC or offset dates
  // into Melbourne local time.
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

  // Ignore hours where every requested
  // value is null.
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

  // Only use a failed status if the
  // failed attempt happened after the
  // saved forecast was generated.
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

  // Daily data older than 36 hours
  // is treated as stale.
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

export function getForecastMessage(
  weatherState,
  airQualityState,
  refreshState,
) {
  if (
    weatherState === 'available' ||
    airQualityState === 'available'
  ) {
    return ''
  }

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

// =========================
// UV category
// =========================
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

// =========================
// AQI category
// =========================
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

// =========================
// Outdoor conditions
// =========================
//
// Create a simple summary using
// UV, rain probability and US AQI.
//
export function getOutdoorConditions({
  uv,
  rain,
  aqi,
  stale = false,
}) {
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

  if (
    validRain &&
    rain >= 60
  ) {
    reasons.push('Rain likely')
  }

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

  if (reasons.length) {
    return {
      label: 'Take care',
      tone: 'caution',
      reasons,
    }
  }

  return {
    label:
      'No flagged conditions',
    tone: 'good',
    reasons: [
      'No concerns flagged by the UV, rain or US AQI checks',
    ],
  }
}