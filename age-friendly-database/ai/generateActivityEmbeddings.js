// ======================================================
// Pre-generate activity embeddings
// ======================================================
//
// Why this file exists:
//
// The Render Free instance has limited CPU and memory.
// Generating embeddings for every activity during a
// user's recommendation request is too expensive.
//
// Instead:
//
// 1. Run this script locally.
// 2. Read all activities from SQLite.
// 3. Convert each activity into the same text used by
//    the recommendation system.
// 4. Generate embeddings locally.
// 5. Save them into activityEmbeddings.json.
// 6. Commit the JSON file to Git.
//
// Render then only needs to generate ONE embedding for
// the user's preferences.
//
// ======================================================

const fs =
  require('fs')

const path =
  require('path')

const crypto =
  require('crypto')

const sqlite3 =
  require('sqlite3')
    .verbose()

const {
  buildActivityText,
} =
  require('./activityText')

const {
  MODEL_NAME,
  createEmbeddingsInBatches,
} =
  require('./embeddingService')

// ======================================================
// File paths
// ======================================================

const DATABASE_PATH =
  path.join(
    __dirname,
    '..',
    'age-friendly.db',
  )

const OUTPUT_PATH =
  path.join(
    __dirname,
    'activityEmbeddings.json',
  )

// ======================================================
// Create a stable hash for activity text
// ======================================================
//
// The hash allows recommendationService.js to check
// whether the stored embedding still belongs to the
// current activity text.
//
// If an activity name/category/description changes,
// the hash changes as well.
// ======================================================

function createTextHash(
  text,
) {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}

// ======================================================
// Read activities from SQLite
// ======================================================

function loadActivities(
  database,
) {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      database.all(
        `
          SELECT
            id,
            event_name,
            category_tags,
            description,
            venue,
            suburb,
            day_time,
            recurrence,
            is_free,
            latitude,
            longitude,
            restrictions,
            url
          FROM activities
          ORDER BY id
        `,
        [],
        (
          error,
          rows,
        ) => {
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

// ======================================================
// Close SQLite safely
// ======================================================

function closeDatabase(
  database,
) {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      database.close(
        (error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        },
      )
    },
  )
}

// ======================================================
// Main generation process
// ======================================================

async function main() {
  console.log(
    '----------------------------------------',
  )

  console.log(
    'Generating activity embeddings',
  )

  console.log(
    `Model: ${MODEL_NAME}`,
  )

  console.log(
    `Database: ${DATABASE_PATH}`,
  )

  console.log(
    '----------------------------------------',
  )

  const database =
    new sqlite3.Database(
      DATABASE_PATH,
      sqlite3.OPEN_READONLY,
    )

  try {
    // ------------------------------------
    // 1. Load activities
    // ------------------------------------

    const activities =
      await loadActivities(
        database,
      )

    console.log(
      `Loaded ${activities.length} activities.`,
    )

    if (
      activities.length === 0
    ) {
      throw new Error(
        'No activities were found in the database.',
      )
    }

    // ------------------------------------
    // 2. Build semantic text
    // ------------------------------------
    //
    // IMPORTANT:
    // This uses the same buildActivityText()
    // function as the live recommendation system.
    //

    const activityTexts =
      activities.map(
        (activity) =>
          buildActivityText(
            activity,
          ),
      )

    console.log(
      'Activity text prepared.',
    )

    // ------------------------------------
    // 3. Generate embeddings locally
    // ------------------------------------
    //
    // A batch size of 16 already works on the
    // developer machine and matches the existing
    // AI implementation.
    //

    console.log(
      'Generating embeddings...',
    )

    const embeddings =
      await createEmbeddingsInBatches(
        activityTexts,
        16,
      )

    if (
      embeddings.length !==
      activities.length
    ) {
      throw new Error(
        'The number of generated embeddings does not match the number of activities.',
      )
    }

    // ------------------------------------
    // 4. Build JSON output
    // ------------------------------------

    const items =
      activities.map(
        (
          activity,
          index,
        ) => {
          const text =
            activityTexts[index]

          return {
            id:
              String(
                activity.id,
              ),

            textHash:
              createTextHash(
                text,
              ),

            embedding:
              embeddings[index],
          }
        },
      )

    const output = {
      model:
        MODEL_NAME,

      generatedAt:
        new Date()
          .toISOString(),

      activityCount:
        items.length,

      items,
    }

    // ------------------------------------
    // 5. Save JSON
    // ------------------------------------

    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        output,
      ),
      'utf8',
    )

    console.log(
      '----------------------------------------',
    )

    console.log(
      'Activity embeddings generated successfully.',
    )

    console.log(
      `Saved ${items.length} embeddings.`,
    )

    console.log(
      `Output: ${OUTPUT_PATH}`,
    )

    console.log(
      '----------------------------------------',
    )
  } finally {
    await closeDatabase(
      database,
    )
  }
}

// ======================================================
// Run script
// ======================================================

main().catch(
  (error) => {
    console.error(
      'Failed to generate activity embeddings:',
    )

    console.error(
      error,
    )

    process.exit(1)
  },
)