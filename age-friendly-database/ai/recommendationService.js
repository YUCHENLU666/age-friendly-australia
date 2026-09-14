const crypto =
  require('crypto')

let activityEmbeddingCache = {
  key: null,
  promise: null,
}

const {
  buildActivityText,
  buildPreferenceText,
} = require(
  './activityText',
)

const {
  createEmbedding,
  createEmbeddingsInBatches,
} = require(
  './embeddingService',
)

function cosineSimilarity(
  vectorA,
  vectorB,
) {
  return vectorA.reduce(
    (
      total,
      value,
      index,
    ) =>
      total +
      value * vectorB[index],
    0,
  )
}
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function normaliseText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function getActivityDay(
  dateTime,
) {
  if (!dateTime) {
    return ''
  }

  const date =
    new Date(
      String(dateTime).replace(
        ' ',
        'T',
      ),
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ''
  }

  return DAY_NAMES[
    date.getDay()
  ]
}

function hasSemanticPreferences(
  preferences,
) {
  return Boolean(
    preferences.interests?.length ||
      preferences.activityTypes
        ?.length,
  )
}

function createActivitiesCacheKey(
  activities,
  activityTexts,
) {
  const cacheContent =
    activities.map(
      (
        activity,
        index,
      ) => ({
        id: activity.id,
        text:
          activityTexts[index],
      }),
    )

  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify(
        cacheContent,
      ),
    )
    .digest('hex')
}

async function getCachedActivityEmbeddings(
  activities,
  activityTexts,
) {
  const cacheKey =
    createActivitiesCacheKey(
      activities,
      activityTexts,
    )

  if (
    activityEmbeddingCache.key !==
      cacheKey ||
    !activityEmbeddingCache.promise
  ) {
    console.log(
      'Creating activity embedding cache',
    )

    activityEmbeddingCache = {
      key: cacheKey,

      promise:
        createEmbeddingsInBatches(
          activityTexts,
          16,
        ),
    }
  } else {
    console.log(
      'Using cached activity embeddings',
    )
  }

  return activityEmbeddingCache.promise
}

async function recommendActivities(
  preferences = {},
  activities = [],
  limit = 3,
) {
  if (
    !Array.isArray(activities) ||
    activities.length === 0
  ) {
    return []
  }

  const useSemanticScore =
    hasSemanticPreferences(
      preferences,
    )

  const useAreaScore =
    Boolean(
      normaliseText(
        preferences.generalArea,
      ),
    )

  const useDayScore =
    Array.isArray(
      preferences.preferredDays,
    ) &&
    preferences.preferredDays
      .length > 0

  // No recommendation preferences
  if (
    !useSemanticScore &&
    !useAreaScore &&
    !useDayScore
  ) {
    return []
  }

  const semanticWeight =
    useSemanticScore
      ? 0.7
      : 0

  const areaWeight =
    useAreaScore
      ? 0.15
      : 0

  const dayWeight =
    useDayScore
      ? 0.15
      : 0

  // Normalise weights when the user
  // selects only some preference types.
  const totalWeight =
    semanticWeight +
    areaWeight +
    dayWeight

  let preferenceEmbedding =
    null

  let activityEmbeddings =
    null

  if (useSemanticScore) {
    const preferenceText =
      buildPreferenceText(
        preferences,
      )

    const activityTexts =
      activities.map(
        buildActivityText,
      )

    preferenceEmbedding =
      await createEmbedding(
        preferenceText,
      )

    activityEmbeddings =
      await getCachedActivityEmbeddings(
        activities,
        activityTexts,
      )
  }

  return activities
    .map(
      (
        activity,
        index,
      ) => {
        const semanticScore =
          useSemanticScore
            ? cosineSimilarity(
                preferenceEmbedding,
                activityEmbeddings[
                  index
                ],
              )
            : 0

        const areaMatch =
          useAreaScore &&
          normaliseText(
            activity.suburb,
          ) ===
            normaliseText(
              preferences.generalArea,
            )

        const activityDay =
          getActivityDay(
            activity.day_time,
          )

        const dayMatch =
          useDayScore &&
          preferences.preferredDays.some(
            (preferredDay) =>
              normaliseText(
                preferredDay,
              ) ===
              normaliseText(
                activityDay,
              ),
          )

        const weightedScore =
          semanticScore *
            semanticWeight +
          (areaMatch
            ? areaWeight
            : 0) +
          (dayMatch
            ? dayWeight
            : 0)

        const score =
          weightedScore /
          totalWeight

        const reasons = []

        if (
          useSemanticScore &&
          semanticScore > 0
        ) {
          reasons.push(
            'Relevant to your selected interests',
          )
        }

        if (areaMatch) {
          reasons.push(
            `Located in ${activity.suburb}`,
          )
        }

        if (dayMatch) {
          reasons.push(
            `Available on ${activityDay}`,
          )
        }

        return {
          activityId:
            activity.id,

          activity,

          semanticScore,

          areaMatch,

          dayMatch,

          activityDay,

          score,

          reasons,
        }
      },
    )
    .sort(
      (a, b) =>
        b.score - a.score,
    )
    .slice(0, limit)
}

module.exports = {
  cosineSimilarity,
  recommendActivities,
}