const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const sqlite3 = require('sqlite3').verbose()

const dbPath = path.join(__dirname, 'age-friendly.db')
const db = new sqlite3.Database(dbPath)

// CSV files live one level up, inside the main project's data/sample folder
const dataDir = path.join(__dirname, '..', 'data', 'sample')

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

async function run() {
  try {
    await importCSV(
      path.join(dataDir, 'EP1_sample_events_dataset.csv'),
      'activities',
      ['event_name', 'category_tags', 'venue', 'suburb', 'day_time', 'recurrence', 'senior_relevant', 'source_note']
    )

    await importCSV(
      path.join(dataDir, 'EP2_aged_care_services_sample.csv'),
      'services',
      ['service_name', 'provider_name', 'care_type', 'organisation_type', 'address', 'suburb', 'postcode', 'latitude', 'longitude', 'source_note']
    )

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