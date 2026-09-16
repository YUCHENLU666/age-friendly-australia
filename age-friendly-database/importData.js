const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const sqlite3 = require('sqlite3').verbose()

const dbPath = path.join(__dirname, 'age-friendly.db')
const db = new sqlite3.Database(dbPath)

const dataDir = path.join(__dirname, '..', 'data', 'sample')

function clearTable(tableName) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${tableName}`, (err) => {
      if (err) return reject(err)
      console.log(`Cleared table: ${tableName}`)
      resolve()
    })
  })
}

function importCSV(filePath, tableName, columns) {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        const placeholders = columns.map(() => '?').join(', ')
        const stmt = db.prepare(
          `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
        )
        rows.forEach((row) => {
          const values = columns.map((col) => row[col] ?? null)
          stmt.run(values)
        })
        stmt.finalize((err) => {
          if (err) return reject(err)
          console.log(`Imported ${rows.length} rows into ${tableName}`)
          resolve()
        })
      })
      .on('error', reject)
  })
}

function extractSuburb(address) {
  if (!address) return null
  const parts = address.split(',').map((p) => p.trim())
  return parts.length >= 2 ? parts[parts.length - 2] : null
}

async function importEventfindaActivities() {
  const eventsPath = path.join(__dirname, 'eventfinda_final_activities.json')
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'))

  await clearTable('activities')

  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT INTO activities (
        event_name, category_tags, venue, suburb, day_time, recurrence,
        senior_relevant, source_note, description, is_free, latitude, longitude,
        restrictions, url, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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

    stmt.finalize((err) => {
      if (err) return reject(err)
      console.log(`Imported ${events.length} rows into activities (from Eventfinda)`)
      resolve()
    })
  })
}

async function run() {
  try {
    await importEventfindaActivities()

    await clearTable('services')
    await importCSV(
      path.join(dataDir, 'EP2_aged_care_services_sample.csv'),
      'services',
      ['service_name', 'provider_name', 'care_type', 'organisation_type', 'address', 'suburb', 'postcode', 'latitude', 'longitude', 'source_note']
    )

    await clearTable('transit_stops')
    await importCSV(
      path.join(dataDir, 'gtfs_stops_southeast_melbourne.csv'),
      'transit_stops',
      ['stop_id', 'stop_name', 'latitude', 'longitude']
    )

    console.log('All data imported successfully.')
  } catch (err) {
    console.error('Import failed:', err)
  } finally {
    db.close()
  }
}

run()