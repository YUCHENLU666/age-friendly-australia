// syncAgedCareData.js — FINAL VERSION
//
// Downloads the official VIC Aged Care Service List (XLSX) from
// gen-agedcaredata.gov.au, filters to the South-East Melbourne suburbs
// used elsewhere in the project (see suburbCoordinates.js), and syncs
// the result into the "services" table in age-friendly.db.
//
// Architecture: external open data source --> scheduled backend job -->
// local database --> frontend reads from DB (not from a static file).

const fs = require('fs')
const path = require('path')
const https = require('https')
const XLSX = require('xlsx')
const cron = require('node-cron')
const sqlite3 = require('sqlite3').verbose()

const AGED_CARE_XLSX_URL = 'https://www.gen-agedcaredata.gov.au/getmedia/800e8cd1-402b-41fb-849b-3065f9cae357/VIC-Service-List-2025'
const DOWNLOAD_PATH = path.join(__dirname, '..', 'data', 'sample', 'VIC_Service_List_2025.xlsx')
const DB_PATH = path.join(__dirname, 'age-friendly.db')

// Same South-East Melbourne suburb scope used in suburbCoordinates.js
// (compared case-insensitively, since the official file uses ALL CAPS)
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
const TARGET_SUBURBS_UPPER = new Set(TARGET_SUBURBS.map((s) => s.toUpperCase()))

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
    // drop empty/ghost rows
    .filter((row) => row['Service Name'] && row['Physical Suburb'])
    // keep only South-East Melbourne suburbs
    .filter((row) => TARGET_SUBURBS_UPPER.has(String(row['Physical Suburb']).toUpperCase().trim()))

  return rows
}

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

// Run once immediately on startup
runSync()

// Then re-run automatically once a day at 3:00 AM
cron.schedule('0 3 * * *', runSync)

console.log('Scheduled sync job started. Will re-run daily at 3:00 AM.')

module.exports = { runSync }