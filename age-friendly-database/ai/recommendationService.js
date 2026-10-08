// age-friendly-database/ai/recommendationService.js
// Score activities and return the best matches for the user.
//
// How calls move:
// server POST callback -> recommendActivities -> optional preference embedding -> getPrecomputedEmbedding -> cosineSimilarity -> weighted ranking.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   normaliseText - Remove end spaces and use lowercase letters.
//   createTextHash - Make a SHA-256 check code for text; the same text gets the same code.
//   cosineSimilarity - Multiply matching vector numbers and add them; vectors should already have length 1.
//   getActivityDay - Read an activity date and return its weekday name.
//   hasSemanticPreferences - Check if interests or activity types have a choice, so AI text scoring is needed.
//   getPrecomputedEmbedding - Find the saved activity vector; check model name, activity ID, and text check
//   code.
//   recommendActivities - Score activities by text meaning, area, and day; return the top results.
//
// Fixed values and data:
//   precomputedData - Activity vectors and model details read from activityEmbeddings.json.
//   DAY_NAMES - Weekday names; index 0 is Sunday and index 1 is Monday.
//   precomputedEmbeddingMap - Map of activity ID to its saved text check code and vector.
//   precomputedModelMatches - True when the saved vectors use the same model as the current code.
//
// Notes:
//   With all choices present, weights are: text 0.70, area 0.15, day 0.15.
//   Missing choice parts have weight 0; divide by the sum of the weights in use.
//   Area and day add points; activities that do not match them can still appear.
//   There is no minimum score; even weak matches can be in the top results.
//   Missing or changed saved vectors add 0 text points; they are not rebuilt here.
//   Reasons use fixed sentences, not AI-written text. A score is not a chance that the activity suits the user.

const crypto =
  require('crypto')

// Activity vectors and model details read from activityEmbeddings.json.
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

// Weekday names; index 0 is Sunday and index 1 is Monday.
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]


// Remove end spaces and use lowercase letters.
// Example input: ' Clayton '
// Example result: 'clayton'; null gives ''.
function normaliseText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

// Make a SHA-256 check code for text; the same text gets the same code.
// Example input: 'abc'
// Example result: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'; changing the text
// changes the code.
function createTextHash(text) {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}

// Map of activity ID to its saved text check code and vector.
const precomputedEmbeddingMap =
  new Map()

// Build an ID map from the saved vector JSON.
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

// True when the saved vectors use the same model as the current code.
const precomputedModelMatches =
  precomputedData?.model ===
  MODEL_NAME

// Do not use saved vectors from a different model.
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

// Multiply matching vector numbers and add them; vectors should already have length 1.
// Example input: vectorA=[1,0], vectorB=[1,0]
// Example result: 1; [1,0] and [0,1] give 0; different list sizes give 0.
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


// Read an activity date and return its weekday name.
// Example input: '2026-10-08 10:00:00'
// Example result: 'Thursday'; 'bad date' gives ''.
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

// Check if interests or activity types have a choice, so AI text scoring is needed.
// Example input: {interests:['Music'], activityTypes:[]}
// Example result: true; both empty gives false.
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

// Find the saved activity vector; check model name, activity ID, and text check code.
// Example input: activity.id='7' and saved item uses the same model and text
// Example result: its embedding list; missing ID or changed text gives null.
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

  // Build the same activity text used when saving vectors.
  const currentText =
    buildActivityText(
      activity,
    )

  const currentHash =
    createTextHash(
      currentText,
    )

  // Changed text check code: do not use this saved vector.
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


// Score activities by text meaning, area, and day; return the top results.
// Example input: preferences={generalArea:'Clayton'}, activities=[{id:1,suburb:'Clayton'}, {id:2,suburb:'Box
// Hill'}], limit=1
// Example result: Promise gives activity 1 with score:1, areaMatch:true, and reason 'Located in Clayton'. No
// preferences gives [].
async function recommendActivities(
  preferences = {},
  activities = [],
  limit = 3,
) {

  if (
    !Array.isArray(
      activities,
    ) ||
    activities.length === 0
  ) {
    return []
  }


  // Use text scoring only when interests or activity types have choices.
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


  if (
    !useSemanticScore &&
    !useAreaScore &&
    !useDayScore
  ) {
    return []
  }


  // Text weight is 0.70 when used, otherwise 0.
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


  // Make at most one user vector for this request.
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


  let missingEmbeddingCount =
    0


  // Score the activities supplied by server.js.
  const results =
    activities.map(
      (activity) => {

        // Start text score at 0; keep 0 if no matching saved vector exists.
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


        // Compare area names after trimming and lowercasing.
        const areaMatch =
          useAreaScore &&
          normaliseText(
            activity.suburb,
          ) ===
            normaliseText(
              preferences.generalArea,
            )


        // Read the date to get a weekday for the day rule.
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


        // Add text score times its weight, plus area and day match points.
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

        // Divide by the total weight of the choice parts in use.
        const score =
          totalWeight > 0
            ? weightedScore /
              totalWeight
            : 0


        // Use fixed sentences to explain matches.
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


  // Sort from highest score to lowest, then take the first results.
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


module.exports = {
  cosineSimilarity,
  recommendActivities,
}