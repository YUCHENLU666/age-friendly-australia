// Key used to store planned service visit dates in localStorage.
const PLANNED_VISITS_KEY =
  'ageFriendlyAustralia.plannedServiceVisits'

/**
 * Read all planned service visits from localStorage.
 *
 * Data format:
 * {
 *   "12": "2026-10-10",
 *   "25": "2026-10-18"
 * }
 *
 * The object key is the service ID.
 * The value is the date selected by the user.
 */
function readPlannedVisits() {
  try {
    const stored =
      localStorage.getItem(
        PLANNED_VISITS_KEY,
      )

    if (!stored) {
      return {}
    }

    const parsed =
      JSON.parse(stored)

    if (
      parsed &&
      typeof parsed === 'object'
    ) {
      return parsed
    }
  } catch (error) {
    console.error(
      'Unable to read planned service visits.',
      error,
    )
  }

  return {}
}

/**
 * Save the complete planned visit object.
 */
function writePlannedVisits(
  plannedVisits,
) {
  localStorage.setItem(
    PLANNED_VISITS_KEY,
    JSON.stringify(plannedVisits),
  )
}

/**
 * Return all planned service visits.
 */
export function getPlannedServiceVisits() {
  return readPlannedVisits()
}

/**
 * Save or update the planned date for one service.
 *
 * If the service already has a date,
 * assigning a new value automatically updates it.
 */
export function savePlannedServiceVisit(
  serviceId,
  date,
) {
  if (!serviceId || !date) {
    return
  }

  const plannedVisits =
    readPlannedVisits()

  plannedVisits[
    String(serviceId)
  ] = date

  writePlannedVisits(
    plannedVisits,
  )
}