import csvText from '../../data/sample/EP1_sample_events_dataset.csv?raw'
import { parseCsv } from '@/utils/csvParser'

const USE_REMOTE_API =
  import.meta.env.VITE_USE_REMOTE_API === 'true'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000/api'
).replace(/\/$/, '')

/*
 * Clean imported text before displaying it in the UI.
 */
const blockedUiTerm = ['com', 'munity'].join('')

const blockedUiPattern = new RegExp(
  `\\b${blockedUiTerm}\\b`,
  'gi',
)

function safeUiText(value) {
  return String(value ?? '')
    .replace(blockedUiPattern, 'local')
    .trim()
}

/*
 * Convert tag strings such as:
 * "Health;Technology;Wellbeing"
 *
 * into:
 * ["Health", "Technology", "Wellbeing"]
 */
function normaliseTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => safeUiText(tag))
      .filter(Boolean)
  }

  return safeUiText(value)
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/*
 * Extract a simple preferred day from the
 * current schedule field.
 */
function getDay(schedule) {
  const value = schedule.toLowerCase()

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

/*
 * Convert the senior_relevant field into a
 * consistent frontend value and label.
 */
function getSuitability(value) {
  const normalised =
    safeUiText(value).toLowerCase()

  if (normalised === 'yes') {
    return {
      value: 'yes',
      label: 'Suitable for older adults',
    }
  }

  if (normalised === 'partially') {
    return {
      value: 'partial',
      label: 'May be suitable',
    }
  }

  if (normalised === 'no') {
    return {
      value: 'no',
      label: 'Not marked as suitable',
    }
  }

  return {
    value: 'unknown',
    label: 'Suitability not provided',
  }
}

/*
 * Pick a useful tag to display on top of
 * each activity image.
 */
function getPrimaryTag(tags) {
  const lessUsefulPrimaryTags = new Set([
    'PALS',
    'Adult',
    'Event Series',
  ])

  return (
    tags.find(
      (tag) =>
        !lessUsefulPrimaryTags.has(tag),
    ) ||
    tags[0] ||
    'Activity'
  )
}

/*
 * Produce a stable number from the
 * activity name.
 *
 * This is used to choose between multiple
 * images in the same activity category.
 */
function getStableImageIndex(name) {
  return name
    .split('')
    .reduce(
      (total, character) =>
        total +
        character.charCodeAt(0),
      0,
    )
}

/*
 * Select a relevant activity image.
 *
 * IMPORTANT:
 * Specific activity names are checked first.
 * Broader category tags are checked afterwards.
 *
 * This prevents a general tag from selecting
 * a less relevant image.
 */
function getActivityImage(name, tags) {
  const activityName =
    name.toLowerCase()

  const tagText = tags
    .join(' ')
    .toLowerCase()

  // =================================================
  // 1. SPECIFIC ACTIVITY NAME MATCHING
  // =================================================

  // Brain / wellbeing activities
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

  // Knitting / craft / weaving
  if (
    activityName.includes('knitting') ||
    activityName.includes('weaving') ||
    activityName.includes('upcycling')
  ) {
    return '/images/activity-craft.jpg'
  }

  // Walking / nature activities
  if (
    activityName.includes(
      'bushwalking',
    ) ||
    activityName.includes('bird')
  ) {
    return '/images/activity-walking.jpg'
  }

  // Technology / digital learning
  if (
    activityName.includes('digital') ||
    activityName.includes(
      'artificial intelligence',
    ) ||
    activityName.includes(
      'online security',
    ) ||
    activityName.includes('scam') ||
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

  // Language / conversation activities
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

  // General festivals
  if (
    activityName.includes('festival')
  ) {
    return '/images/activities.jpg'
  }

  // Information / support activities
  if (
    activityName.includes(
      'justice of the peace',
    )
  ) {
    return '/images/learning.jpg'
  }

  // =================================================
  // 2. CATEGORY / TAG MATCHING
  // =================================================

  // Technology
  if (
    tagText.includes('technology')
  ) {
    const imageIndex =
      getStableImageIndex(name)

    return imageIndex % 2 === 0
      ? '/images/activity-tech.jpg'
      : '/images/activity-tech-2.jpg'
  }

  // Health / wellbeing
  if (
    tagText.includes('health') ||
    tagText.includes('wellbeing')
  ) {
    return '/images/activity-health.jpg'
  }

  // Craft
  if (
    tagText.includes('craft')
  ) {
    return '/images/activity-craft.jpg'
  }

  // Environment / sustainability
  if (
    tagText.includes('environment') ||
    tagText.includes(
      'sustainability',
    )
  ) {
    return '/images/activity-walking.jpg'
  }

  // Learning / cultural
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

  // Social activities
  if (
    tagText.includes(
      'social connections',
    )
  ) {
    return '/images/activity-social.jpg'
  }

  // =================================================
  // 3. FALLBACK
  // =================================================

  return '/images/activities.jpg'
}

/*
 * Convert either the current CSV format
 * or a future API response into the same
 * frontend activity object.
 */
function normaliseActivity(row, index) {
  const tags = normaliseTags(
    row.category_tags ??
      row.tags ??
      row.category,
  )

  const schedule = safeUiText(
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

  const name = safeUiText(
    row.event_name ??
      row.name ??
      row.title ??
      'Untitled activity',
  )

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

    venue: safeUiText(
      row.venue ||
        'Venue not provided',
    ),

    suburb: safeUiText(
      row.suburb ||
        'Area not provided',
    ),

    schedule,

    day: getDay(schedule),

    recurrence: safeUiText(
      row.recurrence ||
        'Not provided',
    ),

    suitability:
      suitability.value,

    suitabilityLabel:
      suitability.label,

    source: safeUiText(
      row.source_note ??
        row.source ??
        'Source not provided',
    ),

    image: getActivityImage(
      name,
      tags,
    ),

    organiser: safeUiText(
      row.organiser || '',
    ),

    exactDate: safeUiText(
      row.date ??
        row.exactDate ??
        '',
    ),

    availability: safeUiText(
      row.availability || '',
    ),

    accessibility: safeUiText(
      row.accessibility || '',
    ),

    joiningInformation:
      safeUiText(
        row.joiningInformation ??
          row.registration ??
          '',
      ),
  }
}

/*
 * Current Iteration 1 data source:
 * local CSV sample dataset.
 */
async function getLocalActivities() {
  const rows = parseCsv(csvText)

  return rows.map(
    normaliseActivity,
  )
}

/*
 * Future data source:
 * backend API.
 */
async function getRemoteActivities() {
  const response = await fetch(
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

  return data.map(
    normaliseActivity,
  )
}

/*
 * Main function used by Vue pages.
 *
 * false:
 * CSV -> frontend
 *
 * true:
 * API -> frontend
 */
export async function getActivities() {
  if (USE_REMOTE_API) {
    return getRemoteActivities()
  }

  return getLocalActivities()
}

/*
 * Used by ActivityDetailView.vue.
 */
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