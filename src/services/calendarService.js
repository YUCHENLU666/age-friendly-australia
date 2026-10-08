// ======================================================
// Calendar service
// ======================================================
//
// This service manages personal planned visit dates for
// saved services using browser localStorage.
//
// It does NOT manage whether a service is saved.
//
// Responsibility split:
//
// savedItemsService
//   → stores which activity / service IDs are saved.
//
// calendarService
//   → stores the personal visit date selected for a
//     saved service.
//
// Main data flow:
//
// CalendarView
//   ↓
// calendarService
//   ↓
// localStorage
//
// Planned dates are personal planning information only.
// They do NOT represent real bookings with providers.
//


// ======================================================
// Local storage key
// ======================================================

// Stores planned service visit dates.
//
// Example:
//
// {
//   "12": "2026-10-10",
//   "25": "2026-10-18"
// }
//
// Object key:
//   service ID
//
// Object value:
//   user-selected planned visit date
//
const PLANNED_VISITS_KEY =
  'ageFriendlyAustralia.plannedServiceVisits'


// ======================================================
// Read planned visits
// ======================================================

/**
 * Read all planned service visit dates from localStorage.
 *
 * Expected structure:
 *
 * {
 *   "12": "2026-10-10",
 *   "25": "2026-10-18"
 * }
 *
 * Returns an empty object when:
 *
 * - no planned visits exist
 * - stored JSON cannot be parsed
 * - stored data is not a valid object
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
    // Invalid or corrupted localStorage data should not
    // prevent CalendarView from loading.
    console.error(
      'Unable to read planned service visits.',
      error,
    )
  }

  return {}
}


// ======================================================
// Write planned visits
// ======================================================

/**
 * Save the complete planned-service-date object
 * to localStorage.
 */
function writePlannedVisits(
  plannedVisits,
) {
  localStorage.setItem(
    PLANNED_VISITS_KEY,
    JSON.stringify(plannedVisits),
  )
}


// ======================================================
// Read all planned service visits
// ======================================================

/**
 * Return all currently stored planned service visits.
 *
 * Used by CalendarView to:
 *
 * - display existing planned dates
 * - build calendar entries
 * - pre-fill Day / Month / Year selectors
 */
export function getPlannedServiceVisits() {
  return readPlannedVisits()
}


// ======================================================
// Save or update one planned service visit
// ======================================================

/**
 * Save a planned date for one service.
 *
 * If the service already has a planned date, assigning
 * another value to the same service ID automatically
 * updates the existing date.
 *
 * Example:
 *
 * serviceId = 12
 * date = "2026-10-10"
 *
 * stored as:
 *
 * {
 *   "12": "2026-10-10"
 * }
 */
export function savePlannedServiceVisit(
  serviceId,
  date,
) {
  // Both a service ID and date are required.
  if (!serviceId || !date) {
    return
  }

  const plannedVisits =
    readPlannedVisits()

  // Service IDs are stored as object keys, so they are
  // normalised to strings for consistency.
  plannedVisits[
    String(serviceId)
  ] = date

  writePlannedVisits(
    plannedVisits,
  )
}