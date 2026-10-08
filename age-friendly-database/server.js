// age-friendly-database/server.js
// Handle API requests, read SQLite, and serve the built website.
//
// How calls move:
// Frontend fetch -> matching anonymous Express route callback -> queryAll/recommendActivities/external service -> res.json.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   queryAll - Run a SQLite query and return its rows through a Promise.
//   shutdown - Stop the HTTP server, close the database, and exit the process.
//
// Fixed values and data:
//   app - Express app that handles requests and sends replies.
//   PORT - Server port from the environment, or 3000 if not set.
//   DB_PATH - Path to the SQLite database file.
//   FRONTEND_DIST_PATH - Path to the built website folder.
//   FRONTEND_INDEX_PATH - Path to the built website index.html file.
//   db - SQLite connection opened for reading only.
//   PTV_CACHE_DURATION_MS - Keep a successful bus reply for 30 seconds (30000 milliseconds).
//   ptvCache - Keep bus replies by route ID and limit, with the request time.
//   server - Running HTTP server; used when stopping the app.
//
// Page start and API handlers:
//   GET /api/health callback - Reply with a basic message that the backend is running.
//   GET /api/activities callback - Read activity rows with queryAll and send their JSON.
//   GET /api/services callback - Read service rows with queryAll and send their JSON.
//   GET /api/transit-stops callback - Read static stop IDs, names, and map points from SQLite.
//   POST /api/recommendations callback - Read the choices, find upcoming activities, and call
//   recommendActivities.
//   GET /api/realtime/community-venues callback - Call getCommunityVenues and send venues, or HTTP 502 on
//   failure.
//   GET /api/realtime/bus-positions callback - Reuse bus data less than 30 seconds old; otherwise call
//   getBusPositions.
//
// Notes:
//   API handlers are unnamed callback functions; look for the method and API path below.
//   Unknown /api paths return JSON 404; other GET paths return the Vue entry page.
//   Starting this server does not start the separate data-update scripts.

require('dotenv').config()

const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const {
  recommendActivities,
} = require('./ai/recommendationService')

const { getCommunityVenues } = require('./vicmapFoiService')
const { getBusPositions } = require('./ptvRealtimeService')

// Express app that handles requests and sends replies.
const app = express()

// Server port from the environment, or 3000 if not set.
const PORT = process.env.PORT || 3000

// Path to the SQLite database file.
const DB_PATH = path.join(
  __dirname,
  'age-friendly.db',
)

// Path to the built website folder.
const FRONTEND_DIST_PATH = path.join(
  __dirname,
  '..',
  'dist',
)

// Path to the built website index.html file.
const FRONTEND_INDEX_PATH = path.join(
  FRONTEND_DIST_PATH,
  'index.html',
)


app.use(cors())
app.use(express.json())


// SQLite connection opened for reading only.
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


// Run a SQLite query and return its rows through a Promise.
// Example input: sql='SELECT id FROM services WHERE id = ?', params=[7] with row 7 in database
// Example result: Promise gives [{id:7}]; SQL errors reject the Promise.
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


// GET /api/health
// Reply with a basic message that the backend is running.
// Example input: GET /api/health
// Example result: JSON {status:"ok", message:"Age-Friendly Australia backend is running."}.
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


// GET /api/activities
// Read activity rows with queryAll and send their JSON.
// Example input: GET /api/activities; database contains event ID 7
// Example result: JSON list of activity rows, including ID 7; database error gives HTTP 500.
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
            url,
            image_url
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


// GET /api/services
// Read service rows with queryAll and send their JSON.
// Example input: GET /api/services; database contains service ID 7
// Example result: JSON list of service rows, including ID 7; database error gives HTTP 500.
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


// GET /api/transit-stops
// Read static stop IDs, names, and map points from SQLite.
// Example input: GET /api/transit-stops; database contains stop S1
// Example result: JSON list with stop_id, stop_name, latitude, longitude; not live arrivals.
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


// POST /api/recommendations
// Read the choices, find upcoming activities, and call recommendActivities.
// Example input: POST /api/recommendations with {generalArea:"Clayton"}
// Example result: JSON {recommendations:[...]} with up to 3 future activities, scores, reasons, and breakdown;
// names come from the activity list.
app.post(
  '/api/recommendations',
  async (req, res) => {
    try {

      // Use the JSON choices received from the frontend.
      const requestBody =
        req.body ?? {}

      // Keep only the four supported activity-choice fields.
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

      // Score future activities and take up to 3 results.
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


// GET /api/realtime/community-venues
// Call getCommunityVenues and send venues, or HTTP 502 on failure.
// Example input: GET /api/realtime/community-venues?type=community%20venue&subtype=senior%20citizens&limit=10
// Example result: JSON list of up to 10 places; outside-API failure gives HTTP 502.
app.get(
  '/api/realtime/community-venues',
  async (req, res) => {
    try {
      const featureType =
        req.query.type || 'community venue'

      const featureSubtype =
        req.query.subtype || null

      const limit =
        Number.parseInt(req.query.limit, 10) || 50

      const venues = await getCommunityVenues(
        featureType,
        featureSubtype,
        limit,
      )

      res.json(venues)
    } catch (error) {
      console.error(
        'Vicmap API endpoint error:',
        error.message,
      )

      res.status(502).json({
        error: 'Unable to retrieve community venues.',
      })
    }
  },
)


// Keep a successful bus reply for 30 seconds (30000 milliseconds).
const PTV_CACHE_DURATION_MS = 30 * 1000

// Keep bus replies by route ID and limit, with the request time.
const ptvCache = new Map()

// GET /api/realtime/bus-positions
// Reuse bus data less than 30 seconds old; otherwise call getBusPositions.
// Example input: GET /api/realtime/bus-positions?routeId=R1&limit=10
// Example result: JSON list of up to 10 buses on feed route R1; same query within 30 seconds can reuse data.
app.get(
  '/api/realtime/bus-positions',
  async (req, res) => {
    try {
      const routeId = req.query.routeId || null

      const limit =
        Number.parseInt(req.query.limit, 10) || 50

      // Use route ID and limit together as the key for kept bus data.
      const cacheKey = `${routeId || 'all'}:${limit}`

      // Look for a previous bus reply with this key.
      const cached = ptvCache.get(cacheKey)

      const now = Date.now()

      if (
        cached &&
        now - cached.timestamp < PTV_CACHE_DURATION_MS
      ) {
        return res.json(cached.data)
      }

      // Fetch the PTV feed when no fresh reply is kept.
      const buses = await getBusPositions(
        routeId,
        limit,
      )

      // Keep this successful reply for the next request.
      ptvCache.set(cacheKey, {
        timestamp: now,
        data: buses,
      })

      res.json(buses)
    } catch (error) {
      console.error(
        'PTV realtime API endpoint error:',
        error.message,
      )

      res.status(502).json({
        error: 'Unable to retrieve live bus positions.',
      })
    }
  },
)


// No matching API path: reply with HTTP 404 JSON.
// Example input: GET /api/unknown
// Example result: HTTP 404 with an API endpoint not found error.
app.use(
  '/api',
  (req, res) => {
    res.status(404).json({
      error:
        'API endpoint not found.',
    })
  },
)


app.use(
  express.static(
    FRONTEND_DIST_PATH,
  ),
)

// Send index.html for other GET paths so Vue can show the requested page.
// Example input: GET /services/7 after a browser refresh
// Example result: sends index.html; Vue Router shows the service detail page.
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


// Running HTTP server; used when stopping the app.
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


// Stop the HTTP server, close the database, and exit the process.
// Example input: process receives SIGTERM and calls shutdown() with no arguments.
// Example result: stops new connections, closes SQLite, and exits; returns no result for a page.
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