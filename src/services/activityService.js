//get the Coordinates by activity venue name
import { getVenueCoordinates } from './venueCoordinates'

import {
  findNearestStop, //find the nearest transit stop to the activity venue (by activity coordinates + all transit stops)
  getTransitStops, //get the data of all transit stops
} from '@/services/transitStopsService'

// decide where the frontend should visit the backend
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

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

// Normalize the backend tags into Array
//Data normalization
function normaliseTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) =>
        safeUiText(tag),
      )
      .filter(Boolean)//remove empty strings
  }

  return safeUiText(value)
    .split(';')
    .map((tag) =>
      tag.trim(),
    )
    .filter(Boolean)
}

// Normalize the date of the activity into a day of the week
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

  // If the schedule does not specify a day, return 'Flexible'
  return 'Flexible'
}

//Convert the older-adult suitability of the backend into standard value + UI label
function getSuitability(value) {
  const normalised =
    safeUiText(value)
      .toLowerCase()

  // value for Internal use, label for user
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

// Get the primary tag for an activity, ignoring less useful tags
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
    // if cant find any info return Activity as default
    'Activity'
  )
}

// use the keywords in the acitivity name and tags to determine the activity type for filtering and display
// we can update NLP classifier in iteration 2
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

//get a image for the activity by the length of the activity name
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

// use the keywords in the acitivity name and tags to determine the activity image for display
// we can update NLP classifier in iteration 2
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

//normalise the activity data from the backend into a standard format for the frontend
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

    // Prefer the real activity image from the database.
    // If image_url is empty, use the original fallback image.
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

/**
 * Load activities from the backend.
 *
 * GET /api/activities
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
// same activity dataset while navigating the app.
//
let cachedActivities = null
let activitiesLoadingPromise = null

/**
 * Load activities from the backend.
 *
 * IMPORTANT PERFORMANCE CHANGE:
 *
 * The Activities listing page no longer downloads all
 * transit stops or calculates the nearest stop for every
 * activity.
 *
 * Transit information is calculated only when the user
 * opens an individual activity detail page.
 */
export async function getActivities() {
  if (cachedActivities) {
    return cachedActivities
  }

  if (activitiesLoadingPromise) {
    return activitiesLoadingPromise
  }

  activitiesLoadingPromise =
    fetchActivities()
      .then((activityRows) => {
        cachedActivities =
          activityRows.map(
            (row, index) =>
              normaliseActivity(
                row,
                index,

                // Empty list intentionally prevents
                // nearest-stop calculation on the
                // activity listing page.
                [],
              ),
          )

        return cachedActivities
      })
      .finally(() => {
        activitiesLoadingPromise = null
      })

  return activitiesLoadingPromise
}

/**
 * Get one activity by ID.
 *
 * Nearby public transport is calculated only here rather
 * than for every activity in the catalogue.
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
    // Activity details should still be available if
    // transit-stop loading fails.
    console.error(
      'Unable to load nearby transport for activity:',
      error,
    )

    return activity
  }
}

/**
 * Clear the in-memory activity cache.
 */
export function clearActivitiesCache() {
  cachedActivities = null
  activitiesLoadingPromise = null
}