// age-friendly-database/syncAgedCareData.js
// Update service database rows from the official VIC spreadsheet.
//
// How calls move:
// runSync -> downloadFile -> parseXlsx -> importIntoDb; run once immediately, then schedule daily at 03:00.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   downloadFile - Download the XLSX file and wait until it is saved locally.
//   parseXlsx - Read the first sheet and keep service rows in the chosen areas.
//   importIntoDb - Delete old service rows and insert the new rows.
//   runSync - Download, read, and import the service spreadsheet; log the count or error.
//
// Fixed values and data:
//   AGED_CARE_XLSX_URL - Address of the official VIC aged-care spreadsheet.
//   DOWNLOAD_PATH - Local path where the downloaded spreadsheet is saved.
//   DB_PATH - Path to the SQLite database file.
//   TARGET_SUBURBS - Melbourne area names allowed in this service import.
//   TARGET_SUBURBS_UPPER - Allowed area names in uppercase for easy text checks.
//
// Notes:
//   Run this file separately; starting server.js does not start it.
//   It runs once at startup, then daily at 03:00 in the runtime time zone.
//   Rows are deleted and inserted without one database transaction; IDs may change.


const fs = require('fs')
const path = require('path')
const https = require('https')
const XLSX = require('xlsx')
const cron = require('node-cron')
const sqlite3 = require('sqlite3').verbose()

// Address of the official VIC aged-care spreadsheet.
const AGED_CARE_XLSX_URL = 'https://www.gen-agedcaredata.gov.au/getmedia/800e8cd1-402b-41fb-849b-3065f9cae357/VIC-Service-List-2025'
// Local path where the downloaded spreadsheet is saved.
const DOWNLOAD_PATH = path.join(__dirname, '..', 'data', 'sample', 'VIC_Service_List_2025.xlsx')
// Path to the SQLite database file.
const DB_PATH = path.join(__dirname, 'age-friendly.db')

// Melbourne area names allowed in this service import.
const TARGET_SUBURBS = [
  'Ashwood', 'Bentleigh', 'Bentleigh East', 'Blackburn', 'Blackburn South',
  'Box Hill', 'Box Hill North', 'Braeside', 'Burwood', 'Burwood East',
  'Carnegie', 'Caulfield', 'Caulfield North', 'Caulfield South', 'Chadstone',
  'Chelsea', 'Cheltenham', 'Clarinda', 'Clayton', 'Clayton South',
  'Dandenong', 'Dandenong North', 'Elsternwick', 'Forest Hill', 'Glen Waverley',
  'Highett', 'Keysborough', 'Malvern', 'Malvern East', 'Mckinnon',
  'Mentone', 'Moorabbin', 'Mordialloc', 'Mount Waverley', 'Mulgrave',
  'Murrumbeena', 'Noble Park', 'Notting Hill', 'Nunawading', 'Oakleigh',
  'Oakleigh South', 'Ormond', 'Parkdale', 'Prahran', 'Springvale',
  'Springvale South', 'Surrey Hills', 'Vermont', 'Vermont South', 'Wheelers Hill',
]
// Allowed area names in uppercase for easy text checks.
const TARGET_SUBURBS_UPPER = new Set(TARGET_SUBURBS.map((s) => s.toUpperCase()))

// Download the XLSX file and wait until it is saved locally.
// Example input: valid XLSX URL and local file path
// Example result: Promise finishes after the file is saved; gives no value; bad HTTP status throws an error.
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

// Read the first sheet and keep service rows in the chosen areas.
// Example input: sheet has a valid Clayton service and a valid Sydney service
// Example result: keeps the Clayton row and leaves out Sydney; returns row objects.
function parseXlsx(filePath) {
  const workbook = XLSX.readFile(filePath)
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null })

  const headers = raw[2]
  const dataRows = raw.slice(3)

  const rows = dataRows
    .map((rowArr) => {
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = rowArr[i]
      })
      return obj
    })
    .filter((row) => row['Service Name'] && row['Physical Suburb'])
    .filter((row) => TARGET_SUBURBS_UPPER.has(String(row['Physical Suburb']).toUpperCase().trim()))

  return rows
}

// Delete old service rows and insert the new rows.
// Example input: two valid service row objects
// Example result: services table is replaced with two rows; Promise reports the count inserted.
function importIntoDb(rows) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH)

    db.serialize(() => {
      db.run('DELETE FROM services')

      const stmt = db.prepare(`
        INSERT INTO services
        (service_name, provider_name, care_type, organisation_type, address, suburb, postcode, latitude, longitude, source_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      rows.forEach((row) => {
        stmt.run(
          row['Service Name'],
          row['Provider Name'],
          row['Care Type'],
          row['Organisation Type'],
          row['Physical Address'],
          row['Physical Suburb'],
          row['Physical Post Code'],
          row['Latitude'],
          row['Longitude'],
          `Synced from data.gov.au (Aged Care Service List, VIC) on ${new Date().toISOString()}`
        )
      })

      stmt.finalize((err) => {
        db.close()
        if (err) reject(err)
        else resolve(rows.length)
      })
    })
  })
}

// Download, read, and import the service spreadsheet; log the count or error.
// Example input: run with a source file containing two valid target-area services
// Example result: downloads the file, replaces database rows, and logs success; Promise gives no value.
async function runSync() {
  console.log(`[${new Date().toISOString()}] Starting Aged Care data sync...`)
  try {
    await downloadFile(AGED_CARE_XLSX_URL, DOWNLOAD_PATH)
    const rows = parseXlsx(DOWNLOAD_PATH)
    const count = await importIntoDb(rows)
    console.log(`[${new Date().toISOString()}] Sync complete. ${count} South-East Melbourne records imported.`)
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Sync failed:`, err.message)
  }
}

runSync()

cron.schedule('0 3 * * *', runSync)

console.log('Scheduled sync job started. Will re-run daily at 3:00 AM.')

module.exports = { runSync }