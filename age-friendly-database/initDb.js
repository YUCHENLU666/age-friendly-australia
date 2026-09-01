const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'age-friendly.db')
const db = new sqlite3.Database(dbPath)

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS activities`)
  db.run(`DROP TABLE IF EXISTS services`)
  db.run(`DROP TABLE IF EXISTS transit_stops`)

  db.run(`CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT,
    category_tags TEXT,
    venue TEXT,
    suburb TEXT,
    day_time TEXT,
    recurrence TEXT,
    senior_relevant TEXT,
    source_note TEXT
  )`)

  db.run(`CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT,
    provider_name TEXT,
    care_type TEXT,
    organisation_type TEXT,
    address TEXT,
    suburb TEXT,
    postcode TEXT,
    latitude REAL,
    longitude REAL,
    source_note TEXT
  )`)

  db.run(`CREATE TABLE transit_stops (
    stop_id TEXT PRIMARY KEY,
    stop_name TEXT,
    latitude REAL,
    longitude REAL
  )`)

  console.log('Database re-initialised with updated schema at:', dbPath)
})

db.close()