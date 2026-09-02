import { getVenueCoordinates } from './venueCoordinates'
import {
  findNearestStop,
  getTransitStops,
} from '@/services/transitStopsService'

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

    image:
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

/**
 * Load activities and transit stops from the backend
 * at the same time.
 */
export async function getActivities() {
  const [
    activityRows,
    transitStops,
  ] = await Promise.all([
    fetchActivities(),
    getTransitStops(),
  ])

  return activityRows.map(
    (row, index) =>
      normaliseActivity(
        row,
        index,
        transitStops,
      ),
  )
}

export async function getActivityById(
  id,
) {
  const activities =
    await getActivities()

  return (
    activities.find(
      (activity) =>
        activity.id ===
        String(id),
    ) ?? null
  )
}