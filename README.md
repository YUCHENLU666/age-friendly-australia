# Age-Friendly Australia

**Age-Friendly Australia** is an age-friendly web platform designed to help older adults in Greater Melbourne discover local activities, explore useful services, plan future visits, view environmental conditions, and receive personalised activity recommendations.

The platform combines an accessible Vue interface with an Express and SQLite backend, AI-assisted recommendations, weather and air-quality information, public transport data, and local browser-based personalisation.

---

## Project Overview

Age-Friendly Australia aims to reduce the effort required for older adults to find relevant local information.

The current application supports:

- Activity discovery and filtering
- Aged-care and support service discovery
- Saved activities and services
- Personal planning through a calendar
- Activity-time weather and air-quality information
- AI-assisted activity recommendations
- Nearby public transport information
- Live Victorian community venue information
- Live PTV bus positions
- Local user preferences
- Adjustable text size and responsive age-friendly design

The project is primarily focused on **Greater Melbourne, Victoria, Australia**.

---

# Key Features

## 1. Activity Discovery

Users can browse local activities and inspect information such as:

- Activity name
- Category and interests
- Venue
- Suburb
- Date and time
- Recurrence
- Older-adult suitability
- Activity image
- Source information

The Activities page supports:

- Free-text search
- Area filtering
- Interest filtering
- Preferred-day filtering
- Schedule-type filtering
- Older-adult relevance filtering

Activity information is loaded through:

```text
ActivitiesView
      ↓
activityService
      ↓
GET /api/activities
      ↓
SQLite activities
```

Backend activity data is normalised before being used by Vue components so that the frontend receives a consistent activity structure.

---

## 2. Activity Weather and Air Quality

Each activity card can display environmental conditions for the **scheduled activity time**.

The weather card currently supports:

- Temperature
- Rain probability
- UV index
- UV category
- US Air Quality Index
- AQI category
- Overall outdoor-condition summary

The application intentionally matches environmental data to the activity hour rather than displaying unrelated current weather.

If the activity is outside the available forecast range, the interface explains that the forecast will become available closer to the activity date.

```text
ActivityCard
      ↓
suburb + activity time
      ↓
WeatherCard
      ↓
weatherService
      ↓
weatherConditions
      ↓
Temperature / Rain / UV / AQI
      ↓
Outdoor conditions summary
```

The weather service also uses a short in-memory cache so multiple activity cards can reuse the same downloaded weather dataset.

---

## 3. Automated Weather Refresh

Environmental data is refreshed automatically through GitHub Actions.

The workflow:

```text
.github/workflows/weather-refresh.yml
```

runs daily and:

1. Installs the Python pipeline dependencies
2. Runs weather pipeline tests
3. Fetches updated weather, UV and air-quality data
4. Updates the generated weather JSON
5. Records refresh status
6. Commits successful updates back to the repository

Generated files include:

```text
public/data/melbourne_suburb_weather.json
public/data/weather_refresh_status.json
```

The refresh process includes failure protection so an unsuccessful refresh does not automatically replace the last usable forecast.

---

## 4. Service Discovery

Users can browse service information including:

- Service name
- Provider
- Care type
- Organisation type
- Address
- Suburb
- Postcode
- Geographic coordinates
- Source information

Service data is retrieved through:

```text
ServicesView
      ↓
serviceService
      ↓
GET /api/services
      ↓
SQLite services
```

Individual service pages provide additional context without requiring the listing page to perform unnecessary transport calculations.

---

## 5. Saved Activities and Services

Activities and services can be saved for later use.

The application stores only item IDs in browser `localStorage`.

```text
Activity / Service
      ↓
Save
      ↓
savedItemsService
      ↓
localStorage
      ↓
SavedView / CalendarView
```

The current saved-item structure supports both:

```text
activityIds
serviceIds
```

The service also migrates activity saves created by an earlier version of the application.

No user account database is required for saved-item storage.

---

## 6. Personal Calendar

The Personal Calendar combines saved activities and planned service visits into one chronological planning view.

### Saved activities

Activities use their real scheduled activity date.

### Saved services

Services do not automatically have a personal visit date.

Users can choose their own:

```text
Day
Month
Year
```

and save the planned visit locally.

```text
Saved service
      ↓
Choose planned date
      ↓
calendarService
      ↓
localStorage
      ↓
CalendarView
```

Activities and planned service visits are then combined and sorted by date.

> The calendar is a personal planning feature only. Selecting a service date does **not** create or confirm a booking with the service provider.

---

## 7. AI-Assisted Activity Recommendations

The platform provides personalised activity recommendations based on optional user preferences.

Users can configure preferences such as:

- General area
- Interests
- Preferred days
- Activity types

The recommendation flow is:

```text
User preferences
      ↓
recommendationService
      ↓
POST /api/recommendations
      ↓
Express backend
      ↓
Preference embedding
      +
Precomputed activity embeddings
      ↓
Cosine similarity
      +
Area match
      +
Day match
      ↓
Rank upcoming activities
      ↓
Top recommendations
```

### Recommendation model

The project uses:

```text
onnx-community/all-MiniLM-L6-v2-ONNX
```

through:

```text
@huggingface/transformers
```

Activity embeddings are precomputed and stored in:

```text
age-friendly-database/ai/activityEmbeddings.json
```

This reduces production workload because the server does not need to regenerate embeddings for the complete activity catalogue during each recommendation request.

Each saved embedding is also associated with a SHA-256 text hash so stale embeddings can be rejected when semantic activity content changes.

### Current ranking dimensions

The recommendation system considers:

```text
Semantic relevance
Preferred area
Preferred day
```

Semantic relevance receives the largest weighting when semantic preferences are available.

Only upcoming activities are considered by the recommendation endpoint.

---

## 8. Nearby Public Transport

The project includes GTFS transit-stop reference data.

Transit information is loaded lazily.

Listing pages do **not** calculate the nearest transport stop for every activity or service.

Instead:

```text
Activity / Service detail page
      ↓
transitStopsService
      ↓
GET /api/transit-stops
      ↓
SQLite transit_stops
      ↓
Nearest-stop calculation
```

This reduces unnecessary work on the main listing pages.

---

## 9. Live Local Information

The application includes a dedicated:

```text
/live
```

page for current local information.

### Vicmap community venues

The backend queries the Victorian **Vicmap Features of Interest** service for community venues.

Users can view:

- Venue name
- Venue type
- Venue subtype
- Latitude
- Longitude
- Map location

### PTV live bus positions

The backend also retrieves live bus vehicle positions through the PTV GTFS-Realtime service.

The interface supports:

- Current bus positions
- Optional route filtering
- Vehicle coordinates
- Update timestamps

The backend uses a short cache for PTV responses to avoid unnecessary repeated external requests.

---

# Preferences and Local Personalisation

User preferences are stored in browser `localStorage`.

This keeps personalisation lightweight and avoids requiring unnecessary personal information.

The platform does not require users to provide:

- Exact home address
- Medical records
- Diagnosis information
- Detailed location history

Local preferences are used to improve activity recommendations and the overall user experience.

---

# Accessibility and Age-Friendly Design

The interface is designed with older users in mind.

Current design considerations include:

- Large readable controls
- Clear labels
- Strong information hierarchy
- Adjustable global text size
- Clear navigation
- Responsive layouts
- Visible loading states
- Clear error states
- Clear empty states
- Simple save interactions
- Reduced unnecessary data entry
- Human-readable recommendation explanations
- Environmental context for activity planning
- Minimal personal-data requirements

The goal is to make activity and service discovery understandable without requiring technical knowledge from the user.

---

# Application Routes

The current Vue application provides the following primary routes:

| Route | Purpose |
|---|---|
| `/login` | Development preview login |
| `/` | Homepage |
| `/activities` | Activity discovery |
| `/activities/:id` | Activity details |
| `/services` | Service discovery |
| `/services/:id` | Service details |
| `/live` | Live venues and PTV information |
| `/saved` | Saved activities and services |
| `/calendar` | Personal calendar |
| `/preferences` | User preferences |

The development preview currently protects feature routes using a browser-based login state.

This mechanism is intended for development and demonstration purposes and should not be treated as production-grade authentication.

---

# System Architecture

```text
                           User
                            │
                            ▼
                    ┌───────────────┐
                    │   Vue 3 UI    │
                    │     Vite      │
                    └───────┬───────┘
                            │
                  Frontend service layer
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
  activityService    serviceService   recommendationService
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Express API   │
                    └───────┬───────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
       SQLite         AI Recommendation    External APIs
          │                 │                  │
   ┌──────┼──────┐          │          ┌───────┴────────┐
   │      │      │          │          │                │
Activities Services Transit │        Vicmap            PTV
                             │
                       MiniLM embeddings


Separate environmental pipeline:

Activity locations
      ↓
Python weather pipeline
      ↓
Open environmental data
      ↓
Generated weather JSON
      ↓
WeatherCard
```

---

# Backend API

The Express backend currently provides:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/activities` | Activity catalogue |
| `GET` | `/api/services` | Service catalogue |
| `GET` | `/api/transit-stops` | Transit-stop reference data |
| `POST` | `/api/recommendations` | AI-assisted activity recommendations |
| `GET` | `/api/realtime/community-venues` | Vicmap community venues |
| `GET` | `/api/realtime/bus-positions` | PTV live bus positions |

Unknown `/api/*` routes return a JSON `404` response.

---

# Technology Stack

## Frontend

- Vue 3
- Vue Router
- Vite
- JavaScript
- HTML
- CSS

## Backend

- Node.js
- Express
- SQLite
- CORS
- dotenv

## AI

- `@huggingface/transformers`
- MiniLM sentence embeddings
- Cosine similarity
- Precomputed activity embeddings
- SHA-256 embedding integrity checks

## Environmental Data

- Python
- Open-Meteo based weather data
- UV information
- Air-quality information
- GitHub Actions automated refresh

## Transport and Live Data

- GTFS transit-stop data
- PTV GTFS-Realtime
- Vicmap Features of Interest
- `gtfs-realtime-bindings`

---

# Repository Structure

```text
age-friendly-australia/
│
├── .github/
│   └── workflows/
│       └── weather-refresh.yml
│
├── age-friendly-database/
│   ├── ai/
│   │   ├── activityEmbeddings.json
│   │   ├── embeddingService.js
│   │   ├── recommendationService.js
│   │   └── ...
│   │
│   ├── age-friendly.db
│   ├── server.js
│   ├── ptvRealtimeService.js
│   ├── vicmapFoiService.js
│   └── package.json
│
├── data/
│
├── data_pipeline/
│   ├── fetch_open_meteo.py
│   ├── requirements.txt
│   └── tests/
│
├── public/
│   ├── data/
│   │   ├── melbourne_suburb_weather.json
│   │   └── weather_refresh_status.json
│   └── images/
│
├── src/
│   ├── components/
│   │   ├── activities/
│   │   └── environment/
│   │
│   ├── router/
│   ├── services/
│   ├── views/
│   └── ...
│
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

---

# Local Development

## Prerequisites

Recommended:

```text
Node.js 22.18+ or a compatible newer version
npm
Python 3.12 for the environmental data pipeline
```

---

## 1. Clone the repository

```bash
git clone https://github.com/YUCHENLU666/age-friendly-australia.git
cd age-friendly-australia
```

---

## 2. Install frontend dependencies

```bash
npm install
```

---

## 3. Configure the frontend API URL

Create:

```text
.env
```

based on:

```text
.env.example
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 4. Install backend dependencies

```bash
cd age-friendly-database
npm install
```

For live PTV bus information, configure the required PTV API key in the backend environment:

```env
PTV_API_KEY=your_ptv_api_key
```

The backend default port is:

```text
3000
```

---

## 5. Start the backend

From:

```text
age-friendly-database/
```

run:

```bash
npm run dev
```

or:

```bash
npm start
```

The backend will be available at:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

---

## 6. Start the frontend

Open another terminal in the repository root:

```bash
npm run dev
```

Vite will provide the local frontend URL.

---

# Production Build

Build the frontend from the repository root:

```bash
npm run build
```

This generates:

```text
dist/
```

The Express backend is configured to serve the built Vue application from this directory.

Then run:

```bash
cd age-friendly-database
npm start
```

In production, Vue Router routes are handled through the backend's history fallback so URLs such as:

```text
/activities
/services
/calendar
/live
```

can be opened directly.

---

# Weather Data Pipeline

The weather pipeline is located in:

```text
data_pipeline/
```

Install Python dependencies:

```bash
python -m pip install -r data_pipeline/requirements.txt
```

Run the tests:

```bash
python -m unittest discover -s data_pipeline/tests -v
```

Run a manual weather refresh:

```bash
python data_pipeline/fetch_open_meteo.py
```

The daily GitHub Actions workflow performs the same core process automatically.

---

# Regenerating Activity Embeddings

Activity embeddings should be regenerated when semantic activity content changes, for example when:

- New activities are imported
- Activities are removed
- Activity names change
- Activity descriptions change
- Activity category tags change

From the backend directory:

```bash
cd age-friendly-database
node ai/generateActivityEmbeddings.js
```

The generated file is:

```text
age-friendly-database/ai/activityEmbeddings.json
```

Precomputed embeddings allow production recommendation requests to generate only the user's preference embedding rather than recalculating every activity embedding.

---

# Local Storage

The application currently uses browser `localStorage` for lightweight client-side state.

Examples include:

```text
Saved activity IDs
Saved service IDs
Planned service visit dates
User preferences
Development preview login state
```

Saved item data and planned calendar dates are intentionally separated:

```text
savedItemsService
    → which items the user saved

calendarService
    → when the user plans to visit a saved service
```

---

# Performance Design

Several optimisations are used to reduce unnecessary work.

## Activity and service caching

Normalised activity and service catalogues are cached in frontend memory during the browser session.

## Weather request sharing

Multiple `WeatherCard` components reuse a shared weather-data request rather than downloading the same JSON independently.

## Lazy transit loading

The full transit-stop dataset is loaded only when a detail page requires nearby transport information.

## Precomputed AI embeddings

Activity embeddings are generated before deployment instead of being recomputed during every recommendation request.

## PTV response caching

Live bus responses are temporarily cached by the backend to reduce repeated calls to the external realtime service.

---

# Data Sources

The project combines several sources and data-processing pipelines, including:

- Event-based activity data processed for the activity catalogue
- Local service data stored in SQLite
- GTFS transit-stop information
- Open-Meteo environmental data
- CAMS-related air-quality information
- Vicmap Features of Interest
- PTV GTFS-Realtime

External information may change when upstream providers update their records.

---

# Important Limitations

This project is an academic prototype and should not be treated as a production health, booking, transport or emergency-information system.

In particular:

- Personal calendar dates do not create real provider bookings.
- The current login mechanism is intended for development/demo access.
- Environmental forecasts are limited by provider forecast horizons.
- External realtime services may become temporarily unavailable.
- Recommendations assist discovery but do not replace user judgement.
- Browser-local data may be lost if local storage is cleared.

---

# Development Principles

The project follows several design principles:

```text
Age-friendly
Accessible
Explainable
Privacy-conscious
Performance-aware
Modular
Data-driven
```

The application separates:

```text
Vue presentation components
        ↓
Frontend service modules
        ↓
Express API
        ↓
SQLite / AI / external data providers
```

This keeps UI components focused on presentation while data retrieval and processing remain reusable across the application.

---

# Project Status

The current `main` branch includes the integrated application with:

- Activity discovery
- Service discovery
- Saved items
- Personal calendar
- Preferences
- AI recommendations
- Activity weather and air quality
- Nearby transit information
- Live Vicmap community venues
- Live PTV bus positions
- Automated environmental-data refresh

Further development can continue to improve data coverage, accessibility, recommendation evaluation, realtime integrations and production authentication.

---

## Repository

`YUCHENLU666/age-friendly-australia`

Age-Friendly Australia — helping older adults discover, plan and engage with their local community more confidently.