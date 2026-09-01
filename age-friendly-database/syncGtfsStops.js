// syncGtfsStops.js — FINAL VERSION
//
// Downloads the official GTFS Schedule zip from opendata.transport.vic.gov.au,
// extracts the Metro Bus mode (folder "4", identified via route_type=3 in routes.txt),
// filters stops.txt to the same South-East Melbourne bounding box used in the
// original 4,994-stop dataset, and syncs the result into transit_stops in age-friendly.db.

const fs = require('fs')
const path = require('path')
const https = require('https')
const unzipper = require('unzipper')
const csv = require('csv-parser')
const cron = require('node-cron')
const sqlite3 = require('sqlite3').verbose()

const GTFS_ZIP_URL = 'https://opendata.transport.vic.gov.au/dataset/3f4e292e-7f8a-4ffe-831f-1953be0fe448/resource/fb152201-859f-4882-9206-b768060b50ad/download/gtfs.zip'
const ZIP_PATH = path.join(__dirname, '..', 'data', 'sample', 'gtfs.zip')
const EXTRACT_DIR = path.join(__dirname, '..', 'data', 'sample', 'gtfs_extracted')
const BUS_FOLDER = '4' // confirmed via route_type breakdown: 539 bus routes (route_type "3")
const STOPS_TXT_TEMP = path.join(__dirname, '..', 'data', 'sample', 'gtfs_bus_stops_temp.txt')
const DB_PATH = path.join(__dirname, 'age-friendly.db')

// Same bounding box as the original gtfs_stops_southeast_melbourne.csv
const BOUNDS = {
  minLat: -38.0499477,
  maxLat: -37.80004621,
  minLon: 145.00009039,
  maxLon: 145.24999806,
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`))
        return
      }
      response.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', (err) => {
      fs.unlink(destPath, () => reject(err))
    })
  })
}

async function extractBusStopsToTempFile() {
  const innerZipPath = path.join(EXTRACT_DIR, BUS_FOLDER, 'google_transit.zip')
  const directory = await unzipper.Open.file(innerZipPath)
  const stopsFile = directory.files.find((f) => f.path === 'stops.txt')
  const buffer = await stopsFile.buffer()
  fs.writeFileSync(STOPS_TXT_TEMP, buffer)
}

function parseAndFilterStops() {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(STOPS_TXT_TEMP)
      .pipe(csv())
      .on('data', (row) => {
        const lat = parseFloat(row.stop_lat)
        const lon = parseFloat(row.stop_lon)
        if (
          lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat &&
          lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon
        ) {
          rows.push({
            stop_id: row.stop_id,
            stop_name: row.stop_name,
            latitude: lat,
            longitude: lon,
          })
        }
      })
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

function importIntoDb(rows) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH)

    db.serialize(() => {
      db.run('DELETE FROM transit_stops')

      const stmt = db.prepare(`
        INSERT INTO transit_stops (stop_id, stop_name, latitude, longitude)
        VALUES (?, ?, ?, ?)
      `)

      rows.forEach((row) => {
        stmt.run(row.stop_id, row.stop_name, row.latitude, row.longitude)
      })

      stmt.finalize((err) => {
        db.close()
        if (err) reject(err)
        else resolve(rows.length)
      })
    })
  })
}

async function runSync() {
  console.log(`[${new Date().toISOString()}] Starting GTFS Bus Stops sync...`)
  try {
    console.log('Downloading GTFS Schedule zip...')
    await downloadFile(GTFS_ZIP_URL, ZIP_PATH)

    console.log('Extracting full archive...')
    await fs.createReadStream(ZIP_PATH)
      .pipe(unzipper.Extract({ path: EXTRACT_DIR }))
      .promise()

    console.log('Extracting bus stops.txt...')
    await extractBusStopsToTempFile()

    console.log('Filtering to South-East Melbourne bounding box...')
    const rows = await parseAndFilterStops()

    console.log('Importing into database...')
    const count = await importIntoDb(rows)

    console.log(`[${new Date().toISOString()}] Sync complete. ${count} South-East Melbourne bus stops imported.`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Sync failed:`, err.message)
  }
}

// Run once immediately on startup
runSync()

// GTFS Schedule is published weekly, so re-sync weekly (Monday 3:00 AM)
cron.schedule('0 3 * * 1', runSync)

console.log('Scheduled sync job started. Will re-run weekly (Monday 3:00 AM).')

module.exports = { runSync }