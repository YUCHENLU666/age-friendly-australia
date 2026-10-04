const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

// ======================================================
// Paths
// ======================================================

const dbPath = path.join(
  __dirname,
  'age-friendly.db',
)

const eventsPath = path.join(
  __dirname,
  'eventfinda_final_activities.json',
)


// ======================================================
// Load Eventfinda activities
// ======================================================

const events = JSON.parse(
  fs.readFileSync(
    eventsPath,
    'utf-8',
  ),
)

console.log(
  `Loaded ${events.length} activities from eventfinda_final_activities.json`,
)


// ======================================================
// Normalise text for fallback matching
// ======================================================

function normaliseText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}


// ======================================================
// Build lookup maps
// ======================================================

// Best match:
// database url -> Eventfinda url

const eventByUrl = new Map()

// Fallback:
// database event_name -> Eventfinda name

const eventByName = new Map()

for (const event of events) {
  if (event.url) {
    eventByUrl.set(
      String(event.url).trim(),
      event,
    )
  }

  if (event.name) {
    eventByName.set(
      normaliseText(event.name),
      event,
    )
  }
}


// ======================================================
// Open database
// ======================================================

const db = new sqlite3.Database(
  dbPath,
  (error) => {
    if (error) {
      console.error(
        'Failed to open database:',
        error,
      )

      process.exit(1)
    }

    console.log(
      'Connected to database:',
      dbPath,
    )
  },
)


// ======================================================
// Read current activities
// ======================================================

db.all(
  `
    SELECT
      id,
      event_name,
      url,
      image_url
    FROM activities
    ORDER BY id
  `,
  [],
  (error, rows) => {
    if (error) {
      console.error(
        'Failed to read activities:',
        error,
      )

      db.close()
      return
    }

    console.log(
      `Found ${rows.length} existing activities in SQLite`,
    )

    let matchedByUrl = 0
    let matchedByName = 0
    let updated = 0
    let unmatched = 0
    let missingImage = 0

    const unmatchedActivities = []

    db.serialize(() => {
      db.run('BEGIN TRANSACTION')

      const updateStatement =
        db.prepare(
          `
            UPDATE activities
            SET image_url = ?
            WHERE id = ?
          `,
        )

      for (const activity of rows) {
        let event = null

        // ----------------------------------------------
        // 1. Prefer URL matching
        // ----------------------------------------------

        if (activity.url) {
          event = eventByUrl.get(
            String(
              activity.url,
            ).trim(),
          )

          if (event) {
            matchedByUrl += 1
          }
        }

        // ----------------------------------------------
        // 2. Fallback to activity name
        // ----------------------------------------------

        if (!event) {
          event = eventByName.get(
            normaliseText(
              activity.event_name,
            ),
          )

          if (event) {
            matchedByName += 1
          }
        }

        // ----------------------------------------------
        // 3. No matching Eventfinda event
        // ----------------------------------------------

        if (!event) {
          unmatched += 1

          unmatchedActivities.push({
            id: activity.id,
            event_name:
              activity.event_name,
          })

          continue
        }

        // ----------------------------------------------
        // 4. Matching event has no image
        // ----------------------------------------------

        if (!event.image_url) {
          missingImage += 1
          continue
        }

        // ----------------------------------------------
        // 5. Update ONLY image_url
        // ----------------------------------------------

        updateStatement.run(
          [
            event.image_url,
            activity.id,
          ],
          (updateError) => {
            if (updateError) {
              console.error(
                `Failed to update activity ${activity.id}:`,
                updateError,
              )
            }
          },
        )

        updated += 1
      }

      updateStatement.finalize(
        (finalizeError) => {
          if (finalizeError) {
            console.error(
              'Failed to finalize updates:',
              finalizeError,
            )

            db.run(
              'ROLLBACK',
              () => db.close(),
            )

            return
          }

          db.run(
            'COMMIT',
            (commitError) => {
              if (
                commitError
              ) {
                console.error(
                  'Failed to commit changes:',
                  commitError,
                )

                db.close()
                return
              }

              console.log(
                '\n========================================',
              )

              console.log(
                'Activity image update complete',
              )

              console.log(
                '========================================',
              )

              console.log(
                `Existing SQLite activities: ${rows.length}`,
              )

              console.log(
                `Matched by URL: ${matchedByUrl}`,
              )

              console.log(
                `Matched by name: ${matchedByName}`,
              )

              console.log(
                `Updated with image: ${updated}`,
              )

              console.log(
                `Matched but missing image: ${missingImage}`,
              )

              console.log(
                `Unmatched activities: ${unmatched}`,
              )

              if (
                unmatchedActivities.length >
                0
              ) {
                console.log(
                  '\nUnmatched activities:',
                )

                for (
                  const activity of
                    unmatchedActivities
                ) {
                  console.log(
                    `  [${activity.id}] ${activity.event_name}`,
                  )
                }
              }

              console.log(
                '\nNo activity IDs were changed.',
              )

              db.close(
                (closeError) => {
                  if (
                    closeError
                  ) {
                    console.error(
                      'Failed to close database:',
                      closeError,
                    )
                  } else {
                    console.log(
                      'Database closed successfully.',
                    )
                  }
                },
              )
            },
          )
        },
      )
    })
  },
)