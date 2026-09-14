# Age-Friendly Australia - Iteration 2

**An accessible activity and aged-care service discovery platform for older adults in Greater Melbourne, enhanced with personalisation, AI-assisted recommendations, local environmental context and performance-aware deployment.**

Iteration 2 extends the core discovery experience delivered in Iteration 1.

The current release allows users to:

- Browse local activities
- Browse aged-care services
- Save useful activities and services
- Configure optional preferences
- View local weather and UV information
- Receive AI-assisted personalised activity recommendations
- Access nearby public transport information from detail pages
- Adjust global text size
- Use the platform through an age-friendly and responsive interface

The Iteration 2 preview also includes an administrator login gate so the development release is not exposed directly to unrelated users.

---

# Iteration 2 Goal

> Help older adults discover suitable local activities and essential services more confidently by combining accessible information, optional personalisation, environmental context and AI-assisted recommendations.

Iteration 2 focuses on five major improvements:

1. Broader and more realistic activity data
2. Optional user preferences
3. AI-assisted personalised activity recommendations
4. Weather and UV context for activities
5. Performance improvements for production deployment

The existing Iteration 1 activity discovery, service discovery, saved-item and accessibility functionality remains available.

---

# Key Features

## 1. Activity Discovery

Users can browse activities across Greater Melbourne and inspect information including:

- Activity name
- Category
- Venue
- Suburb
- Date and time
- Recurrence
- Description
- Older-adult relevance
- Free / paid information where available
- Latitude and longitude
- Restrictions
- Original event URL
- Source information

Activities can be searched and filtered through the Activities interface.

---

## 2. Eventfinda Activity Data Integration

Iteration 1 used a small manually prepared activity dataset.

Iteration 2 replaces that pilot dataset with a larger activity dataset collected from Eventfinda and processed before being imported into SQLite.

The current imported snapshot contains approximately:

```text
176 filtered Greater Melbourne activities
```

The Eventfinda processing pipeline includes:

```text
Eventfinda API
    |
    v
fetchAllEventfindaEvents.js
    |
    v
filterEventsByCategory.js
    |
    v
flagSuspiciousContent.js
    |
    v
refineReviewCategories.js
    |
    v
mergeFinalActivities.js
    |
    v
importData.js
    |
    v
SQLite activities table
```

Additional Iteration 2 activity fields include:

```text
description
is_free
latitude
longitude
restrictions
url
```

The previous manually prepared EP1 activity CSV is no longer used as the main activity source.

---

## 3. Aged-Care Service Discovery

Users can browse aged-care service information including:

- Service name
- Provider
- Care type
- Organisation type
- Address
- Suburb
- Postcode
- Location coordinates
- Source information

The service catalogue remains primarily focused on verified Australian aged-care information.

The interface only displays source-provided information and does not fabricate missing provider details.

---

## 4. Saved Items

Users can save useful activities and services and return to them later through the Saved page.

Saved identifiers are stored locally in the browser.

No account database is required for saved-item functionality.

---

# Personalisation

## 5. Preferences

Iteration 2 introduces an optional Preferences page.

Users can configure:

- Preferred general area
- Interests
- Preferred days
- Preferred activity types
- Preferred text size

Preferences are stored locally using:

```text
localStorage
```

The platform does not require:

- Exact home address
- Medical records
- Diagnosis information
- Detailed location history

The relevant frontend service is:

```text
src/services/preferencesService.js
```

Saved preferences can then be used by the AI recommendation system.

---

# AI Activity Recommendations

## 6. Personalised Recommendations

Iteration 2 introduces an AI-assisted activity recommendation system.

The recommendation workflow is:

```text
PreferencesView.vue
        |
        | save preferences
        v
Browser localStorage
        |
        v
HomeView.vue
        |
        v
src/services/recommendationService.js
        |
        | POST /api/recommendations
        v
Express backend
        |
        v
ai/recommendationService.js
        |
        +-----------------------------+
        |                             |
        v                             v
Preference embedding          Precomputed activity
generated at runtime          embeddings
        |                             |
        |                             |
        +--------------+--------------+
                       |
                       v
               Cosine similarity
                       |
                       +
                area/day scoring
                       |
                       v
              Rank future activities
                       |
                       v
             Top 3 recommendations
                       |
                       v
          Homepage recommendation cards
```

If no meaningful preferences have been saved, the homepage instead encourages the user to configure their preferences.

---

# Recommendation Inputs

The backend currently accepts:

```json
{
  "generalArea": "Clayton",
  "interests": [
    "Arts",
    "Walking"
  ],
  "preferredDays": [
    "Saturday"
  ],
  "activityTypes": [
    "Social & cultural"
  ]
}
```

The recommendation system considers:

- Semantic relevance to selected interests
- Semantic relevance to selected activity types
- Exact preferred-area match
- Preferred-day match

Only upcoming activities are considered by the recommendation endpoint.

This means the number of activities used during recommendation may be lower than the total number stored in the database.

For example:

```text
176 total stored activities
        ↓
filter upcoming activities
        ↓
approximately 141 recommendation candidates
```

The exact number depends on the current date and activity schedule.

---

# Recommendation Model

Semantic similarity is generated using:

```text
onnx-community/all-MiniLM-L6-v2-ONNX
```

through:

```text
@huggingface/transformers
```

The current scoring model uses:

```text
Semantic relevance     70%
Preferred area match   15%
Preferred day match    15%
```

Weights are automatically normalised when only some preference types are provided.

The system uses cosine similarity between:

```text
User preference embedding
        and
Precomputed activity embedding
```

The current homepage displays the:

```text
Top 3
```

highest ranked activities.

---

# Precomputed Activity Embeddings

## Why Precomputation Is Used

The original Iteration 2 AI implementation generated embeddings for all candidate activities during the first recommendation request.

This worked well locally but was too resource-intensive for the production Render environment.

The previous runtime flow was:

```text
User opens homepage
        |
        v
POST /api/recommendations
        |
        v
Load MiniLM model
        |
        v
Generate embeddings for ~141 activities
        |
        v
Generate user preference embedding
        |
        v
Rank activities
```

On a low-resource production instance, this caused very slow recommendations and could cause the request to fail.

The optimised architecture generates activity embeddings locally before deployment.

---

## Current AI Performance Architecture

Activity embeddings are now generated using:

```text
age-friendly-database/ai/generateActivityEmbeddings.js
```

and saved into:

```text
age-friendly-database/ai/activityEmbeddings.json
```

The workflow is:

```text
Local development machine
        |
        v
SQLite activities
        |
        v
buildActivityText()
        |
        v
MiniLM embedding model
        |
        v
Generate activity embeddings
        |
        v
activityEmbeddings.json
        |
        v
Git repository
        |
        v
Render deployment
```

During a live recommendation request:

```text
User preferences
        |
        v
Generate ONE preference embedding
        |
        v
Load precomputed activity embeddings
        |
        v
Cosine similarity
        |
        +
Area match
        |
        +
Preferred day match
        |
        v
Top 3 recommendations
```

The production server therefore no longer needs to generate embeddings for the complete activity catalogue during each deployment session.

---

## Embedding Integrity Checking

Each precomputed activity embedding stores:

```text
activity ID
text hash
embedding vector
```

The text hash is generated using:

```text
SHA-256
```

The hash represents the semantic activity text used to generate the embedding.

This text currently includes:

```text
event_name
category_tags
description
```

Before using a stored embedding, the backend regenerates the activity text hash and compares it with the saved hash.

If the activity content has changed, the embedding is treated as stale and is not silently reused.

---

# Regenerating Activity Embeddings

Activity embeddings do **not** need to be regenerated every time the application starts.

They should be regenerated when the semantic activity content changes.

Examples include:

- Activity name changes
- Category tags change
- Activity description changes
- New activities are added
- Activities are removed
- A new Eventfinda dataset is imported

From the backend directory:

```bash
cd age-friendly-database
node ai/generateActivityEmbeddings.js
```

On Windows PowerShell:

```powershell
cd D:\research\FIT5120\age-friendly-australia\age-friendly-database
node ai/generateActivityEmbeddings.js
```

A successful run produces output similar to:

```text
Generating activity embeddings
Model: onnx-community/all-MiniLM-L6-v2-ONNX

Loaded 176 activities.
Activity text prepared.
Generating embeddings...

Embedded 16/176
Embedded 32/176
Embedded 48/176
Embedded 64/176
Embedded 80/176
Embedded 96/176
Embedded 112/176
Embedded 128/176
Embedded 144/176
Embedded 160/176
Embedded 176/176

Activity embeddings generated successfully.
Saved 176 embeddings.
```

The generated file is:

```text
age-friendly-database/ai/activityEmbeddings.json
```

After regeneration:

```bash
git add age-friendly-database/ai/activityEmbeddings.json
git commit -m "Refresh precomputed activity embeddings"
git push origin iteration-2
```

Changes only to fields such as:

```text
venue
suburb
day_time
latitude
longitude
url
```

do not normally require a new semantic embedding unless the semantic text also changes.

After a complete Eventfinda re-import, regenerating embeddings is recommended.

---

# Recommendation Result

The backend returns recommendation information similar to:

```json
{
  "recommendations": [
    {
      "activityId": "123",
      "score": 0.87,
      "reasons": [
        "Relevant to your selected interests",
        "Located in Clayton",
        "Available on Saturday"
      ],
      "breakdown": {
        "semanticScore": 0.82,
        "areaMatch": true,
        "dayMatch": true
      }
    }
  ]
}
```

The frontend combines the returned activity IDs with the normalised activity data and displays the Top 3 results as homepage recommendation cards.

The numerical recommendation score is used internally for ranking.

The current user interface focuses on:

- Recommended activity
- Activity information
- Human-readable recommendation reasons

rather than exposing the raw internal score as a percentage.

---

# Environmental Context

## 7. Weather and UV Information

Iteration 2 introduces local environmental context for supported activity locations.

The activity interface can display:

- Temperature
- Precipitation probability
- UV index

Weather data is currently read from:

```text
public/data/melbourne_suburb_weather.json
```

and rendered by:

```text
src/components/environment/WeatherCard.vue
```

The visible weather component uses Open-Meteo data for supported Melbourne suburbs.

---

# Environmental Data Pipeline

The repository contains the Iteration 2 environmental data pipeline:

```text
data_pipeline/
|- fetch_open_meteo.py
|- fetch_epa_air_quality.py
`- merge_environment_data.py
```

This supports collection and preparation of:

- Weather data
- UV information
- Environmental / air-quality data

At the current frontend stage, the Activity weather component primarily presents:

```text
Temperature
Precipitation probability
UV index
```

The environmental pipeline can be extended in later iterations to expose additional air-quality information.

---

# Transit Stop Integration

The project stores GTFS transit-stop reference data in SQLite.

The original frontend implementation downloaded approximately:

```text
4,994 transit stops
```

when opening the Activities or Services listing page.

It then calculated the nearest stop for every activity or service.

This resulted in a large amount of unnecessary browser-side computation.

---

## Optimised Transit Loading

Iteration 2 now uses lazy transit loading.

The current listing workflow is:

```text
Activities page
        |
        v
GET /api/activities
        |
        v
Display activities immediately
```

and:

```text
Services page
        |
        v
GET /api/services
        |
        v
Display services immediately
```

The complete transit-stop dataset is **not** required before rendering these listing pages.

Transit information is loaded only when an individual detail page requires it.

```text
Activity / Service detail page
        |
        | on demand
        v
transitStopsService.js
        |
        | GET /api/transit-stops
        v
SQLite transit_stops
        |
        v
Find nearest stop for selected item
```

This substantially reduces the initial workload of the Activities and Services pages.

---

# Frontend Data Caching

Activity and service catalogue results are cached in frontend memory during the current browser session.

This means navigation such as:

```text
Services
    ↓
Home
    ↓
Services
```

does not need to repeatedly request and normalise the same service catalogue.

The same optimisation applies to Activities.

Transit-stop data also has an in-memory cache after its first on-demand request.

These caches are browser-session runtime caches and are cleared when the application is reloaded.

---

# Accessibility and Age-Friendly Design

The application is designed around the needs of older adults.

Current interface considerations include:

- Large labelled controls
- Clear page hierarchy
- Strong visual separation
- Readable typography
- Adjustable global text size
- Simple navigation
- Clear loading states
- Clear empty states
- Clear error states
- Minimal personal-data requirements
- Responsive layouts
- Clear recommendation explanations
- Reduced unnecessary waiting on catalogue pages

The goal is not simply to display information, but to reduce unnecessary complexity during activity and service discovery.

---

# Administrator Access

Iteration 2 includes an administrator login gate for the development preview.

The login page is available at:

```text
/login
```

The current preview login state is stored in browser:

```text
localStorage
```

Protected application routes require the administrator login before they can be accessed.

This mechanism is intended as:

```text
development / demonstration access control
```

and should **not** be treated as production-grade authentication.

---

# Architecture

```text
                        +----------------------+
                        |      Vue 3 UI        |
                        |       Vite           |
                        +----------+-----------+
                                   |
                                   |
                    Frontend service modules
                                   |
            +----------------------+----------------------+
            |                      |                      |
            v                      v                      v
   activityService        serviceService       recommendationService
            |                      |                      |
            | GET                  | GET                  | POST
            |                      |                      |
            v                      v                      v
                   +---------------------------+
                   |      Express Backend      |
                   +-------------+-------------+
                                 |
                +----------------+----------------+
                |                                 |
                v                                 v
         SQLite Database                  AI Recommendation
                |                              Service
      +---------+---------+                       |
      |         |         |                       |
 activities  services  transit_stops              |
                                                  |
                        +-------------------------+------------------+
                        |                                            |
                        v                                            v
             Preference embedding                        Precomputed activity
             generated at runtime                        embeddings JSON
                        |                                            |
                        +----------------------+---------------------+
                                               |
                                               v
                                     Cosine similarity
                                               |
                                               v
                                      Top 3 recommendations
```

The frontend does not access SQLite directly.

Vue components communicate with frontend service modules, which communicate with the Express API.

The backend performs:

- SQLite queries
- Recommendation processing
- Preference embedding generation
- Production frontend hosting

---

# Runtime Data Flows

## Activity Data

```text
ActivitiesView.vue
    |
    v
activityService.js
    |
    | GET /api/activities
    v
server.js
    |
    v
SQLite activities
    |
    v
Frontend memory cache
```

Transit stops are not required before rendering the activity catalogue.

---

## Service Data

```text
ServicesView.vue
    |
    v
serviceService.js
    |
    | GET /api/services
    v
server.js
    |
    v
SQLite services
    |
    v
Frontend memory cache
```

Transit stops are not required before rendering the service catalogue.

---

## Transit Stop Data

```text
Activity / Service detail
        |
        v
transitStopsService.js
        |
        | GET /api/transit-stops
        v
SQLite transit_stops
        |
        v
Browser memory cache
        |
        v
Nearest-stop calculation
```

Transit-stop data is loaded lazily.

---

## Recommendation Data

```text
PreferencesView.vue
    |
    v
preferencesService.js
    |
    v
localStorage
    |
    v
HomeView.vue
    |
    v
frontend recommendationService.js
    |
    | POST /api/recommendations
    v
server.js
    |
    v
ai/recommendationService.js
    |
    +---- activityText.js
    |
    +---- embeddingService.js
    |         |
    |         `---- generates preference embedding
    |
    +---- activityEmbeddings.json
    |         |
    |         `---- precomputed activity embeddings
    |
    v
Cosine similarity
    |
    +
Area match
    |
    +
Preferred day match
    |
    v
Top 3 activity recommendations
```

Activity embeddings are generated offline using:

```text
generateActivityEmbeddings.js
```

and are reused by the deployed recommendation service.

---

## Weather Data

```text
Open-Meteo
    |
    v
data_pipeline/fetch_open_meteo.py
    |
    v
melbourne_suburb_weather.json
    |
    v
WeatherCard.vue
    |
    v
Activity UI
```

---

# Frontend Routes

| Route | Purpose |
| --- | --- |
| `/login` | Administrator login |
| `/` | Homepage and personalised recommendations |
| `/activities` | Browse and filter activities |
| `/activities/:id` | Activity details |
| `/services` | Browse aged-care services |
| `/services/:id` | Service details |
| `/saved` | Saved activities and services |
| `/preferences` | User preferences |

Unknown routes redirect to the homepage.

Except for `/login`, the current Iteration 2 preview routes are protected by the administrator login guard.

---

# Backend API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/activities` | Return activity records |
| `GET` | `/api/services` | Return aged-care service records |
| `GET` | `/api/transit-stops` | Return stored GTFS stop records |
| `POST` | `/api/recommendations` | Generate Top 3 personalised activity recommendations |

The backend also serves the compiled Vue frontend in production.

Unknown `/api/*` routes return a JSON `404` response.

---

# Key Source Files

```text
src/
|
|- components/
|  |
|  |- AppNavbar.vue
|  |
|  |- activities/
|  |  |- ActivityCard.vue
|  |  `- ActivityFilters.vue
|  |
|  |- environment/
|  |  `- WeatherCard.vue
|  |
|  `- services/
|     |- ServiceCard.vue
|     `- ServiceFilters.vue
|
|- router/
|  `- index.js
|
|- services/
|  |- activityService.js
|  |- distanceService.js
|  |- preferencesService.js
|  |- recommendationService.js
|  |- savedItemsService.js
|  |- serviceService.js
|  |- suburbCoordinates.js
|  |- textSizeService.js
|  |- transitStopsService.js
|  `- venueCoordinates.js
|
`- views/
   |- HomeView.vue
   |- LoginView.vue
   |- ActivitiesView.vue
   |- ActivityDetailView.vue
   |- ServicesView.vue
   |- ServiceDetailView.vue
   |- SavedView.vue
   `- PreferencesView.vue
```

Backend:

```text
age-friendly-database/
|
|- age-friendly.db
|- server.js
|- initDb.js
|- importData.js
|- addActivityColumns.js
|
|- fetchAllEventfindaEvents.js
|- filterEventsByCategory.js
|- flagSuspiciousContent.js
|- refineReviewCategories.js
|- mergeFinalActivities.js
|
|- syncAgedCareData.js
|- syncGtfsStops.js
|
`- ai/
   |- activityText.js
   |- embeddingService.js
   |- recommendationService.js
   |- generateActivityEmbeddings.js
   |- activityEmbeddings.json
   |
   `- test/
      |- baselineRecommendationService.js
      |- compareRecommendations.js
      |- evaluateRecommendations.js
      |- evaluationCases.json
      |- testDatabaseRecommendation.js
      |- testEmbedding.js
      `- testRecommendation.js
```

Environmental pipeline:

```text
data_pipeline/
|- fetch_open_meteo.py
|- fetch_epa_air_quality.py
`- merge_environment_data.py
```

---

# Technology Stack

## Frontend

- Vue 3
- Vue Router
- Vite
- JavaScript
- CSS
- Browser Local Storage

The current frontend package requires:

```text
Node.js ^22.18.0 or >=24.12.0
```

---

## Backend

- Node.js
- Express
- SQLite
- CORS
- dotenv
- csv-parser
- node-cron
- xlsx
- unzipper

AI dependencies include:

```text
@huggingface/transformers
onnxruntime-node
```

The backend package also uses native dependencies required by SQLite and the AI runtime.

---

# Run Locally

## Requirements

Install:

```text
Node.js ^22.18.0 or >=24.12.0
npm
```

Clone the repository and switch to:

```bash
git checkout iteration-2
```

---

## 1. Install Frontend Dependencies

From the project root:

```bash
npm install
```

On Windows PowerShell:

```powershell
npm.cmd install
```

---

## 2. Install Backend Dependencies

Open the backend directory:

```bash
cd age-friendly-database
npm install
```

If npm reports that installation scripts require approval for packages such as:

```text
sqlite3
onnxruntime-node
sharp
protobufjs
```

approve them with:

```bash
npm approve-scripts sqlite3 onnxruntime-node sharp protobufjs
npm install
```

On Windows PowerShell:

```powershell
npm.cmd approve-scripts sqlite3 onnxruntime-node sharp protobufjs
npm.cmd install
```

---

# Start the Application

## Terminal 1 - Backend

```bash
cd age-friendly-database
npm start
```

PowerShell:

```powershell
cd age-friendly-database
npm.cmd start
```

The backend starts at:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

A successful startup with precomputed embeddings should include:

```text
Loaded 176 precomputed activity embeddings.
Age-Friendly Australia started
Connected to SQLite database.
```

---

## Terminal 2 - Frontend

From the project root:

```bash
npm run dev
```

PowerShell:

```powershell
npm.cmd run dev
```

Vite normally starts at:

```text
http://localhost:5173
```

The default local frontend API URL is:

```text
http://localhost:3000/api
```

---

# Environment Configuration

The frontend uses:

```text
VITE_API_BASE_URL
```

For local development, the default is:

```text
http://localhost:3000/api
```

For the current Render production deployment:

```text
VITE_API_BASE_URL=/api
```

This allows the frontend and Express backend to use the same Render origin.

---

# Production Build

Build the Vue frontend from the project root:

```bash
npm run build
```

PowerShell:

```powershell
npm.cmd run build
```

This generates:

```text
dist/
```

The Express backend is configured to serve the compiled `dist` directory and supports Vue Router history fallback.

Therefore the same Render Web Service can provide:

```text
Vue frontend
+
Express API
+
SQLite
+
AI recommendation service
```

---

# Render Deployment

The current Iteration 2 production service is deployed from:

```text
Branch:
iteration-2
```

The current Render service name is:

```text
age-friendly-australia-i2-api
```

Primary deployment URL:

```text
https://age-friendly-australia-i2-api.onrender.com
```

---

## Render Build Command

The production build currently uses:

```bash
npm ci && npm run build && cd age-friendly-database && npm ci && npm rebuild sqlite3 --build-from-source
```

The SQLite rebuild is required because the prebuilt `sqlite3` native binary can be incompatible with the Render Linux GLIBC environment.

Rebuilding SQLite inside Render ensures the native module is compiled against the deployment environment.

---

## Render Start Command

```bash
cd age-friendly-database && npm start
```

---

## Render Environment Variables

```text
VITE_API_BASE_URL=/api
NODE_VERSION=24.18.0
```

Render provides the runtime `PORT` automatically.

The backend uses:

```text
process.env.PORT
```

and therefore does not require a manually configured production port.

---

## Render Health Check

Health Check Path:

```text
/api/health
```

---

# Testing the Recommendation API

Example request:

```json
{
  "generalArea": "Clayton",
  "interests": [
    "Arts",
    "Walking"
  ],
  "preferredDays": [
    "Saturday"
  ],
  "activityTypes": [
    "Social & cultural"
  ]
}
```

PowerShell example:

```powershell
$body = @{
    generalArea = "Clayton"

    interests = @(
        "Arts",
        "Walking"
    )

    preferredDays = @(
        "Saturday"
    )

    activityTypes = @(
        "Social & cultural"
    )
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3000/api/recommendations" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

The deployed recommendation endpoint uses precomputed activity embeddings.

When semantic preferences are supplied, the backend only needs to:

```text
Initialise MiniLM if necessary
        ↓
Generate ONE user preference embedding
        ↓
Read precomputed activity embeddings
        ↓
Calculate cosine similarity
        ↓
Apply area/day scores
        ↓
Return Top 3
```

A successful backend log should include:

```text
Loaded 176 precomputed activity embeddings.
Generating preference embedding only.
Used precomputed embeddings for 141/141 candidate activities.
```

The number of candidate activities may be lower than the total database count because only upcoming activities are considered.

The backend should no longer display runtime activity batch-generation logs such as:

```text
Embedded 16/141
Embedded 32/141
...
```

during normal recommendation requests.

---

# Iteration 2 Acceptance Summary

The current Iteration 2 branch supports:

- Eventfinda-based Greater Melbourne activity data
- Approximately 176 imported activities
- Searchable and filterable activity discovery
- Activity detail pages
- Aged-care service discovery
- Service detail pages
- Saved activities and services
- Global text-size preference
- Optional user preference settings
- Preferred general area
- Preferred interests
- Preferred days
- Preferred activity types
- AI-assisted activity recommendation
- Top 3 homepage recommendations
- Human-readable recommendation explanations
- Precomputed activity embeddings
- Semantic recommendation using MiniLM
- Local weather information
- Precipitation probability
- UV information
- Stored GTFS transit-stop support
- Lazy transit-stop loading
- Frontend activity caching
- Frontend service caching
- Administrator preview login
- Loading states
- Empty states
- Error states
- Responsive age-friendly layouts
- Vue production build served by Express
- Render deployment support

---

# Privacy Approach

The current personalisation system intentionally avoids collecting highly sensitive user information.

The application does not require:

- Exact home address
- Medical records
- Diagnosis information
- Detailed location history

Preference information is stored locally in the browser.

The recommendation API receives only the preference information required to rank activities.

---

# Performance Optimisations

Iteration 2 includes several performance changes introduced after deployment testing.

## Activity and Service Catalogue Optimisation

Previously:

```text
Open Activities / Services
        |
        v
Load catalogue
        +
Load ~4,994 transit stops
        |
        v
Calculate nearest stop for every record
        |
        v
Render page
```

Current implementation:

```text
Open Activities / Services
        |
        v
Load catalogue only
        |
        v
Render immediately
```

Transit stops are only loaded when needed by a detail page.

---

## Frontend Runtime Caching

The following datasets use frontend in-memory caching:

```text
activities
services
transit stops
```

This reduces repeated API calls during navigation in the same application session.

---

## AI Recommendation Optimisation

Previously:

```text
Render request
        |
        v
Generate embeddings for every candidate activity
        |
        v
Generate preference embedding
        |
        v
Rank
```

Current implementation:

```text
Local preprocessing
        |
        v
Generate activity embeddings once
        |
        v
activityEmbeddings.json
        |
        v
Render request
        |
        v
Generate only user preference embedding
        |
        v
Compare against precomputed embeddings
        |
        v
Top 3
```

This substantially reduces CPU and memory demand during deployed recommendation requests.

---

# Known Limitations

1. The Eventfinda activity dataset is a processed imported snapshot rather than a continuously live event feed.

2. Event information depends on the completeness and accuracy of the source data.

3. The aged-care catalogue remains focused on aged-care services rather than broad GP and healthcare coverage.

4. GTFS stop data is stored reference data rather than live public-transport vehicle information or a complete journey planner.

5. The current AI recommendation interface returns only the Top 3 activities.

6. The first semantic recommendation request after a server cold start may still take longer because the MiniLM model must be initialised before generating the user's preference embedding.

7. Activity embeddings are precomputed and stored in `activityEmbeddings.json`. They must be regenerated after relevant activity semantic content changes or after a new activity dataset is imported.

8. If an activity embedding hash no longer matches the current semantic activity text, that embedding is ignored until embeddings are regenerated.

9. Weather and UV information currently relies on a generated Melbourne suburb environmental dataset rather than a live browser-side API request.

10. The environmental data pipeline contains EPA air-quality processing, but the current visible activity weather card primarily exposes temperature, precipitation probability and UV.

11. The administrator login is a development / demonstration access-control mechanism and is not production-grade authentication.

12. Preferences and saved items are device-local and are not synchronised between browsers or devices.

13. Frontend in-memory caches are reset when the browser application is reloaded.

14. The Render free service may experience cold-start delays after inactivity.

15. Scheduled source refreshes should not be assumed to run automatically in every deployment environment.

---

# Iteration Progress

## Iteration 1

Iteration 1 established the core platform:

```text
Activity discovery
Service discovery
Filtering
Detail pages
Saved items
Text-size accessibility
Transit-stop context
```

---

## Iteration 2

Iteration 2 extends the platform with:

```text
Eventfinda activity data
        +
Optional preferences
        +
AI personalised recommendations
        +
Precomputed AI embeddings
        +
Weather and UV context
        +
Performance optimisation
        +
Administrator preview access
```

---

# Future Work

Possible later-iteration improvements include:

- Recently viewed items
- More environmental and air-quality presentation
- Broader GP and healthcare datasets
- Additional council activity sources
- More advanced accessibility information
- Production-grade authentication
- Server-side user preference accounts
- More recommendation controls
- Additional recommendation evaluation
- Automated Eventfinda refresh
- Automated embedding regeneration
- Automated production data refresh
- Crowd-level or off-peak suggestions
- Server-side nearest-transit-stop indexing
- Persistent recommendation caches
- Separate frontend and backend deployment if required at larger scale

---

# Design Prototype

The broader high-fidelity prototype is available at:

```text
https://kiwi-navy-66840758.figma.site
```

The prototype includes concepts across multiple iterations, so not every prototype concept is necessarily implemented in the current branch.

---

# Repository

Repository:

```text
https://github.com/YUCHENLU666/age-friendly-australia
```

Current development release:

```text
iteration-2
```

Current Iteration 2 Render deployment:

```text
https://age-friendly-australia-i2-api.onrender.com
```

---

# Current Iteration 2 Deployment Architecture

```text
GitHub
iteration-2 branch
        |
        v
Render Build
        |
        +---- npm ci
        |
        +---- npm run build
        |
        +---- backend npm ci
        |
        +---- rebuild sqlite3
        |
        v
Render Web Service
        |
        +---- Vue dist frontend
        |
        +---- Express API
        |
        +---- SQLite database
        |
        +---- Precomputed activity embeddings
        |
        +---- MiniLM preference embedding
        |
        v
Age-Friendly Australia Iteration 2
```

---

# Current Status

Iteration 2 currently provides a complete end-to-end prototype combining:

```text
Accessible activity discovery
+
Aged-care service discovery
+
Local environmental context
+
Optional personalisation
+
AI-assisted activity recommendations
+
Performance-aware deployment
```

The current implementation is intended as an academic project release and a foundation for further iteration rather than a production healthcare or transport system.