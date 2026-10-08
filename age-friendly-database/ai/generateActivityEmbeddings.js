// age-friendly-database/ai/generateActivityEmbeddings.js
// Make activity number lists before deployment and save them to JSON.
//
// How calls move:
// main -> loadActivities -> buildActivityText -> createEmbeddingsInBatches -> createTextHash -> write JSON -> closeDatabase.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   createTextHash - Make the same SHA-256 text check code used by the live AI service.
//   loadActivities - Read activity rows from SQLite in ID order.
//   closeDatabase - Close the SQLite connection and wait for it to finish.
//   main - Read activities, make their vectors, and write IDs, text check codes, and vectors to JSON.
//
// Fixed values and data:
//   DATABASE_PATH - Path to the SQLite database file used as input.
//   OUTPUT_PATH - Path to the activityEmbeddings.json file to write.
//
// Notes:
//   Run this file separately; homepage requests do not run it.
//   After names, descriptions, model, or activity IDs change, make matching vectors again.


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


// Path to the SQLite database file used as input.
const DATABASE_PATH =
  path.join(
    __dirname,
    '..',
    'age-friendly.db',
  )

// Path to the activityEmbeddings.json file to write.
const OUTPUT_PATH =
  path.join(
    __dirname,
    'activityEmbeddings.json',
  )


// Make the same SHA-256 text check code used by the live AI service.
// Example input: 'abc'
// Example result: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'.
function createTextHash(
  text,
) {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}


// Read activity rows from SQLite in ID order.
// Example input: database has activities with IDs 2 and 1
// Example result: Promise gives rows in order [1, 2].
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

// Close the SQLite connection and wait for it to finish.
// Example input: an open database connection
// Example result: Promise finishes after the connection closes; gives no value, or throws on error.
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


// Read activities, make their vectors, and write IDs, text check codes, and vectors to JSON.
// Example input: database has two activity rows
// Example result: writes activityEmbeddings.json with two items and model details; closes the database.
// Promise gives no value.
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


    // Use the shared text builder so saved and live text checks match.
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


    console.log(
      'Generating embeddings...',
    )

    // Make activity vectors in groups of 16.
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


    // Keep each activity ID with its text check code and vector.
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

    // Keep the model name, time, and activity vector items in one JSON object.
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


    // Write the JSON file that the live service will read at startup.
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