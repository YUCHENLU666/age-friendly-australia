const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'age-friendly.db')
const db = new sqlite3.Database(dbPath)

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT,
    venue TEXT,
    suburb TEXT,
    activity_type TEXT,
    suitability TEXT,
    latitude REAL,
    longitude REAL
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT,
    care_type TEXT,
    address TEXT,
    suburb TEXT,
    latitude REAL,
    longitude REAL
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS transit_stops (
    stop_id TEXT PRIMARY KEY,
    stop_name TEXT,
    latitude REAL,
    longitude REAL
  )`)

  console.log('Database initialised at:', dbPath)
})

db.close()