require('dotenv').config()

const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const {
  recommendActivities,
} = require('./ai/recommendationService')

const app = express()

const PORT = process.env.PORT || 3000

const DB_PATH = path.join(
  __dirname,
  'age-friendly.db',
)

const FRONTEND_DIST_PATH = path.join(
  __dirname,
  '..',
  'dist',
)

const FRONTEND_INDEX_PATH = path.join(
  FRONTEND_DIST_PATH,
  'index.html',
)

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
      console.error(
        'Failed to connect to SQLite database:',
      )
      console.error(error.message)
      return
    }

    console.log(
      'Connected to SQLite database.',
    )

    console.log(
      `Database path: ${DB_PATH}`,
    )
  },
)

// =========================
// SQLite helper
// =========================

function queryAll(
  sql,
  params = [],
) {
  return new Promise(
    (resolve, reject) => {
      db.all(
        sql,
        params,
        (error, rows) => {
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

// =========================
// Health check
// =========================

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      status: 'ok',
      message:
        'Age-Friendly Australia backend is running.',
    })
  },
)

// =========================
// Activities
// =========================

// GET /api/activities
app.get(
  '/api/activities',
  async (req, res) => {
    try {
      const activities =
        await queryAll(`
          SELECT
            id,
            event_name,
            category_tags,
            venue,
            suburb,
            day_time,
            recurrence,
            senior_relevant,
            source_note,
            description,
            is_free,
            latitude,
            longitude,
            restrictions,
            url
          FROM activities
          ORDER BY id
        `)

      res.json(activities)
    } catch (error) {
      console.error(
        'Activities database error:',
        error.message,
      )

      res.status(500).json({
        error:
          'Unable to retrieve activities.',
      })
    }
  },
)

// =========================
// Services
// =========================

// GET /api/services
app.get(
  '/api/services',
  async (req, res) => {
    try {
      const services =
        await queryAll(`
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
      console.error(
        'Services database error:',
        error.message,
      )

      res.status(500).json({
        error:
          'Unable to retrieve services.',
      })
    }
  },
)

// =========================
// Transit stops
// =========================

// GET /api/transit-stops
app.get(
  '/api/transit-stops',
  async (req, res) => {
    try {
      const stops =
        await queryAll(`
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
      console.error(
        'Transit stops database error:',
        error.message,
      )

      res.status(500).json({
        error:
          'Unable to retrieve transit stops.',
      })
    }
  },
)

// =========================
// AI recommendations
// =========================

// POST /api/recommendations
app.post(
  '/api/recommendations',
  async (req, res) => {
    try {
      const requestBody =
        req.body ?? {}

      const preferences = {
        generalArea:
          String(
            requestBody.generalArea ??
              '',
          ).trim(),

        interests:
          Array.isArray(
            requestBody.interests,
          )
            ? requestBody.interests
            : [],

        preferredDays:
          Array.isArray(
            requestBody.preferredDays,
          )
            ? requestBody.preferredDays
            : [],

        activityTypes:
          Array.isArray(
            requestBody.activityTypes,
          )
            ? requestBody.activityTypes
            : [],
      }

      const activities =
        await queryAll(`
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
          WHERE
            datetime(day_time) >=
            datetime('now')
          ORDER BY day_time
        `)

      const recommendations =
        await recommendActivities(
          preferences,
          activities,
          3,
        )

      res.json({
        recommendations:
          recommendations.map(
            (recommendation) => ({
              activityId:
                String(
                  recommendation
                    .activityId,
                ),

              score:
                Number(
                  recommendation
                    .score
                    .toFixed(4),
                ),

              reasons:
                recommendation
                  .reasons,

              breakdown: {
                semanticScore:
                  Number(
                    recommendation
                      .semanticScore
                      .toFixed(4),
                  ),

                areaMatch:
                  recommendation
                    .areaMatch,

                dayMatch:
                  recommendation
                    .dayMatch,
              },
            }),
          ),
      })
    } catch (error) {
      console.error(
        'Recommendation error:',
        error,
      )

      res.status(500).json({
        error:
          'Unable to generate recommendations.',
      })
    }
  },
)

// =========================
// Unknown API routes
// =========================

app.use(
  '/api',
  (req, res) => {
    res.status(404).json({
      error:
        'API endpoint not found.',
    })
  },
)

// =========================
// Vue production frontend
// =========================

app.use(
  express.static(
    FRONTEND_DIST_PATH,
  ),
)

// Vue Router history fallback
app.use(
  (req, res) => {
    if (req.method === 'GET') {
      res.sendFile(
        FRONTEND_INDEX_PATH,
      )

      return
    }

    res.status(404).json({
      error:
        'Route not found.',
    })
  },
)

// =========================
// Start server
// =========================

const server = app.listen(
  PORT,
  () => {
    console.log(
      '----------------------------------------',
    )

    console.log(
      'Age-Friendly Australia started',
    )

    console.log(
      `Application: http://localhost:${PORT}`,
    )

    console.log(
      '----------------------------------------',
    )

    console.log(
      'Available endpoints:',
    )

    console.log(
      `GET http://localhost:${PORT}/api/health`,
    )

    console.log(
      `GET http://localhost:${PORT}/api/activities`,
    )

    console.log(
      `GET http://localhost:${PORT}/api/services`,
    )

    console.log(
      `GET http://localhost:${PORT}/api/transit-stops`,
    )

    console.log(
      `POST http://localhost:${PORT}/api/recommendations`,
    )
  },
)

// =========================
// Graceful shutdown
// =========================

function shutdown() {
  console.log(
    '\nShutting down backend...',
  )

  server.close(() => {
    db.close((error) => {
      if (error) {
        console.error(
          'Error closing database:',
          error.message,
        )
      } else {
        console.log(
          'SQLite database connection closed.',
        )
      }

      process.exit(0)
    })
  })
}

process.on(
  'SIGINT',
  shutdown,
)

process.on(
  'SIGTERM',
  shutdown,
)