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