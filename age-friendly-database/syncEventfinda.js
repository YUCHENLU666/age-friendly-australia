// syncEventfinda.js
//
// Weekly automated refresh of the Eventfinda activity dataset.
// Mirrors the manual five-stage pipeline (fetch -> classify -> refine
// -> merge -> safety check), then imports ONLY the activities table
// (never touches services or transit_stops, unlike importData.js).
//
// Safety rules:
//  - If new/uncategorised categories appear, the run aborts and keeps
//    the previous day's data rather than guessing a classification.
//  - Flagged content is excluded unless its event ID is already on
//    the confirmed-safe whitelist (eventfinda_whitelist.json).

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const cron = require('node-cron')
const sqlite3 = require('sqlite3').verbose()

const DB_PATH = path.join(__dirname, 'age-friendly.db')
const WHITELIST_PATH = path.join(__dirname, 'eventfinda_whitelist.json')
const LOG_PATH = path.join(__dirname, 'eventfinda_sync.log')

// ======================================================
// Helpers
// ======================================================

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`
  console.log(line)
  fs.appendFileSync(LOG_PATH, line + '\n')
}

function runStep(scriptName) {
  log(`Running ${scriptName}...`)
  execFileSync('node', [scriptName], {
    cwd: __dirname,
    stdio: 'inherit',
  })
}

function readJson(fileName) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, fileName), 'utf-8'),
  )
}

function writeJson(fileName, data) {
  fs.writeFileSync(
    path.join(__dirname, fileName),
    JSON.stringify(data, null, 2),
  )
}

function loadWhitelist() {
  if (!fs.existsSync(WHITELIST_PATH)) {
    return new Set()
  }
  const ids = JSON.parse(fs.readFileSync(WHITELIST_PATH, 'utf-8'))
  return new Set(ids.map(String))
}

function extractSuburb(address) {
  if (!address) return null
  const parts = address.split(',').map((p) => p.trim())
  return parts.length >= 2 ? parts[parts.length - 2] : null
}

// ======================================================
// Step: filter out unconfirmed flagged content
// ======================================================

function excludeUnconfirmedFlagged() {
  const finalActivities = readJson('eventfinda_final_activities.json')
  const flagged = readJson('eventfinda_flagged_for_review.json')

  if (flagged.length === 0) {
    log('No flagged content this run.')
    return
  }

  const whitelist = loadWhitelist()
  const flaggedIds = new Set(flagged.map((e) => String(e.id)))

  const stillUnconfirmed = flagged.filter(
    (e) => !whitelist.has(String(e.id)),
  )

  if (stillUnconfirmed.length > 0) {
    log(
      `${stillUnconfirmed.length} flagged event(s) are NOT on the whitelist and will be excluded:`,
    )
    stillUnconfirmed.forEach((e) =>
      log(`  - [${e.id}] ${e.name}`),
    )
    log(
      'Review eventfinda_flagged_for_review.json and add confirmed false positives to eventfinda_whitelist.json.',
    )
  }

  const confirmedSafeIds = new Set(
    flagged
      .filter((e) => whitelist.has(String(e.id)))
      .map((e) => String(e.id)),
  )

  const filtered = finalActivities.filter((e) => {
    if (!flaggedIds.has(String(e.id))) return true
    return confirmedSafeIds.has(String(e.id))
  })

  writeJson('eventfinda_final_activities.json', filtered)

  log(
    `Removed ${finalActivities.length - filtered.length} unconfirmed flagged event(s) from the final list.`,
  )
}

// ======================================================
// Transactional import — ACTIVITIES ONLY
//
// Unlike importData.js, this never touches services or
// transit_stops. Wrapped in a transaction so a failure
// mid-import rolls back instead of leaving a half-written
// table.
// ======================================================

function importActivitiesOnly() {
  return new Promise((resolve, reject) => {
    const events = readJson('eventfinda_final_activities.json')
    const db = new sqlite3.Database(DB_PATH)

    db.serialize(() => {
      db.run('BEGIN TRANSACTION')

      db.run('DELETE FROM activities', (deleteError) => {
        if (deleteError) {
          db.run('ROLLBACK', () => db.close())
          reject(deleteError)
          return
        }

        const stmt = db.prepare(
          `INSERT INTO activities (
            event_name, category_tags, venue, suburb, day_time, recurrence,
            senior_relevant, source_note, description, is_free, latitude, longitude,
            restrictions, url, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )

        events.forEach((event) => {
          stmt.run([
            event.name,
            event.category,
            event.location_summary || null,
            extractSuburb(event.address),
            event.datetime_start,
            'One-off / check listing',
            1,
            `Eventfinda API — ${event.url || ''}`,
            event.description || null,
            event.is_free ? 1 : 0,
            event.lat || null,
            event.lng || null,
            event.restrictions || null,
            event.url || null,
            event.image_url || null,
          ])
        })

        stmt.finalize((finalizeError) => {
          if (finalizeError) {
            db.run('ROLLBACK', () => db.close())
            reject(finalizeError)
            return
          }

          db.run('COMMIT', (commitError) => {
            db.close()
            if (commitError) {
              reject(commitError)
              return
            }
            resolve(events.length)
          })
        })
      })
    })
  })
}

// ======================================================
// Main sync routine
// ======================================================

async function runSync() {
  const startTime = Date.now()
  log('========================================')
  log('Starting Eventfinda weekly sync...')

  try {
    runStep('fetchAllEventfindaEvents.js')
    runStep('filterEventsByCategory.js')

    const uncategorised = readJson('eventfinda_uncategorised.json')
    if (uncategorised.length > 0) {
      log(
        `ABORTING: ${uncategorised.length} uncategorised event(s) found. Manual review required before this run can proceed. Previous activities data has NOT been changed.`,
      )
      uncategorised.forEach((e) =>
        log(`  - [${e.category}] ${e.name}`),
      )
      return
    }

    runStep('refineReviewCategories.js')
    runStep('mergeFinalActivities.js')
    runStep('flagSuspiciousContent.js')

    excludeUnconfirmedFlagged()

    const importedCount = await importActivitiesOnly()
    log(`Imported ${importedCount} activities (transactional, activities table only).`)

    runStep('updateActivityImages.js')

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1)
    log(`Sync complete in ${durationSec}s.`)
  } catch (error) {
    log(`Sync FAILED: ${error.message}`)
  }
}

async function main() {
  await runSync()
  cron.schedule('0 3 * * 1', runSync)
  log('Scheduled sync job started. Will re-run weekly, Monday 3:00 AM.')
}

main()

module.exports = { runSync }