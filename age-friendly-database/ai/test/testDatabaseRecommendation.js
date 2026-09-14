const path = require('path')

const sqlite3 =
  require('sqlite3').verbose()

const {
  recommendActivities,
} = require(
  '../recommendationService',
)

const databasePath =
  path.join(
    __dirname,
    '..',
    '..',
    'age-friendly.db',
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

async function runTest() {
  const activities =
    await loadFutureActivities()

  console.log(
    `Loaded ${activities.length} future activities`,
  )

  const preferences = {
    generalArea:
      '',

    interests: [],

    preferredDays: ['Saturday',],

    activityTypes: [],
  }

  console.time(
  'First recommendation',
)

const recommendations =
  await recommendActivities(
    preferences,
    activities,
    3,
  )

console.timeEnd(
  'First recommendation',
)

console.time(
  'Second recommendation',
)

await recommendActivities(
  preferences,
  activities,
  3,
)

console.timeEnd(
  'Second recommendation',
)

console.table(
    recommendations.map(
      (
        recommendation,
        index,
      ) => ({
        rank: index + 1,

        activity:
          recommendation.activity
            .event_name,

        category:
          recommendation.activity
            .category_tags,

        suburb:
          recommendation.activity
            .suburb,

        date:
          recommendation.activity
            .day_time,

        semantic:
            recommendation.semanticScore.toFixed(
                4,
            ),

        areaMatch:
            recommendation.areaMatch,

        dayMatch:
            recommendation.dayMatch,

        score:
          recommendation.score.toFixed(
            4,
          ),
      }),
    ),
  )
}

runTest().catch(
  (error) => {
    console.error(
      'Database recommendation test failed:',
      error,
    )

    process.exit(1)
  },
)
