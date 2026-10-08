// age-friendly-database/ai/test/compareRecommendations.js
// Compare AI results with a simple method that uses fixed rules.
//
// How calls move:
// runEvaluation -> loadFutureActivities -> validateEvaluationCases -> AI/baseline rankings -> metrics and comparison.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   loadFutureActivities - Read activity rows at or after the fixed test date; do not change the database.
//   calculatePrecisionAtK - Count matched items in the first K results and divide by K.
//   calculateHitRateAtK - Return 1 if the first K results have any matched item; otherwise return 0.
//   calculateDcg - Give more points to strong matches near the top of the list.
//   calculateNdcgAtK - Compare this order with the best possible order using DCG.
//   average - Add all numbers and divide by the list size.
//   validateEvaluationCases - Check test IDs and match labels; throw an error for bad test data.
//   runEvaluation - Run the AI and the simple rule method on the same cases; print scores and times.
//
// Fixed values and data:
//   databasePath - Path to the SQLite file used by this test.
//   casesPath - Path to the JSON test cases and human match labels.
//   evaluationReferenceTime - Fixed test date, so results do not change just because time passes.
//
// Notes:
//   Human labels can be 0, 1, 2, or 3; 0 means no match and higher numbers mean a stronger match.
//   The AI and simple method have different rules and weights; a score difference is not only from AI vectors.

const fs = require('fs')
const path = require('path')
const {
  performance,
} = require('perf_hooks')

const sqlite3 =
  require('sqlite3').verbose()

const {
  recommendActivities,
} = require(
  '../recommendationService',
)

const {
  baselineRecommendActivities,
} = require(
  './baselineRecommendationService',
)

// Path to the SQLite file used by this test.
const databasePath =
  path.join(
    __dirname,
    '..',
    '..',
    'age-friendly.db',
  )

// Path to the JSON test cases and human match labels.
const casesPath =
  path.join(
    __dirname,
    'evaluationCases.json',
  )

// Fixed test date, so results do not change just because time passes.
const evaluationReferenceTime =
  '2026-10-06 00:00:00'

// Read activity rows at or after the fixed test date; do not change the database.
// Example input: fixed date='2026-10-06 00:00:00'; database has Oct 5 and Oct 7 events
// Example result: Promise gives only the Oct 7 event.
function loadFutureActivities() {
  return new Promise(
    (resolve, reject) => {
      const database =
        new sqlite3.Database(
          databasePath,
          sqlite3.OPEN_READONLY,
        )

      database.all(
        `
          SELECT
            id,
            event_name,
            category_tags,
            description,
            suburb,
            day_time,
            recurrence,
            restrictions,
            url
          FROM activities
          WHERE
            datetime(day_time) >=
            datetime(?)
          ORDER BY day_time
        `,
        [evaluationReferenceTime],
        (error, rows) => {
          database.close()

          if (error) {
            reject(error)
            return
          }

          resolve(rows)
        },
      )
    },
  )
}

// Count matched items in the first K results and divide by K.
// Example input: recommendedIds=['1','2','3'], relevanceMap=new Map([['1',2],['2',0],['3',1]]), k=3
// Example result: 2/3, about 0.667.
function calculatePrecisionAtK(
  recommendedIds,
  relevanceMap,
  k,
) {
  const relevantCount =
    recommendedIds
      .slice(0, k)
      .filter(
        (id) =>
          (
            relevanceMap.get(
              String(id),
            ) ?? 0
          ) > 0,
      )
      .length

  return relevantCount / k
}

// Return 1 if the first K results have any matched item; otherwise return 0.
// Example input: recommendedIds=['1','2'], relevanceMap=new Map([['1',0],['2',1]]), k=2
// Example result: 1; if both labels are 0, returns 0.
function calculateHitRateAtK(
  recommendedIds,
  relevanceMap,
  k,
) {
  const hasRelevantResult =
    recommendedIds
      .slice(0, k)
      .some(
        (id) =>
          (
            relevanceMap.get(
              String(id),
            ) ?? 0
          ) > 0,
      )

  return hasRelevantResult
    ? 1
    : 0
}

// Give more points to strong matches near the top of the list.
// Example input: relevanceScores=[2,0]
// Example result: 3; [0,2] gives about 1.893 because the strong match is lower.
function calculateDcg(
  relevanceScores,
) {
  return relevanceScores.reduce(
    (
      total,
      relevance,
      index,
    ) => {
      const gain =
        Math.pow(
          2,
          relevance,
        ) - 1

      const discount =
        Math.log2(
          index + 2,
        )

      return (
        total +
        gain / discount
      )
    },
    0,
  )
}

// Compare this order with the best possible order using DCG.
// Example input: recommendedIds=['1','2'], relevanceMap=new Map([['1',2],['2',0]]), k=2
// Example result: 1, the best order; ['2','1'] gives about 0.631.
function calculateNdcgAtK(
  recommendedIds,
  relevanceMap,
  k,
) {
  const predictedRelevance =
    recommendedIds
      .slice(0, k)
      .map(
        (id) =>
          relevanceMap.get(
            String(id),
          ) ?? 0,
      )

  const idealRelevance = [
    ...relevanceMap.values(),
  ]
    .sort(
      (a, b) =>
        b - a,
    )
    .slice(0, k)

  const dcg =
    calculateDcg(
      predictedRelevance,
    )

  const idealDcg =
    calculateDcg(
      idealRelevance,
    )

  if (idealDcg === 0) {
    return 0
  }

  return dcg / idealDcg
}

// Add all numbers and divide by the list size.
// Example input: [1,2,3]
// Example result: 2; [] gives 0.
function average(values) {
  if (values.length === 0) {
    return 0
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0,
    ) / values.length
  )
}

// Check test IDs and match labels; throw an error for bad test data.
// Example input: two cases with the same id
// Example result: throws a duplicate-case error; good cases with valid activity IDs pass and return no value.
function validateEvaluationCases(
  evaluationCases,
  activities,
) {
  const activityIds =
    new Set(
      activities.map(
        (activity) =>
          String(activity.id),
      ),
    )

  const missingIds =
    new Set()

  for (
    const evaluationCase
    of evaluationCases
  ) {
    const judgements =
      Array.isArray(
        evaluationCase.judgements,
      )
        ? evaluationCase.judgements
        : []

    if (
      !judgements.some(
        (judgement) =>
          judgement.relevance > 0,
      )
    ) {
      throw new Error(
        `Evaluation case ${evaluationCase.id} has no relevant activity.`,
      )
    }

    for (
      const judgement
      of judgements
    ) {
      if (
        !activityIds.has(
          String(
            judgement.activityId,
          ),
        )
      ) {
        missingIds.add(
          String(
            judgement.activityId,
          ),
        )
      }

      if (
        ![0, 1, 2, 3].includes(
          judgement.relevance,
        )
      ) {
        throw new Error(
          `Invalid relevance score in ${evaluationCase.id}.`,
        )
      }
    }
  }

  if (missingIds.size > 0) {
    throw new Error(
      `Evaluation judgements reference activities outside the labelled snapshot: ${[
        ...missingIds,
      ].join(', ')}`,
    )
  }
}

// Run the AI and the simple rule method on the same cases; print scores and times.
// Example input: valid test cases and a matching database
// Example result: prints each case and overall Precision, Hit Rate, NDCG, and time; Promise gives no value.
async function runEvaluation() {
  const activities =
    await loadFutureActivities()

  const evaluationCases =
    JSON.parse(
      fs.readFileSync(
        casesPath,
        'utf8',
      ),
    )

  validateEvaluationCases(
    evaluationCases,
    activities,
  )

  const results = []

  for (
    const evaluationCase
    of evaluationCases
  ) {
    const relevanceMap =
      new Map(
        evaluationCase
          .judgements
          .map(
            (judgement) => [
              String(
                judgement.activityId,
              ),
              judgement.relevance,
            ],
          ),
      )

    const startTime =
      performance.now()

    const recommendations =
      await recommendActivities(
        evaluationCase.preferences,
        activities,
        3,
      )

    const elapsedMilliseconds =
      performance.now() -
      startTime

    const recommendedIds =
      recommendations.map(
        (recommendation) =>
          String(
            recommendation
              .activityId,
          ),
      )

    const unjudgedAiIds =
      recommendedIds.filter(
        (activityId) =>
          !relevanceMap.has(
            activityId,
          ),
      )

    if (
      unjudgedAiIds.length > 0
    ) {
      console.log(
        `[UNJUDGED AI] ${evaluationCase.id}: ${unjudgedAiIds.join(', ')}`,
      )
    }
    
    const baselineStartTime =
      performance.now()

    const baselineRecommendations =
      baselineRecommendActivities(
        evaluationCase.preferences,
        activities,
        3,
      )

    const baselineMilliseconds =
      performance.now() -
      baselineStartTime

    const baselineIds =
      baselineRecommendations.map(
        (recommendation) =>
          String(
            recommendation
              .activityId,
          ),
      )

    const unjudgedBaselineIds =
  baselineIds.filter(
    (activityId) =>
      !relevanceMap.has(
        activityId,
      ),
  )

if (
  unjudgedBaselineIds.length >
  0
) {
  console.log(
    `[UNJUDGED] ${evaluationCase.id}: ${unjudgedBaselineIds.join(', ')}`,
  )
}

    const precisionAt3 =
      calculatePrecisionAtK(
        recommendedIds,
        relevanceMap,
        3,
      )

    const hitRateAt3 =
      calculateHitRateAtK(
        recommendedIds,
        relevanceMap,
        3,
      )

    const ndcgAt3 =
      calculateNdcgAtK(
        recommendedIds,
        relevanceMap,
        3,
      )

    const baselinePrecisionAt3 =
      calculatePrecisionAtK(
        baselineIds,
        relevanceMap,
        3,
      )

    const baselineHitRateAt3 =
      calculateHitRateAtK(
        baselineIds,
        relevanceMap,
        3,
      )

    const baselineNdcgAt3 =
      calculateNdcgAtK(
        baselineIds,
        relevanceMap,
        3,
      )

    results.push({
      caseId:
        evaluationCase.id,

      recommendedIds:
        recommendedIds.join(
          ', ',
        ),
      
      baselineIds:
        baselineIds.join(
          ', ',
        ),

      baselinePrecisionAt3,

      baselineHitRateAt3,

      baselineNdcgAt3,

      baselineMilliseconds,

      precisionAt3,

      hitRateAt3,

      ndcgAt3,

      milliseconds:
        elapsedMilliseconds,
    })
  }

  console.table(
  results.map(
    (result) => ({
      case:
        result.caseId,

      aiRecommendations:
        result.recommendedIds,

      baselineRecommendations:
        result.baselineIds,

      aiPrecision:
        result.precisionAt3
          .toFixed(3),

      baselinePrecision:
        result
          .baselinePrecisionAt3
          .toFixed(3),

      aiHitRate:
        result.hitRateAt3
          .toFixed(3),

      baselineHitRate:
        result
          .baselineHitRateAt3
          .toFixed(3),

      aiNdcg:
        result.ndcgAt3
          .toFixed(3),

      baselineNdcg:
        result
          .baselineNdcgAt3
          .toFixed(3),
    }),
  ),
)

  console.log(
    '\nAverage evaluation results',
  )

  console.log(
    'Precision@3:',
    average(
      results.map(
        (result) =>
          result.precisionAt3,
      ),
    ).toFixed(3),
  )

  console.log(
    'Hit Rate@3:',
    average(
      results.map(
        (result) =>
          result.hitRateAt3,
      ),
    ).toFixed(3),
  )

  console.log(
    'nDCG@3:',
    average(
      results.map(
        (result) =>
          result.ndcgAt3,
      ),
    ).toFixed(3),
  )

  console.log(
    'Average latency:',
    `${average(
      results.map(
        (result) =>
          result.milliseconds,
      ),
    ).toFixed(2)} ms`,
  )


console.log(
  '\nBaseline average results',
)

console.log(
  'Baseline Precision@3:',
  average(
    results.map(
      (result) =>
        result
          .baselinePrecisionAt3,
    ),
  ).toFixed(3),
)

console.log(
  'Baseline Hit Rate@3:',
  average(
    results.map(
      (result) =>
        result
          .baselineHitRateAt3,
    ),
  ).toFixed(3),
)

console.log(
  'Baseline nDCG@3:',
  average(
    results.map(
      (result) =>
        result
          .baselineNdcgAt3,
    ),
  ).toFixed(3),
)

console.log(
  'Baseline average latency:',
  `${average(
    results.map(
      (result) =>
        result
          .baselineMilliseconds,
    ),
  ).toFixed(2)} ms`,
)
}

runEvaluation().catch(
  (error) => {
    console.error(
      'Evaluation failed:',
      error,
    )

    process.exit(1)
  },
)
