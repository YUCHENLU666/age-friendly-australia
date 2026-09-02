# Age-Friendly Australia - Iteration 1

**A focused minimum viable product for accessible activity and aged-care service discovery in Greater Melbourne.**

Iteration 1 helps older adults browse local activities and verified aged-care services, understand key details, and save useful items for later. The release deliberately focuses on the nine Must-priority user stories in the requirements baseline. Personalisation, live information and other Should-priority enhancements remain in the product backlog for later iterations.

## Iteration 1 goal

> Help older adults independently discover, understand and revisit useful local activities and aged-care support information through a simple, readable and privacy-aware interface.

## Implemented scope

| Area | Iteration 1 capability | Related story |
| --- | --- | --- |
| Activity discovery | Browse and keyword-search activity records | US1.1 |
| Activity filtering | Filter by general area, interest, preferred day, schedule and older-adult relevance | US1.2 |
| Activity details | View schedule, venue, description, source and available accessibility information | US1.3 |
| Service discovery | Browse and search the connected aged-care service catalogue | US2.1 |
| Service details | View provider, care type, address, source and other available fields | US2.2 |
| Readability | Change global text size from the header | US3.1 |
| Accessible interface | Use large labelled controls, clear navigation and consistent layouts | US3.2 |
| Saved items | Save, view and remove activities and services | US5.1 |
| Location and access | View destination, approximate distance and nearest stored GTFS stop where supported | US6.1 |

### Deliberate data boundary

The Iteration 1 service catalogue is backed primarily by the verified Australian Aged Care Service List. The user interface displays fields only when they are supplied by the connected source and does not invent missing opening hours, eligibility, contact or accessibility information.

The Iteration 1 activity dataset contains 20 prepared pilot records compiled from public library and council information. The stored service dataset contains 198 aged-care service records focused on South-East Melbourne.

## Deferred product backlog

The following features are intentionally not part of the Iteration 1 release:

| Planned iteration | Deferred capability | Related story or extension |
| --- | --- | --- |
| Iteration 2 | Optional preference settings | US4.1 |
| Iteration 2 | Preference-based activity recommendations | US4.2 |
| Iteration 2 | Clearer eligibility explanations where authoritative data is available | US2.3 |
| Iteration 2 | Supporting directions and live/contextual information | US6.2 / enhancement |
| Iteration 2 | Weather, UV and air-quality context | Enhancement |
| Iteration 3 | Recently viewed activities and services | US5.2 |
| Iteration 3 | Broader GP, healthcare and essential-service datasets | EP2 extension |
| Iteration 3 | Additional council activity datasets | EP1 extension |
| Iteration 3 | Production-grade scheduled data refresh | Data maturity |
| Iteration 3 | Crowd-level or off-peak suggestions | Advanced recommendation |

Deferring these items preserves a clear incremental-delivery story: Iteration 1 establishes the core discovery workflow, Iteration 2 adds personalisation and contextual assistance, and Iteration 3 expands continuity, coverage and data maturity.

## Core user journey

1. Open Activities or Services from the home page.
2. Browse, search or filter the available records.
3. Open a result to read its details and source information.
4. Review location and available access information.
5. Save the item.
6. Return to it later from Saved.

The application remains usable without an account, an exact home address, health records or diagnosis information.

## Architecture

```text
Vue frontend
    |
    | REST requests
    v
Express backend
    |
    v
SQLite database
    |- activities
    |- services
    `- transit_stops
```

The frontend does not access SQLite directly. Vue views call frontend service modules, which request data from the Express API. The backend performs read-only SQLite queries and returns JSON.

### Runtime data flow

```text
ActivitiesView.vue
    -> activityService.js
    -> GET /api/activities
    -> age-friendly-database/server.js
    -> SQLite activities table
```

```text
ServicesView.vue
    -> serviceService.js
    -> GET /api/services
    -> age-friendly-database/server.js
    -> SQLite services table
```

```text
Activity or service detail
    -> transitStopsService.js
    -> GET /api/transit-stops
    -> SQLite transit_stops table
```

Saved identifiers and the selected text size are stored locally in the browser. No sensitive personal information or detailed location history is required.

## Frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/activities` | Activity discovery and filters |
| `/activities/:id` | Activity details |
| `/services` | Aged-care service discovery and filters |
| `/services/:id` | Service details |
| `/saved` | Saved activities and services |

Unknown routes redirect to the home page.

## Backend endpoints

| Method and endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Backend health check |
| `GET /api/activities` | Return stored activity records |
| `GET /api/services` | Return stored aged-care service records |
| `GET /api/transit-stops` | Return stored GTFS stop records |

Realtime PTV vehicle and dynamic Vicmap endpoints are not included in the Iteration 1 release.

## Key source files

```text
src/
|- components/
|  |- AppNavbar.vue
|  |- activities/
|  |  |- ActivityCard.vue
|  |  `- ActivityFilters.vue
|  `- services/
|     |- ServiceCard.vue
|     `- ServiceFilters.vue
|- router/index.js
|- services/
|  |- activityService.js
|  |- serviceService.js
|  |- savedItemsService.js
|  |- textSizeService.js
|  |- transitStopsService.js
|  |- distanceService.js
|  |- suburbCoordinates.js
|  `- venueCoordinates.js
|- utils/csvParser.js
`- views/
   |- HomeView.vue
   |- ActivitiesView.vue
   |- ActivityDetailView.vue
   |- ServicesView.vue
   |- ServiceDetailView.vue
   `- SavedView.vue

age-friendly-database/
|- age-friendly.db
|- server.js
|- initDb.js
|- importData.js
|- syncAgedCareData.js
`- syncGtfsStops.js
```

## Run locally

### Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- npm

### Start the backend

```bash
cd age-friendly-database
npm install
npm start
```

The backend starts on `http://localhost:3000` by default.

### Start the frontend

Open another terminal from the project root:

```bash
npm install
npm run dev
```

The default frontend API setting is:

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

Copy `.env.example` to `.env` if a local environment file is required.

### Production build

```bash
npm run build
```

## Iteration 1 acceptance summary

- Activity and service records load through the backend API.
- Users can search and filter supported records.
- Clear empty, loading and error states are available.
- Activity and service detail views open from result cards.
- Source-provided information is displayed without fabricating missing fields.
- Users can save, revisit and remove supported items.
- Text size remains active while navigating through the application.
- Core pages retain readable layouts and labelled controls.
- Location and supporting nearest-stop information are shown where valid data exists.
- No medical record, diagnosis, exact home address or detailed location history is required.

## Known limitations

1. Activity coverage is a small prepared pilot dataset rather than a comprehensive live event feed.
2. The connected service catalogue is aged-care focused and does not yet provide dedicated GP or broad essential-service coverage.
3. Opening hours, eligibility, contact and accessibility fields are limited by the verified source data.
4. GTFS stop data is a stored snapshot, not live vehicle information or a journey planner.
5. Recently viewed items, preference-based recommendations and live contextual information are intentionally deferred.
6. Scheduled refresh scripts are not guaranteed to run automatically in production.

## Design prototype

The broader high-fidelity concept is available at:

https://kiwi-navy-66840758.figma.site

The prototype explores later-iteration concepts as well as the Iteration 1 workflow. Its presence does not mean every concept is included in this release.

## Repository

https://github.com/YUCHENLU666/age-friendly-australia
