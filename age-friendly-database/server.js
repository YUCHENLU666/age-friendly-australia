require('dotenv').config()

const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const app = express()

const PORT = process.env.PORT || 3000

const DB_PATH = path.join(__dirname, 'age-friendly.db')

// =========================
// Middleware
// =========================

app.use(cors())
app.use(express.json())

// =========================
// SQLite connection
// =========================

const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READONLY,
  (error) => {
    if (error) {
      console.error('Failed to connect to SQLite database:')
      console.error(error.message)
      return
    }

    console.log('Connected to SQLite database.')
    console.log(`Database path: ${DB_PATH}`)
  },
)

// Helper function for SQLite queries
function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error)
        return
      }

      resolve(rows)
    })
  })
}

// =========================
// Health check
// =========================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Age-Friendly Australia backend is running.',
  })
})

// =========================
// Static database endpoints
// =========================

// GET /api/activities
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await queryAll(`
      SELECT
        id,
        event_name,
        category_tags,
        venue,
        suburb,
        day_time,
        recurrence,
        senior_relevant,
        source_note
      FROM activities
      ORDER BY id
    `)

    res.json(activities)
  } catch (error) {
    console.error('Activities database error:', error.message)

    res.status(500).json({
      error: 'Unable to retrieve activities.',
    })
  }
})

// GET /api/services
app.get('/api/services', async (req, res) => {
  try {
    const services = await queryAll(`
      SELECT
        id,
        service_name,
        provider_name,
        care_type,
        organisation_type,
        address,
        suburb,
        postcode,
        latitude,
        longitude,
        source_note
      FROM services
      ORDER BY id
    `)

    res.json(services)
  } catch (error) {
    console.error('Services database error:', error.message)

    res.status(500).json({
      error: 'Unable to retrieve services.',
    })
  }
})

// GET /api/transit-stops
app.get('/api/transit-stops', async (req, res) => {
  try {
    const stops = await queryAll(`
      SELECT
        stop_id,
        stop_name,
        latitude,
        longitude
      FROM transit_stops
      ORDER BY stop_id
    `)

    res.json(stops)
  } catch (error) {
    console.error('Transit stops database error:', error.message)

    res.status(500).json({
      error: 'Unable to retrieve transit stops.',
    })
  }
})

// =========================
// 404
// =========================

app.use((req, res) => {
  res.status(404).json({
    error: 'API endpoint not found.',
  })
})

// =========================
// Start server
// =========================

const server = app.listen(PORT, () => {
  console.log('----------------------------------------')
  console.log('Age-Friendly Australia backend started')
  console.log(`http://localhost:${PORT}`)
  console.log('----------------------------------------')
  console.log('Available endpoints:')
  console.log(`GET http://localhost:${PORT}/api/health`)
  console.log(`GET http://localhost:${PORT}/api/activities`)
  console.log(`GET http://localhost:${PORT}/api/services`)
  console.log(`GET http://localhost:${PORT}/api/transit-stops`)
})

// =========================
// Graceful shutdown
// =========================

function shutdown() {
  console.log('\nShutting down backend...')

  server.close(() => {
    db.close((error) => {
      if (error) {
        console.error(
          'Error closing database:',
          error.message,
        )
      } else {
        console.log('SQLite database connection closed.')
      }

      process.exit(0)
    })
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
