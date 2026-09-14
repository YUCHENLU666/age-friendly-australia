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

const databasePath =
  path.join(
    __dirname,
    '..',
    '..',
    'age-friendly.db',
  )

const casesPath =
  path.join(
    __dirname,
    'evaluationCases.json',
  )

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
            datetime('now')
          ORDER BY day_time
        `,
        [],
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
