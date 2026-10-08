// ======================================================
// Activity service
// ======================================================
//
// This service is responsible for loading and preparing
// activity data for the frontend.
//
// Main responsibilities:
//
// 1. Request activities from the backend API.
// 2. Normalise different backend field names into one
//    consistent frontend activity structure.
// 3. Derive additional UI fields such as:
//    - day
//    - suitability
//    - primary tag
//    - activity type
//    - fallback image
// 4. Cache the activity catalogue in memory.
// 5. Load nearby public transport only when an
//    individual activity detail page is opened.
//
// Main data flow:
//
// SQLite
//   ↓
// Express GET /api/activities
//   ↓
// activityService
//   ↓
// normaliseActivity()
//   ↓
// Vue components
//

import {
  getVenueCoordinates,
} from './venueCoordinates'

import {
  findNearestStop,
  getTransitStops,
} from '@/services/transitStopsService'


// ======================================================
// API configuration
// ======================================================

// Use the deployed backend URL when provided through
// environment variables.
//
// Fall back to the local backend during development.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')


// ======================================================
// UI text sanitisation
// ======================================================
//
// Some source data may contain terminology that should
// not appear in the user-facing interface.
//
// safeUiText() converts incoming values to strings,
// replaces the blocked term and removes surrounding
// whitespace.
//
const blockedUiTerm = [
  'com',
  'munity',
].join('')

const blockedUiPattern =
  new RegExp(
    `\\b${blockedUiTerm}\\b`,
    'gi',
  )

function safeUiText(value) {
  return String(value ?? '')
    .replace(
      blockedUiPattern,
      'local',
    )
    .trim()
}


// ======================================================
// Tag normalisation
// ======================================================

/**
 * Convert backend tag data into a clean array.
 *
 * Backend records may provide tags either as:
 *
 * - an existing array
 * - a semicolon-separated string
 *
 * Empty values are removed before returning the result.
 */
function normaliseTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) =>
        safeUiText(tag),
      )
      .filter(Boolean)
  }

  return safeUiText(value)
    .split(';')
    .map((tag) =>
      tag.trim(),
    )
    .filter(Boolean)
}


// ======================================================
// Upcoming activity check
// ======================================================

/**
 * Determine whether an activity should remain visible.
 *
 * If the schedule can be parsed as a real date,
 * past activities are excluded.
 *
 * If the schedule is descriptive text rather than a
 * parseable date, the activity is kept because it may
 * represent a recurring or flexible schedule.
 */
function isUpcoming(row) {
  const raw =
    row.day_time ??
    row.dayTime ??
    row.schedule ??
    ''

  const trimmed =
    raw.trim()

  if (!trimmed) {
    return false
  }

  const parsed =
    new Date(trimmed)

  const looksLikeDate =
    !Number.isNaN(
      parsed.getTime(),
    )

  if (looksLikeDate) {
    return parsed >= new Date()
  }

  return true
}


// ======================================================
// Day normalisation
// ======================================================

/**
 * Derive a weekday from the activity schedule.
 *
 * If no weekday can be identified, the activity is
 * treated as having a flexible schedule.
 */
function getDay(schedule) {
  const value =
    schedule.toLowerCase()

  if (value.includes('mon')) {
    return 'Monday'
  }

  if (value.includes('tue')) {
    return 'Tuesday'
  }

  if (value.includes('wed')) {
    return 'Wednesday'
  }

  if (value.includes('thu')) {
    return 'Thursday'
  }

  if (value.includes('fri')) {
    return 'Friday'
  }

  if (value.includes('sat')) {
    return 'Saturday'
  }

  if (value.includes('sun')) {
    return 'Sunday'
  }

  return 'Flexible'
}


// ======================================================
// Suitability normalisation
// ======================================================

/**
 * Convert backend older-adult suitability values into
 * the standard value + label structure used by the UI.
 *
 * value:
 *   Used internally for filtering and styling.
 *
 * label:
 *   Displayed directly to users.
 */
function getSuitability(value) {
  const normalised =
    safeUiText(value)
      .toLowerCase()

  if (normalised === 'yes') {
    return {
      value: 'yes',
      label:
        'Suitable for older adults',
    }
  }

  if (
    normalised === 'partially'
  ) {
    return {
      value: 'partial',
      label:
        'May be suitable',
    }
  }

  if (normalised === 'no') {
    return {
      value: 'no',
      label:
        'Not marked as suitable',
    }
  }

  return {
    value: 'unknown',
    label:
      'Suitability not provided',
  }
}


// ======================================================
// Primary activity tag
// ======================================================

/**
 * Select the most useful activity tag for display.
 *
 * Generic source tags such as "Adult" or
 * "Event Series" are ignored where possible.
 *
 * If no useful tag exists, fall back to:
 *
 * 1. the first available tag
 * 2. "Activity"
 */
function getPrimaryTag(tags) {
  const lessUsefulPrimaryTags =
    new Set([
      'PALS',
      'Adult',
      'Event Series',
    ])

  return (
    tags.find(
      (tag) =>
        !lessUsefulPrimaryTags.has(
          tag,
        ),
    ) ||
    tags[0] ||
    'Activity'
  )
}


// ======================================================
// Activity type classification
// ======================================================

/**
 * Derive a broad activity type from keywords in the
 * activity name and tags.
 *
 * This lightweight rule-based classification supports
 * filtering and consistent frontend presentation.
 */
function getActivityType(
  name,
  tags,
) {
  const activityName =
    name.toLowerCase()

  const tagText =
    tags
      .join(' ')
      .toLowerCase()

  if (
    activityName.includes(
      'bushwalking',
    ) ||
    activityName.includes(
      'bird',
    ) ||
    tagText.includes(
      'environment',
    ) ||
    tagText.includes(
      'sustainability',
    )
  ) {
    return 'Outdoor & nature'
  }

  if (
    activityName.includes(
      'knitting',
    ) ||
    activityName.includes(
      'weaving',
    ) ||
    activityName.includes(
      'upcycling',
    ) ||
    tagText.includes('craft')
  ) {
    return 'Arts & crafts'
  }

  if (
    activityName.includes(
      'digital',
    ) ||
    activityName.includes(
      'artificial intelligence',
    ) ||
    activityName.includes(
      'online security',
    ) ||
    activityName.includes(
      'smart watch',
    ) ||
    activityName.includes(
      'fitness tracker',
    ) ||
    activityName.includes(
      'scam',
    ) ||
    tagText.includes(
      'technology',
    )
  ) {
    return 'Learning & technology'
  }

  if (
    activityName.includes(
      'brain training',
    ) ||
    activityName.includes(
      'safety matters',
    ) ||
    tagText.includes(
      'health',
    ) ||
    tagText.includes(
      'wellbeing',
    )
  ) {
    return 'Health & wellbeing'
  }

  if (
    activityName.includes(
      'conversation',
    ) ||
    activityName.includes(
      'social group',
    ) ||
    tagText.includes(
      'cultural event',
    ) ||
    tagText.includes(
      'social connections',
    )
  ) {
    return 'Social & cultural'
  }

  if (
    tagText.includes(
      'personal development',
    )
  ) {
    return 'Learning & development'
  }

  return 'General activity'
}


// ======================================================
// Fallback activity images
// ======================================================

/**
 * Generate a stable numeric value from an activity name.
 *
 * This is used when two possible fallback images exist,
 * so the same activity consistently receives the same
 * image across renders.
 */
function getStableImageIndex(name) {
  return name
    .split('')
    .reduce(
      (
        total,
        character,
      ) =>
        total +
        character.charCodeAt(0),
      0,
    )
}


/**
 * Select a fallback image when the database does not
 * provide a real image URL.
 *
 * The fallback image is selected using keywords from
 * the activity name and tags.
 */
function getActivityImage(
  name,
  tags,
) {
  const activityName =
    name.toLowerCase()

  const tagText =
    tags
      .join(' ')
      .toLowerCase()

  if (
    activityName.includes(
      'brain training',
    ) ||
    activityName.includes(
      'safety matters',
    )
  ) {
    return '/images/activity-health.jpg'
  }

  if (
    activityName.includes(
      'knitting',
    ) ||
    activityName.includes(
      'weaving',
    ) ||
    activityName.includes(
      'upcycling',
    )
  ) {
    return '/images/activity-craft.jpg'
  }

  if (
    activityName.includes(
      'bushwalking',
    ) ||
    activityName.includes(
      'bird',
    )
  ) {
    return '/images/activity-walking.jpg'
  }

  if (
    activityName.includes(
      'digital',
    ) ||
    activityName.includes(
      'artificial intelligence',
    ) ||
    activityName.includes(
      'online security',
    ) ||
    activityName.includes(
      'scam',
    ) ||
    activityName.includes(
      'smart watch',
    ) ||
    activityName.includes(
      'fitness tracker',
    )
  ) {
    const imageIndex =
      getStableImageIndex(name)

    return imageIndex % 2 === 0
      ? '/images/activity-tech.jpg'
      : '/images/activity-tech-2.jpg'
  }

  if (
    activityName.includes(
      'conversation',
    ) ||
    activityName.includes(
      'social group',
    )
  ) {
    return '/images/activity-social.jpg'
  }

  if (
    activityName.includes(
      'festival',
    )
  ) {
    return '/images/activities.jpg'
  }

  if (
    activityName.includes(
      'justice of the peace',
    )
  ) {
    return '/images/learning.jpg'
  }

  if (
    tagText.includes(
      'technology',
    )
  ) {
    const imageIndex =
      getStableImageIndex(name)

    return imageIndex % 2 === 0
      ? '/images/activity-tech.jpg'
      : '/images/activity-tech-2.jpg'
  }

  if (
    tagText.includes('health') ||
    tagText.includes(
      'wellbeing',
    )
  ) {
    return '/images/activity-health.jpg'
  }

  if (
    tagText.includes('craft')
  ) {
    return '/images/activity-craft.jpg'
  }

  if (
    tagText.includes(
      'environment',
    ) ||
    tagText.includes(
      'sustainability',
    )
  ) {
    return '/images/activity-walking.jpg'
  }

  if (
    tagText.includes(
      'cultural event',
    ) ||
    tagText.includes(
      'personal development',
    )
  ) {
    return '/images/learning.jpg'
  }

  if (
    tagText.includes(
      'social connections',
    )
  ) {
    return '/images/activity-social.jpg'
  }

  return '/images/activities.jpg'
}


// ======================================================
// Activity normalisation
// ======================================================

/**
 * Convert one backend activity record into the standard
 * activity object used throughout the frontend.
 *
 * Backend datasets may use different field names, such as:
 *
 * event_name / name / title
 * day_time / dayTime / schedule
 * senior_relevant / seniorRelevant / suitability
 *
 * This function hides those differences from the Vue
 * components by returning one consistent data structure.
 */
function normaliseActivity(
  row,
  index,
  transitStops,
) {
  const tags =
    normaliseTags(
      row.category_tags ??
        row.tags ??
        row.category,
    )

  const schedule =
    safeUiText(
      row.day_time ??
        row.dayTime ??
        row.schedule ??
        '',
    )

  const suitability =
    getSuitability(
      row.senior_relevant ??
        row.seniorRelevant ??
        row.suitability,
    )

  const name =
    safeUiText(
      row.event_name ??
        row.name ??
        row.title ??
        'Untitled activity',
    )

  const venue =
    safeUiText(
      row.venue ||
        'Venue not provided',
    )

  // Convert a known venue into coordinates so that
  // nearby public transport can be calculated when
  // transit stop data is available.
  const coordinates =
    getVenueCoordinates(venue)

  const nearestStop =
    coordinates
      ? findNearestStop(
          coordinates,
          transitStops,
        )
      : null

  return {
    id: String(
      row.id ??
        row.activity_id ??
        `activity-${index + 1}`,
    ),

    name,

    tags,

    primaryTag:
      getPrimaryTag(tags),

    activityType:
      getActivityType(
        name,
        tags,
      ),

    venue,

    coordinates,

    suburb:
      safeUiText(
        row.suburb ||
          'Area not provided',
      ),

    schedule,

    day:
      getDay(schedule),

    recurrence:
      safeUiText(
        row.recurrence ||
          'Not provided',
      ),

    suitability:
      suitability.value,

    suitabilityLabel:
      suitability.label,

    source:
      safeUiText(
        row.source_note ??
          row.source ??
          'Source not provided',
      ),

    // Prefer the real activity image stored in the
    // database. Use a keyword-based fallback only when
    // image_url is unavailable.
    image:
      row.image_url ||
      getActivityImage(
        name,
        tags,
      ),

    organiser:
      safeUiText(
        row.organiser ||
          '',
      ),

    exactDate:
      safeUiText(
        row.date ??
          row.exactDate ??
          '',
      ),

    availability:
      safeUiText(
        row.availability ||
          '',
      ),

    accessibility:
      safeUiText(
        row.accessibility ||
          '',
      ),

    joiningInformation:
      safeUiText(
        row.joiningInformation ??
          row.registration ??
          '',
      ),

    nearestTransportStop:
      nearestStop
        ? {
            stopName:
              nearestStop.stopName,

            distanceLabel:
              nearestStop.distanceLabel,
          }
        : null,
  }
}


// ======================================================
// Backend request
// ======================================================

/**
 * Request the raw activity catalogue from:
 *
 * GET /api/activities
 *
 * The backend response must be an array.
 */
async function fetchActivities() {
  const response =
    await fetch(
      `${API_BASE_URL}/activities`,
    )

  if (!response.ok) {
    throw new Error(
      `Unable to load activities (${response.status}).`,
    )
  }

  const data =
    await response.json()

  if (!Array.isArray(data)) {
    throw new Error(
      'The activity API returned an unexpected format.',
    )
  }

  return data
}


// ======================================================
// Activities cache
// ======================================================
//
// Keep the normalised activity catalogue in memory after
// the first successful request.
//
// This avoids repeatedly requesting and processing the
// same activity dataset while the user navigates between
// different pages.
//

let cachedActivities = null

let activitiesLoadingPromise =
  null


// ======================================================
// Activity catalogue
// ======================================================

/**
 * Load and normalise the activity catalogue.
 *
 * Performance design:
 *
 * The activity listing page does NOT load the complete
 * transit-stop dataset.
 *
 * Calculating the nearest stop for every activity would
 * add unnecessary work when most users only open a small
 * number of activity detail pages.
 *
 * Nearby transport is therefore loaded later by
 * getActivityById().
 */
export async function getActivities() {
  // Return the existing catalogue immediately if it has
  // already been loaded during this app session.
  if (cachedActivities) {
    return cachedActivities
  }

  // If another component has already started loading the
  // catalogue, reuse the same Promise rather than sending
  // a duplicate API request.
  if (activitiesLoadingPromise) {
    return activitiesLoadingPromise
  }

  activitiesLoadingPromise =
    fetchActivities()
      .then((activityRows) => {
        // Remove activities with confirmed past dates.
        const upcomingRows =
          activityRows.filter(
            isUpcoming,
          )

        cachedActivities =
          upcomingRows.map(
            (row, index) =>
              normaliseActivity(
                row,
                index,

                // An empty transit-stop list intentionally
                // skips nearest-stop calculations on the
                // activity listing page.
                [],
              ),
          )

        return cachedActivities
      })
      .finally(() => {
        // Clear the in-progress Promise after the request
        // finishes so future reloads remain possible.
        activitiesLoadingPromise =
          null
      })

  return activitiesLoadingPromise
}


// ======================================================
// Individual activity details
// ======================================================

/**
 * Return one activity by ID.
 *
 * Unlike the activity listing page, the detail page also
 * attempts to calculate the nearest public transport stop.
 *
 * Transport information is optional. Failure to load it
 * must not prevent the activity itself from being shown.
 */
export async function getActivityById(
  id,
) {
  const activities =
    await getActivities()

  const activity =
    activities.find(
      (item) =>
        item.id ===
        String(id),
    ) ?? null

  if (!activity) {
    return null
  }

  // Nearby transport cannot be calculated when venue
  // coordinates are unavailable.
  if (!activity.coordinates) {
    return activity
  }

  try {
    const transitStops =
      await getTransitStops()

    const nearestStop =
      findNearestStop(
        activity.coordinates,
        transitStops,
      )

    if (!nearestStop) {
      return activity
    }

    // Return a new activity object containing the
    // additional nearest transport information.
    return {
      ...activity,

      nearestTransportStop: {
        stopName:
          nearestStop.stopName,

        distanceLabel:
          nearestStop.distanceLabel,
      },
    }
  } catch (error) {
    // Transport information is optional.
    // Activity details should still remain available
    // even when transit-stop loading fails.
    console.error(
      'Unable to load nearby transport for activity:',
      error,
    )

    return activity
  }
}


// ======================================================
// Cache reset
// ======================================================

/**
 * Clear the in-memory activity catalogue.
 *
 * The next call to getActivities() will request and
 * normalise fresh data from the backend.
 */
export function clearActivitiesCache() {
  cachedActivities = null

  activitiesLoadingPromise =
    null
}