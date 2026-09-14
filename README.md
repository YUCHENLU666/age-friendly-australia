# Age-Friendly Australia - Iteration 2

**An accessible activity and aged-care service discovery platform for older adults in Greater Melbourne, enhanced with personalisation, AI-assisted recommendations and local environmental context.**

Iteration 2 extends the core discovery experience delivered in Iteration 1.

The current release allows users to browse activities and aged-care services, save useful items, configure optional preferences, view local weather and UV context, and receive AI-assisted activity recommendations based on their interests, preferred area and preferred days.

The Iteration 2 preview is also protected by an administrator login so the development version is not exposed to unrelated users.

---

## Iteration 2 Goal

> Help older adults discover suitable local activities and essential services more confidently by combining accessible information, optional personalisation, environmental context and AI-assisted recommendations.

Iteration 2 focuses on four major improvements:

1. Broader and more realistic activity data
2. Optional user preferences
3. AI-assisted personalised activity recommendations
4. Weather and UV context for activities

The existing Iteration 1 discovery, service, saved-item and accessibility features remain available.

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

The current imported snapshot contains approximately **176 filtered Greater Melbourne events**.

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

Users can continue to browse aged-care service information including:

- Service name
- Provider
- Care type
- Organisation type
- Address
- Suburb
- Postcode
- Location coordinates
- Source information

The service catalogue remains primarily focused on verified Australian aged-care service information.

The interface only displays source-provided information and does not fabricate missing service details.

---

## 4. Saved Items

Users can save useful activities and services and return to them later through the Saved page.

Saved identifiers are stored locally in the browser.

No account database is required for saved-item functionality.

---

# Personalisation

## 5. Preferences

Iteration 2 introduces an optional Preferences page.

Users can select:

- Preferred general area
- Interests
- Preferred days
- Preferred activity types
- Preferred text size

Preferences are stored locally in the browser using `localStorage`.

No exact home address, medical record, diagnosis or detailed location history is required.

The relevant frontend service is:

```text
src/services/preferencesService.js
```

The saved preferences can then be used by the AI recommendation system.

---

# AI Activity Recommendations

## 6. Personalised Recommendations

Iteration 2 introduces an AI-assisted recommendation system.

The recommendation workflow is:

```text
PreferencesView
      |
      | save preferences
      v
Browser localStorage
      |
      v
HomeView.vue
      |
      v
recommendationService.js
      |
      | POST /api/recommendations
      v
Express backend
      |
      v
AI recommendationService
      |
      v
Hugging Face embedding model
      |
      v
Rank future activities
      |
      v
Return Top 3 recommendations
      |
      v
Homepage recommendation cards
```

If no meaningful preferences have been saved, the homepage instead encourages the user to configure their preferences.

---

## Recommendation Inputs

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

---

## Recommendation Model

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
Activity text embedding
```

Activity embeddings are cached in memory after they are generated so repeated recommendation requests do not need to recompute unchanged activity embeddings.

The current homepage displays the **Top 3** ranked activities.

---

## Recommendation Result

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

The frontend then combines each recommended activity ID with the normalised activity data and displays the result as a homepage recommendation card.

---

# Environmental Context

## 7. Weather and UV Information

Iteration 2 introduces local environmental context for supported activity locations.

The current activity card can display:

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

The current visible weather component uses Open-Meteo data for supported Melbourne suburbs. 

---

## Environmental Data Pipeline

The repository also contains the Iteration 2 environmental data pipeline:

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

At the current frontend stage, the Activity weather card directly presents temperature, precipitation probability and UV.

The environmental pipeline can be extended further in later iterations to expose additional air-quality information in the user interface.

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

The goal is not simply to display information, but to reduce unnecessary complexity during activity and service discovery.

---

# Administrator Access

Iteration 2 includes an administrator login gate for the development preview.

The login page is available at:

```text
/login
```

The application stores the current preview login state in browser `localStorage`.

Protected application routes require the administrator login before they can be accessed.

This mechanism is intended as a development / demonstration access control layer and should **not** be treated as production-grade authentication.

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
              +--------------------+--------------------+
              |                    |                    |
              v                    v                    v
     activityService      preferenceService    recommendationService
              |                                         |
              | GET                                     | POST
              |                                         |
              v                                         v
                    +-------------------------+
                    |     Express Backend     |
                    +------------+------------+
                                 |
                    +------------+------------+
                    |                         |
                    v                         v
             SQLite Database         AI Recommendation
                    |                    Service
          +---------+---------+                |
          |         |         |                v
     activities  services  stops       Hugging Face
                                      Transformers
                                            |
                                            v
                                     ONNX MiniLM model
```

The frontend does not access SQLite directly.

Vue components communicate with frontend service modules, which communicate with the Express API.

The backend performs database queries and AI recommendation processing.

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
```

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
```

---

## Transit Stop Data

```text
Activity / Service UI
    |
    v
transitStopsService.js
    |
    | GET /api/transit-stops
    v
SQLite transit_stops
```

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
recommendationService.js
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
    |
    v
Top 3 activity recommendations
```

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

The backend package also uses native dependencies required by the AI and SQLite environment.

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

---

## 2. Install Backend Dependencies

Open the backend directory:

```bash
cd age-friendly-database
npm install
```

If npm reports that installation scripts for packages such as the following require approval:

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

On Windows PowerShell, if `npm.ps1` is blocked by the execution policy, use:

```powershell
npm.cmd install
```

and:

```powershell
npm.cmd start
```

instead.

---

# Start the Application

## Terminal 1 - Backend

```bash
cd age-friendly-database
npm start
```

or on PowerShell:

```powershell
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

---

## Terminal 2 - Frontend

From the project root:

```bash
npm run dev
```

or:

```powershell
npm.cmd run dev
```

Vite normally starts at:

```text
http://localhost:5173
```

The default frontend API base URL is:

```text
http://localhost:3000/api
```

---

# Environment Configuration

The frontend uses:

```text
VITE_API_BASE_URL
```

If this variable is not supplied, local development defaults to:

```text
http://localhost:3000/api
```

An example environment file is provided as:

```text
.env.example
```

---

# Production Build

Build the Vue frontend from the project root:

```bash
npm run build
```

This generates:

```text
dist/
```

The Express backend is configured to serve the compiled `dist` directory and supports Vue Router history fallback.

After a production build, the frontend and API can therefore be served through the same Express application.

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

The first semantic recommendation request may take longer because the embedding model must be initialised and activity embeddings may need to be generated.

Subsequent requests can reuse the in-memory activity embedding cache while the backend remains running.

---

# Iteration 2 Acceptance Summary

The Iteration 2 branch currently supports:

- Eventfinda-based Greater Melbourne activity data
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
- Recommendation explanations
- Local weather information
- Precipitation probability
- UV information
- Stored GTFS transit-stop support
- Administrator preview login
- Loading states
- Empty states
- Error states
- Responsive age-friendly layouts
- Vue production build served by Express

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

# Known Limitations

1. The Eventfinda activity dataset is a processed imported snapshot rather than a continuously live event feed.

2. Event information depends on the completeness and accuracy of the source data.

3. The aged-care catalogue remains focused on aged-care services rather than broad GP and healthcare coverage.

4. GTFS stop data is stored reference data rather than live public-transport vehicle information or a complete journey planner.

5. The current AI recommendation interface returns only the Top 3 activities.

6. The first semantic recommendation request may take longer while the embedding model and activity embeddings initialise.

7. Activity embeddings are cached only in backend memory and are recreated after the server restarts.

8. Weather and UV information currently relies on the generated Melbourne suburb environmental dataset rather than a live browser-side API request.

9. The environmental data pipeline contains EPA air-quality processing, but the current visible activity weather card primarily exposes temperature, precipitation probability and UV.

10. The administrator login is a development / demonstration access-control mechanism and is not production-grade authentication.

11. Preferences and saved items are currently device-local and are not synchronised between browsers or devices.

12. Scheduled source refreshes should not be assumed to run automatically in every deployment environment.

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

## Iteration 2

Iteration 2 extends the platform with:

```text
Eventfinda activity data
        +
Optional preferences
        +
AI personalised recommendations
        +
Weather and UV context
        +
Administrator preview access
```

## Future Work

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
- Automated production data refresh
- Crowd-level or off-peak suggestions

---

# Design Prototype

The broader high-fidelity prototype is available at:

https://kiwi-navy-66840758.figma.site

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