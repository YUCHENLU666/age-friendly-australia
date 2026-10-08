// src/services/activityService.js
// Load and clean activities for pages and preference choices.
//
// How calls move:
// getActivities -> fetchActivities -> isUpcoming -> normaliseActivity; HomeView joins the results with recommendation IDs.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   safeUiText - Turn a value into page text, replace 'community' with 'local', and remove end spaces.
//   normaliseTags - Turn tags into a list of non-empty page labels.
//   isUpcoming - Keep future dates; also keep non-empty schedules that cannot be read as dates.
//   getDay - Find a weekday word in schedule text; use Flexible if none is found.
//   getSuitability - Turn the older-adult label into a code and page text.
//   getPrimaryTag - Pick the first useful tag; use the first tag or Activity if needed.
//   getActivityType - Use words in the name and tags to choose an activity type.
//   getStableImageIndex - Add the number code of each letter to get a fixed image-choice number.
//   getActivityImage - Use name and tag words to choose a default image path.
//   normaliseActivity - Build the activity object used on the page and find its venue point.
//   fetchActivities - Request the activity list from the backend and check the reply.
//   getActivities - Load upcoming activities once, clean them, and keep the list for later calls.
//   getActivityById - Find one activity by ID and try to add its nearest stop.
//   clearActivitiesCache - Forget the kept activity list and request so it can be loaded again.
//
// Fixed values and data:
//   API_BASE_URL - Backend API address used by this file; remove the final slash if there is one.
//   blockedUiTerm - Word to replace in page text: community.
//   blockedUiPattern - Rule that finds the whole word community, ignoring upper/lowercase letters.
//
// Page values and kept data:
//   cachedActivities - Activity list kept in memory for later calls.
//   activitiesLoadingPromise - Activity request already running; other calls wait for the same result.
//
// Notes:
//   Activity type and default image choices use word rules, not AI.
//   getDay looks for weekday words; it does not turn an ISO date into a weekday.
//   Map points come from the old venue-name table, not the latitude/longitude fields in the API reply.

import { getVenueCoordinates } from './venueCoordinates'

import {
  findNearestStop,
  getTransitStops,
} from '@/services/transitStopsService'

// Backend API address used by this file; remove the final slash if there is one.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

// Word to replace in page text: community.
const blockedUiTerm = [
  'com',
  'munity',
].join('')

// Rule that finds the whole word community, ignoring upper/lowercase letters.
const blockedUiPattern =
  new RegExp(
    `\\b${blockedUiTerm}\\b`,
    'gi',
  )

// Turn a value into page text, replace 'community' with 'local', and remove end spaces.
// Example input: ' Community Walk '
// Example result: 'local Walk'.
function safeUiText(value) {
  return String(value ?? '')
    .replace(
      blockedUiPattern,
      'local',
    )
    .trim()
}

// Turn tags into a list of non-empty page labels.
// Example input: 'Music; Community; '
// Example result: ['Music', 'local'].
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

// Keep future dates; also keep non-empty schedules that cannot be read as dates.
// Example input: {day_time:'2099-01-01 10:00:00'} with current year 2026
// Example result: true; {day_time:''} gives false; {day_time:'Every Monday'} gives true.
function isUpcoming(row) {
  const raw = row.day_time ?? row.dayTime ?? row.schedule ?? ''
  const trimmed = raw.trim()

  if (!trimmed) {
    return false
  }

  const parsed = new Date(trimmed)
  const looksLikeDate = !Number.isNaN(parsed.getTime())

  if (looksLikeDate) {
    return parsed >= new Date()
  }

  return true
}

// Find a weekday word in schedule text; use Flexible if none is found.
// Example input: 'Every Monday at 10'
// Example result: 'Monday'; '2026-10-08 10:00:00' gives 'Flexible' because no weekday word appears.
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

// Turn the older-adult label into a code and page text.
// Example input: 'yes'
// Example result: {value:'yes', label:'Suitable for older adults'}; 'partially' gives value:'partial'.
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

// Pick the first useful tag; use the first tag or Activity if needed.
// Example input: ['PALS', 'Music']
// Example result: 'Music'; [] gives 'Activity'.
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

// Use words in the name and tags to choose an activity type.
// Example input: name='Knitting group', tags=[]
// Example result: 'Arts & crafts'; no matching words gives 'General activity'.
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

// Add the number code of each letter to get a fixed image-choice number.
// Example input: 'AB'
// Example result: 65 + 66 = 131; this function returns 131, not an image path.
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

// Use name and tag words to choose a default image path.
// Example input: name='Knitting group', tags=[]
// Example result: '/images/activity-craft.jpg'; the same name and tags get the same choice.
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

// Build the activity object used on the page and find its venue point.
// Example input: row={id:7, event_name:' Knitting group ', category_tags:'Craft', day_time:'Every Monday'},
// index=0, transitStops=[]
// Example result: object includes id:'7', name:'Knitting group', tags:['Craft'], day:'Monday',
// activityType:'Arts & crafts'.
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

  // Find the point from the old venue-name table, not API map fields.
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

// Request the activity list from the backend and check the reply.
// Example input: no arguments; API returns [{id:7, event_name:'Walk'}]
// Example result: Promise gives that original list; HTTP 500 throws an error.
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

// Activity list kept in memory for later calls.
let cachedActivities = null
// Activity request already running; other calls wait for the same result.
let activitiesLoadingPromise = null

// Load upcoming activities once, clean them, and keep the list for later calls.
// Example input: API has one past event and one future event
// Example result: Promise gives only the future event as a page object; next call reuses the list.
export async function getActivities() {
  // Reuse the activity list already loaded.
  if (cachedActivities) {
    return cachedActivities
  }

  // Wait for the activity request already running.
  if (activitiesLoadingPromise) {
    return activitiesLoadingPromise
  }

  activitiesLoadingPromise =
    fetchActivities()
      .then((activityRows) => {
        // Keep upcoming rows before building page objects.
        const upcomingRows =
          activityRows.filter(isUpcoming)

        cachedActivities =
          upcomingRows.map(
            (row, index) =>
              normaliseActivity(
                row,
                index,

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

// Find one activity by ID and try to add its nearest stop.
// Example input: id='7', list contains '7'
// Example result: Promise gives that activity; a missing ID gives null; stop-loading failure still returns the
// activity.
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
    console.error(
      'Unable to load nearby transport for activity:',
      error,
    )

    return activity
  }
}

// Forget the kept activity list and request so it can be loaded again.
// Example input: call after loading activities
// Example result: cachedActivities=null, activitiesLoadingPromise=null; returns no value.
export function clearActivitiesCache() {
  cachedActivities = null
  activitiesLoadingPromise = null
}