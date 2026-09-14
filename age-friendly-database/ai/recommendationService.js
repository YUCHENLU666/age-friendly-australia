const crypto =
  require('crypto')

const precomputedData =
  require('./activityEmbeddings.json')

const {
  buildActivityText,
  buildPreferenceText,
} = require(
  './activityText',
)

const {
  MODEL_NAME,
  createEmbedding,
} = require(
  './embeddingService',
)

// ======================================================
// Day names
// ======================================================
//used to convert the getDay() to text, 0->Sunday, 1->Monday
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// ======================================================
// Normalise text
// ======================================================

function normaliseText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

// ======================================================
// Create activity text hash
// ======================================================
//
// This must use the same SHA-256 logic as
// generateActivityEmbeddings.js.
//
// It allows the live recommendation system to verify
// that a saved embedding still belongs to the current
// activity text.
//
// If an activity name/category/description changes,
// the stored embedding will no longer be trusted.
// ======================================================
//Check if the active vector has expired
function createTextHash(text) {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}

// ======================================================
// Prepare precomputed embeddings
// ======================================================
//
// activityEmbeddings.json is generated locally.
//
// Render no longer needs to generate embeddings for all
// activities during a user's request.
//
// Instead:
//
// activity ID
//      ↓
// precomputed embedding lookup
//      ↓
// cosine similarity with user preference embedding
//
// ======================================================
//Locate vectors directly using the event ID
const precomputedEmbeddingMap =
  new Map()

if (
  precomputedData &&
  Array.isArray(
    precomputedData.items,
  )
) {
  for (
    const item of
      precomputedData.items
  ) {
    if (
      item?.id &&
      Array.isArray(
        item.embedding,
      )
    ) {
      precomputedEmbeddingMap.set(
        String(item.id),
        item,
      )
    }
  }
}

// ======================================================
// Validate embedding model
// ======================================================
//
// The stored activity embeddings must use the same
// model as the user preference embedding.
//
// Otherwise cosine similarity would not be meaningful.
// ======================================================
//check the activity model and perference model is same,
//different model will give different vector, the number space is also different,Therefore, cosine similarity is meaningless
const precomputedModelMatches =
  precomputedData?.model ===
  MODEL_NAME

if (
  !precomputedModelMatches
) {
  console.warn(
    'Precomputed activity embedding model does not match the current model.',
  )

  console.warn(
    `Stored model: ${
      precomputedData?.model ||
      'unknown'
    }`,
  )

  console.warn(
    `Current model: ${MODEL_NAME}`,
  )
} else {
  console.log(
    `Loaded ${precomputedEmbeddingMap.size} precomputed activity embeddings.`,
  )
}

// ======================================================
// Cosine similarity
// ======================================================
//
// Both activity and preference embeddings are already
// normalised by embeddingService.js.
//
// Therefore their dot product is cosine similarity.
// ======================================================
// calculate the similarity
//vector A is user perference, vector B is activity
//Closer to 1 → more semantically similar
function cosineSimilarity(
  vectorA,
  vectorB,
) {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length !==
      vectorB.length
  ) {
    return 0
  }

  return vectorA.reduce(
    (
      total,
      value,
      index,
    ) =>
      total +
      value *
        vectorB[index],
    0,
  )
}

// ======================================================
// Determine activity weekday
// ======================================================

function getActivityDay(
  dateTime,
) {
  if (!dateTime) {
    return ''
  }

  const date =
    new Date(
      String(dateTime)
        .replace(
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

// ======================================================
// Check whether semantic AI ranking is needed
// ======================================================
//The AI ​​model is used only if the user has configured any of the following settings
function hasSemanticPreferences(
  preferences,
) {
  return Boolean(
    preferences.interests
      ?.length ||
      preferences.activityTypes
        ?.length,
  )
}

// ======================================================
// Get one precomputed activity embedding
// ======================================================
//
// Activity ID must match.
//
// Activity text hash must also match.
//
// This prevents stale embeddings from silently being
// used after activity data has changed.
// ======================================================
//check the model, activity id, Hash text, then return a vector of a activity
function getPrecomputedEmbedding(
  activity,
) {
  if (
    !precomputedModelMatches
  ) {
    return null
  }

  const item =
    precomputedEmbeddingMap.get(
      String(
        activity.id,
      ),
    )

  if (!item) {
    return null
  }

  const currentText =
    buildActivityText(
      activity,
    )

  const currentHash =
    createTextHash(
      currentText,
    )

  if (
    item.textHash !==
    currentHash
  ) {
    console.warn(
      `Ignoring stale embedding for activity ${activity.id}.`,
    )

    return null
  }

  return item.embedding
}

// ======================================================
// Recommend activities
// ======================================================

async function recommendActivities(
  preferences = {},
  activities = [],
  //return number
  limit = 3,
) {
  // ------------------------------------
  // Validate activity input
  // ------------------------------------

  if (
    !Array.isArray(
      activities,
    ) ||
    activities.length === 0
  ) {
    return []
  }

  // ------------------------------------
  // Determine which scoring dimensions
  // are currently available
  // ------------------------------------

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

  // ------------------------------------
  // No usable recommendation preferences
  // ------------------------------------

  if (
    !useSemanticScore &&
    !useAreaScore &&
    !useDayScore
  ) {
    return []
  }

  // ------------------------------------
  // Recommendation weights
  // ------------------------------------

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

  const totalWeight =
    semanticWeight +
    areaWeight +
    dayWeight

  // ====================================================
  // Generate ONLY the user's preference embedding
  // ====================================================
  //
  // OLD behaviour:
  //
  // preference embedding
  // +
  // 141 activity embeddings generated on Render
  //
  // NEW behaviour:
  //
  // preference embedding only
  // +
  // activity embeddings loaded from JSON
  //
  // This removes the expensive batch embedding process
  // from the Render request path.
  // ====================================================

  let preferenceEmbedding =
    null

  if (useSemanticScore) {
    const preferenceText =
      buildPreferenceText(
        preferences,
      )

    console.log(
      'Generating preference embedding only.',
    )

    preferenceEmbedding =
      await createEmbedding(
        preferenceText,
      )
  }

  // ------------------------------------
  // Track missing/stale embeddings
  // ------------------------------------

  let missingEmbeddingCount =
    0

  // ------------------------------------
  // Score every candidate activity
  // ------------------------------------

  const results =
    activities.map(
      (activity) => {
        // ================================
        // Semantic AI score
        // ================================

        let semanticScore =
          0

        if (
          useSemanticScore
        ) {
          const activityEmbedding =
            getPrecomputedEmbedding(
              activity,
            )

          if (
            activityEmbedding
          ) {
            semanticScore =
              cosineSimilarity(
                preferenceEmbedding,
                activityEmbedding,
              )
          } else {
            missingEmbeddingCount +=
              1
          }
        }

        // ================================
        // Area match
        // ================================

        const areaMatch =
          useAreaScore &&
          normaliseText(
            activity.suburb,
          ) ===
            normaliseText(
              preferences.generalArea,
            )

        // ================================
        // Day match
        // ================================

        const activityDay =
          getActivityDay(
            activity.day_time,
          )

        const dayMatch =
          useDayScore &&
          preferences
            .preferredDays
            .some(
              (
                preferredDay,
              ) =>
                normaliseText(
                  preferredDay,
                ) ===
                normaliseText(
                  activityDay,
                ),
            )

        // ================================
        // Weighted recommendation score
        // ================================

        const weightedScore =
          semanticScore *
            semanticWeight +
          (
            areaMatch
              ? areaWeight
              : 0
          ) +
          (
            dayMatch
              ? dayWeight
              : 0
          )

        const score =
          totalWeight > 0
            ? weightedScore /
              totalWeight
            : 0

        // ================================
        // Human-readable reasons
        // ================================

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

  // ------------------------------------
  // Diagnostic logging
  // ------------------------------------

  if (
    useSemanticScore
  ) {
    console.log(
      `Used precomputed embeddings for ${
        activities.length -
        missingEmbeddingCount
      }/${activities.length} candidate activities.`,
    )

    if (
      missingEmbeddingCount >
      0
    ) {
      console.warn(
        `${missingEmbeddingCount} activities did not have a matching precomputed embedding.`,
      )
    }
  }

  // ------------------------------------
  // Rank and return Top N
  // ------------------------------------

  return results
    .sort(
      (
        activityA,
        activityB,
      ) =>
        activityB.score -
        activityA.score,
    )
    .slice(
      0,
      limit,
    )
}

// ======================================================
// Exports
// ======================================================

module.exports = {
  cosineSimilarity,
  recommendActivities,
}