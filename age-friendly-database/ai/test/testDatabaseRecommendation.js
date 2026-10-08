// age-friendly-database/ai/test/testDatabaseRecommendation.js
// Print real database recommendations and compare two call times.
//
// How calls move:
// runTest -> loadFutureActivities -> recommendActivities twice -> timing and result table.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   loadFutureActivities - Read upcoming database activities using the current time, then close the
//   connection.
//   runTest - Run the same recommendation request twice and print times and results.
//
// Fixed values and data:
//   databasePath - Path to the SQLite file used by this test.
//
// Notes:
//   The first call may load the model; the second call can reuse it.
//   Printed times describe this run, not a promise of website speed.

const path = require('path')

const sqlite3 =
  require('sqlite3').verbose()

const {
  recommendActivities,
} = require(
  '../recommendationService',
)

// Path to the SQLite file used by this test.
const databasePath =
  path.join(
    __dirname,
    '..',
    '..',
    'age-friendly.db',
  )

// Read upcoming database activities using the current time, then close the connection.
// Example input: database has one past event and two future events
// Example result: Promise gives the two future rows; database connection is closed.
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

// Run the same recommendation request twice and print times and results.
// Example input: run this script with the built-in preferences
// Example result: prints first-call time, second-call time, and recommendation details; Promise gives no
// value.
async function runTest() {
  const activities =
    await loadFutureActivities()

  console.log(
    `Loaded ${activities.length} future activities`,
  )

  const preferences = {
    generalArea:
      'Melbourne CBD',

    interests: [
      'Jazz',
      'Live music',
    ],

    preferredDays: ['Saturday',],

    activityTypes: [
      'Live music',
    ],
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
