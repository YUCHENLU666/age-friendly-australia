# Age Friendly Australia

Age Friendly Australia is an accessible web application designed to help older adults living independently in Greater Melbourne discover trusted local activities, aged-care and essential services, supporting transport information, senior-friendly community venues, and live public transport information through one consistent interface.

The project focuses on reducing the need to search across multiple websites while maintaining a simple, readable and privacy-aware experience for users with varying levels of digital confidence.

---

# 1. Project Goals

The application aims to:

- Help older adults discover suitable local activities and services.
- Present information using clear language and an age-friendly interface.
- Support filtering using broad, non-sensitive preferences.
- Allow users to save useful activities and services for later.
- Provide adjustable text size and clear navigation.
- Present location, accessibility and supporting transport information when verified data is available.
- Improve activity relevance using voluntarily selected preferences.
- Provide dynamically retrieved Victorian community-facility information.
- Provide live public transport vehicle information.
- Avoid requiring unnecessary sensitive personal information.
- Avoid storing health records, diagnosis information or detailed location history.
- Separate frontend presentation logic from backend data-access logic.
- Use verified public/open data sources and avoid fabricating unavailable information.

---

# 2. Current Iteration Summary

The current implementation includes activity discovery, service discovery, saved items, preference-based personalisation, accessibility support, nearest-public-transport-stop support, a SQLite database, an Express backend, dynamic Vicmap integration and PTV GTFS-Realtime integration.

The major technical improvement in the current build is that the Vue frontend no longer directly reads the project CSV datasets at runtime.

The current runtime architecture is:

```text
Vue Frontend
     |
     | REST API requests
     v
Express Backend
     |
     +---------------------------+
     |                           |
     v                           v
SQLite Database            External APIs
     |                           |
     |                           +--> Vicmap Features of Interest
     |                           |
     |                           +--> PTV GTFS-Realtime
     |
     +--> Activities
     +--> Services
     +--> Transit Stops
```

This architecture provides clear separation between:

- User interface
- Frontend service layer
- Backend REST API
- Stored application data
- External open-data services
- Realtime transport data
- Private API credentials

---

# 3. Current Implementation Status

| Area | Status |
| --- | --- |
| Home page | ✅ Implemented |
| Activity discovery | ✅ Implemented |
| Activity filtering | ✅ Implemented |
| Activity detail page | ✅ Implemented |
| Activity preference scoring | ✅ Implemented |
| Preference-based personalisation | ✅ Implemented |
| Global text-size accessibility | ✅ Implemented |
| Saved activities | ✅ Implemented |
| Saved services | ✅ Implemented |
| Service discovery | ✅ Implemented |
| Service search | ✅ Implemented |
| General-area service filtering | ✅ Implemented |
| Service-type filtering | ✅ Implemented |
| Accessibility service filter | 🟡 UI implemented; source coverage is limited |
| Service detail page | ✅ Implemented |
| Service distance sorting | ✅ Implemented |
| Nearest public transport stop lookup | ✅ Implemented |
| Approximate transport-stop distance | ✅ Implemented |
| SQLite database | ✅ Implemented |
| Express backend | ✅ Implemented |
| Activities REST API | ✅ Implemented |
| Services REST API | ✅ Implemented |
| Transit stops REST API | ✅ Implemented |
| Vicmap external API integration | ✅ Implemented |
| PTV GTFS-Realtime integration | ✅ Implemented |
| Live Information page | ✅ Implemented |
| Live venue refresh | ✅ Implemented |
| Live bus route filtering | ✅ Implemented |
| Live bus refresh | ✅ Implemented |
| External map links | ✅ Implemented |
| Backend API-key protection | ✅ Implemented |
| National Public Toilet Map integration | ⏳ Planned |
| Weather integration | ⏳ Future work |
| UV Index integration | ⏳ Future work |
| Air Quality integration | ⏳ Future work |
| Scheduled backend data refresh | ⏳ Future work |
| Production deployment | ⏳ Required before final iteration submission |

---

# 4. Architecture Improvement

An earlier implementation used local frontend datasets directly.

## Previous Approach

```text
Vue Frontend
     |
     v
Local CSV Datasets
```

This was useful for early frontend prototyping but provided limited separation between presentation and data access.

## Current Approach

```text
Vue Frontend
     |
     v
Frontend Service Layer
     |
     v
Express REST API
     |
     +--> SQLite Database
     |
     +--> Vicmap Features of Interest API
     |
     +--> PTV GTFS-Realtime API
```

The current architecture improves:

- Maintainability
- Data-source separation
- Centralised backend error handling
- API credential protection
- External API integration
- Realtime-data support
- Future deployment flexibility
- Future database-refresh capability

---

# 5. Technology Stack

## Frontend

- Vue 3
- Vue Router
- Vite
- JavaScript
- HTML5
- CSS
- LocalStorage

## Backend

- Node.js
- Express
- CORS
- dotenv

## Database

- SQLite
- sqlite3

## Data and External Services

- Australian Government aged-care service data
- PTV GTFS Schedule data
- Vicmap Features of Interest REST API
- PTV GTFS-Realtime API
- Public library and council event information used to prepare the activity sample

## Development and Version Control

- Git
- GitHub
- Feature-branch workflow

---

# 6. User Stories

## User Story 1 — Wang Yu

### Scenario

Wang Yu is an older adult living independently who wants to remain active while managing everyday activities and essential services.

### Key User Story

> As Wang Yu, I want to find trusted local activities and essential services through one simple and accessible platform, so that I can manage my daily life independently and stay active.

### Related Epics

- **EP1 — Local Activity Discovery**
- **EP2 — Health & Essential Services**
- **EP3 — Age-Friendly Accessibility**
- **EP4 — Preference-Based Personalisation**
- **EP6 — Location & Access Information**

### Acceptance Criteria

#### AC1 — Discovery and Recommendations

The system should allow the user to use:

- General area
- Date or preferred day
- Interest
- Result type

to discover relevant:

- Local activities
- Healthcare or aged-care services
- Senior support
- Essential services

Recommendations should use only voluntarily selected, non-sensitive preferences.

#### AC2 — Information and Transport Access

Each result should display relevant available information including:

- Name
- Type
- Description where available
- Date, schedule or opening information where available
- Location
- Contact information where available
- Accessibility information where available
- Data source

Where joined transport and location data is available, the platform should also provide:

- Nearest public transport stop
- Approximate distance

#### AC3 — Saving, Accessibility and Privacy

The user should be able to:

- Save useful activities or services
- View saved items
- Remove saved items

The interface should provide:

- Readable text
- Large labelled controls
- Simple language
- Clear navigation

The system should not require sensitive personal information or store detailed location history.

---

## User Story 2 — Robert Wilson

### Scenario

Robert Wilson is an older adult living independently in Greater Melbourne who needs a simple way to discover and understand healthcare, aged-care support and essential services.

### Related Epics

- **EP2 — Health & Essential Services**
- **EP3 — Age-Friendly Accessibility**
- **EP5 — Saved & Recent Items**
- **EP6 — Location & Access Information**

### User Need

Robert needs to:

- Discover healthcare and aged-care support.
- Understand what a service provides.
- Understand eligibility information when available.
- Check opening hours and contact information when available.
- Check location and accessibility information.
- Save useful services for later.
- Use the platform without providing medical records or diagnosis information.

### Acceptance Criteria

#### AC1 — Relevant Service Discovery

The user should be able to select:

- General area
- Service type
- Accessibility needs

and receive relevant service results without being required to provide medical records or diagnosis information.

#### AC2 — Clear and Trusted Service Information

Each service result should display verified available information including:

- Provider
- Service purpose
- Eligibility when available
- Opening hours when available
- Location
- Contact details when available
- Accessibility information when available
- Data source

Where joined location and transport data is available, the system should also display:

- Nearest public transport stop
- Approximate distance

If a source dataset does not provide a required field, the application should not fabricate the missing information.

#### AC3 — Saving, Accessibility and Privacy

Robert should be able to:

- Save services
- View saved services
- Remove saved services

The interface should use:

- Readable text
- Large controls
- Simple descriptions
- Clear navigation

The system should not store:

- Health records
- Diagnosis details
- Exact home address
- Detailed location history

---

## User Story 3 — Margaret Evans

### Scenario

Margaret Evans is an older adult living independently in Greater Melbourne who wants to discover suitable local activities, classes and events.

She wants relevant results based on voluntarily provided preferences and wants to save useful activities without providing unnecessary personal information.

### Related Epics

- **EP1 — Local Activity Discovery**
- **EP3 — Age-Friendly Accessibility**
- **EP4 — Preference-Based Personalisation**
- **EP5 — Saved & Recent Items**
- **EP6 — Location & Access Information**

### Acceptance Criteria

#### AC1 — Activity Discovery and Matching

The user should be able to select:

- General area
- Preferred day
- Interest
- Activity type

The system should use only these voluntarily provided preferences to improve activity relevance.

#### AC2 — Activity and Participation Information

Where supplied by the verified source data, activity results should provide:

- Activity name
- Category
- Organiser
- Date or schedule
- Venue
- Availability
- Accessibility details
- Data source
- Joining or external registration information

Where joined transport data is available, the application should also display:

- Nearest public transport stop
- Approximate distance

#### AC3 — Saving, Accessibility and Privacy

Margaret should be able to:

- Save activities
- View saved activities
- Remove saved activities

The platform does not require:

- Public user profiles
- User posts
- Private messages
- Sensitive personal information
- Detailed location history

---

# 7. Epic Mapping

| Epic | Description | Current Implementation |
| --- | --- | --- |
| **EP1 — Local Activity Discovery** | Discover activities, classes and events with filtering | ✅ Implemented |
| **EP2 — Health & Essential Services** | Discover aged-care and essential services | ✅ Implemented with verified service data |
| **EP3 — Age-Friendly Accessibility** | Adjustable text size, clear navigation and readable interface | ✅ Implemented |
| **EP4 — Preference-Based Personalisation** | Use voluntary non-sensitive preferences to improve relevance | ✅ Implemented |
| **EP5 — Saved & Recent Items** | Save useful activities/services for later | ✅ Implemented |
| **EP6 — Location & Access Information** | Location and supporting transport information | ✅ Nearest-stop support implemented; some accessibility data remains source-dependent |
| **Dynamic and Live Data Support** | Use current external and realtime data | ✅ Vicmap + PTV GTFS-Realtime implemented |

---

# 8. Requirements Traceability

| Feature | Related User Story | Related AC | Status |
| --- | --- | --- | --- |
| Activity search | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ |
| General-area activity filtering | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ |
| Interest filtering | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ |
| Activity-type filtering | Margaret | Margaret AC1 | ✅ |
| Activity information cards | Wang / Margaret | Wang AC2, Margaret AC2 | ✅ with source-aware missing fields |
| Activity detail page | Wang / Margaret | Wang AC2, Margaret AC2 | ✅ |
| Activity preference scoring | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ |
| Preferences | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ |
| Global text-size control | All personas | AC3 | ✅ |
| Clear navigation | All personas | AC3 | ✅ |
| Save activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ |
| View saved activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ |
| Remove saved activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ |
| Service search | Wang / Robert | Wang AC1, Robert AC1 | ✅ |
| General-area service filtering | Wang / Robert | Wang AC1, Robert AC1 | ✅ |
| Service-type filtering | Robert | Robert AC1 | ✅ |
| Accessibility service filtering | Robert | Robert AC1 | 🟡 limited by source attributes |
| Service information cards | Robert | Robert AC2 | ✅ |
| Service detail page | Robert | Robert AC2 | ✅ |
| Service distance sorting | Robert | Robert AC1 / AC2 | ✅ |
| Save services | Wang / Robert | Wang AC3, Robert AC3 | ✅ |
| View saved services | Wang / Robert | Wang AC3, Robert AC3 | ✅ |
| Remove saved services | Wang / Robert | Wang AC3, Robert AC3 | ✅ |
| Nearest transport stop | Wang / Robert / Margaret | AC2 | ✅ |
| Approximate transport-stop distance | Wang / Robert / Margaret | AC2 | ✅ |
| Dynamic community venues | Wang / Robert / Margaret | Location and access support | ✅ |
| Live bus positions | Wang / Robert / Margaret | Location and access support | ✅ |
| No sensitive health information required | Wang / Robert | AC3 | ✅ |
| No detailed location history | All personas | AC3 | ✅ |
| Public toilet discovery | Wang | Wang AC1 | ⏳ Planned |

---

# 9. Database

The project includes a SQLite database located at:

```text
age-friendly-database/age-friendly.db
```

The database currently contains three main tables.

## 9.1 Activities

Table:

```text
activities
```

Current records:

```text
20
```

Fields include:

- Event name
- Category tags
- Venue
- Suburb
- Day and time
- Recurrence
- Older-adult relevance
- Source information

Activity records are served through:

```http
GET /api/activities
```

## 9.2 Services

Table:

```text
services
```

Current records:

```text
198
```

The current dataset contains aged-care service records focused on South-East Melbourne.

Fields include:

- Service name
- Provider
- Care type
- Organisation type
- Address
- Suburb
- Postcode
- Latitude
- Longitude
- Source information

Service records are served through:

```http
GET /api/services
```

Where information is unavailable from the verified source, the application does not fabricate it.

## 9.3 Transit Stops

Table:

```text
transit_stops
```

Current records:

```text
4,994
```

Fields include:

- Stop ID
- Stop name
- Latitude
- Longitude

Transit stops are served through:

```http
GET /api/transit-stops
```

The frontend uses these records to calculate the nearest stop for activities and services.

---

# 10. Open Data Sources

The project uses more than three relevant open/public data sources.

| Dataset / Service | Source / Coverage | Format | Current Use |
| --- | --- | --- | --- |
| Aged Care Service List | Australian Government | XLSX / CSV → SQLite | Service discovery |
| PTV GTFS Schedule | Victoria | GTFS → prepared stop data → SQLite | Nearest public transport stop |
| Vicmap Features of Interest | Victoria | REST / GeoJSON | Dynamic senior-friendly community venues |
| PTV GTFS-Realtime | Victoria | GTFS-Realtime | Live bus vehicle positions |
| Public library / council event information | Local areas | Public web information → prepared sample | Activity discovery |
| National Public Toilet Map | Australia | Open data | Planned |
| Open-Meteo | Weather coverage | API | Future work |
| EPA Victoria environmental monitoring | Victoria | API | Future work |

---

# 11. Data Preparation and Data Governance

The project distinguishes between:

1. Source datasets
2. Prepared or cleaned datasets
3. Stored application data
4. Dynamic external API data
5. Realtime data

## 11.1 Stored Data Flow

Activities, services and transit stops follow this flow:

```text
Source Dataset
      |
      v
Preparation / Cleaning / Filtering
      |
      v
Import Scripts
      |
      v
SQLite Database
      |
      v
Express Backend API
      |
      v
Vue Frontend Service Layer
      |
      v
Vue Views
```

Relevant backend files include:

```text
age-friendly-database/initDb.js
age-friendly-database/importData.js
```

The prepared source files remain useful for reproducibility and database rebuilding but are not directly loaded by the Vue frontend during normal runtime.

## 11.2 External API Data Flow

Vicmap:

```text
Vicmap Features of Interest
      |
      v
vicmapFoiService.js
      |
      v
Express Backend
      |
      v
GET /api/realtime/community-venues
      |
      v
Vue Live Information Page
```

PTV Realtime:

```text
PTV GTFS-Realtime
      |
      v
ptvRealtimeService.js
      |
      v
Express Backend
      |
      v
GET /api/realtime/bus-positions
      |
      v
Vue Live Information Page
```

---

# 12. Data Freshness Strategy

Different datasets have different freshness characteristics.

| Data | Freshness Type | Current Strategy |
| --- | --- | --- |
| Activities | Prepared dataset / periodically maintainable | Stored in SQLite |
| Services | Prepared dataset / periodically maintainable | Stored in SQLite |
| Transit stops | GTFS schedule snapshot | Stored in SQLite |
| Vicmap venues | Dynamic external API | Requested when Live page loads or refreshes |
| PTV vehicle positions | Realtime feed | Requested through backend with short cache |
| Weather / UV / Air Quality | Rapidly changing | Future work |

The project therefore avoids describing all datasets as realtime.

Only the PTV GTFS-Realtime vehicle feed is treated as true realtime transport data in the current build.

Vicmap venue information is dynamically retrieved external data.

---

# 13. Backend REST API

The backend runs locally at:

```text
http://localhost:3000
```

## 13.1 Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "message": "Age-Friendly Australia backend is running."
}
```

## 13.2 Activities

```http
GET /api/activities
```

Returns activity records stored in SQLite.

## 13.3 Services

```http
GET /api/services
```

Returns service records stored in SQLite.

## 13.4 Transit Stops

```http
GET /api/transit-stops
```

Returns transit-stop records stored in SQLite.

## 13.5 Vicmap Community Venues

```http
GET /api/realtime/community-venues
```

Optional query parameters:

```text
type
subtype
limit
```

Example:

```text
/api/realtime/community-venues?subtype=senior%20citizens&limit=10
```

## 13.6 PTV Live Bus Positions

```http
GET /api/realtime/bus-positions
```

Optional query parameters:

```text
routeId
limit
```

Example:

```text
/api/realtime/bus-positions?routeId=200&limit=10
```

Returned information includes:

- Vehicle ID
- Route ID
- Latitude
- Longitude
- Bearing
- Timestamp

The backend applies a short cache to reduce unnecessary repeated requests to the external realtime service.

---

# 14. Frontend Service Architecture

Frontend data access is separated from Vue views through service modules.

Important modules include:

```text
src/services/activityService.js
src/services/serviceService.js
src/services/transitStopsService.js
src/services/liveDataService.js
src/services/distanceService.js
src/services/preferencesService.js
src/services/savedItemsService.js
```

The main application flow is:

```text
Vue View
   |
   v
Frontend Service
   |
   v
Backend REST API
   |
   v
SQLite Database or External API
```

This prevents individual Vue views from containing direct database or external API integration logic.

---

# 15. Activities

The Activities feature supports:

- Keyword search
- General-area filtering
- Interest filtering
- Preferred-day filtering
- Schedule or recurrence filtering
- Older-adult relevance filtering
- Preference-based ranking
- Activity cards
- Activity detail pages
- Saved activities
- Source attribution
- Nearest public transport stop
- Approximate distance to transport

Activity records are retrieved from:

```http
GET /api/activities
```

The frontend does not directly load the activity CSV at runtime.

---

# 16. Activity Preference Scoring

The application supports preference-based activity ranking using voluntarily supplied, non-sensitive preferences.

Current preference factors include:

1. General area
2. Interests
3. Preferred days
4. Activity type

The scoring mechanism improves result ordering without requiring medical or other sensitive personal information.

---

# 17. Services

The Services feature supports:

- Keyword search
- General-area filtering
- Service-type filtering
- Accessibility-filter architecture
- Distance-based ordering
- Service cards
- Service detail pages
- Saved services
- Source information
- Missing-data handling
- Nearest public transport stop
- Approximate transport distance

Service records are retrieved from:

```http
GET /api/services
```

The frontend does not directly load the services CSV at runtime.

---

# 18. Public Transport Access

PTV GTFS schedule stop information is stored in SQLite and accessed through:

```http
GET /api/transit-stops
```

The frontend loads transit stops through:

```text
src/services/transitStopsService.js
```

Transit-stop data is cached in the frontend after the first backend request to avoid repeatedly downloading all 4,994 stops.

Nearest-stop calculations support:

- Activity detail pages
- Service detail pages

Approximate flow:

```text
Activity / Service Coordinates
        |
        v
Transit Stops from Backend
        |
        v
Distance Calculation
        |
        v
Nearest Transport Stop
```

Transport support is supplementary. Age Friendly Australia is not intended to replace a full journey-planning application.

---

# 19. Live Information

The application includes a dedicated route:

```text
/live
```

The page presents two current external data sources.

## 19.1 Senior-Friendly Community Venues

Data source:

```text
Vicmap Features of Interest
```

The interface displays:

- Venue name
- Facility type
- Facility subtype
- Latitude
- Longitude
- External map location

Users can manually refresh the data.

The current Vicmap query returns relevant Victorian facilities. It is not yet a strict user-GPS nearest-venue feature.

## 19.2 Live Bus Positions

Data source:

```text
PTV GTFS-Realtime
```

The interface displays:

- Bus vehicle ID
- Route number
- Current reported coordinates
- Vehicle bearing
- Latest reported time
- External map position

Users can:

- View vehicles from multiple routes
- Enter a specific route number
- Refresh the latest vehicle information
- Clear the route filter
- Open the current vehicle position in an external map

---

# 20. Distance Calculation

The application uses approximate geographic distance calculations to support local discovery.

Relevant modules include:

```text
src/services/distanceService.js
src/services/suburbCoordinates.js
```

The distance service uses geographic coordinates and the Haversine formula.

The calculations are intended for approximate local discovery rather than exact door-to-door navigation.

---

# 21. Accessibility

The application is designed for older users and includes:

- Adjustable global text size
- Standard, Large and Extra Large text modes
- Large interactive controls
- Clear navigation
- High readability
- Simple labels
- Consistent page layouts
- Responsive design
- Clear loading and error states

Accessibility information for individual services remains dependent on available verified source data.

The application does not invent missing accessibility information.

---

# 22. Saved Items and Preferences

Users can save:

- Activities
- Services

Saved-item identifiers are stored locally in the browser.

Users can:

- Save an item
- View saved items
- Remove saved items
- Filter saved items by type

Users can also voluntarily save non-sensitive preferences including:

- General area
- Interests
- Preferred days
- Activity type
- Text size

No user account is required in the current implementation.

---

# 23. Privacy and Security

The application follows a minimal-data and privacy-aware design.

The current system does not require:

- Medical records
- Diagnosis information
- Exact home addresses
- Public user profiles
- Private messages
- Detailed user location history

## 23.1 API Key Protection

PTV realtime access requires a private API key.

The key is stored only in:

```text
age-friendly-database/.env
```

Example:

```env
PTV_API_KEY=YOUR_PRIVATE_API_KEY
```

The backend `.env` file is excluded from Git using `.gitignore`.

The credential is not stored in a frontend `VITE_` variable and is not returned to the browser.

The frontend therefore follows:

```text
Vue Frontend
     |
     v
Express Backend
     |
     v
PTV API
```

rather than:

```text
Vue Frontend
     |
     v
PTV API + Exposed Credential
```

## 23.2 Security Measures Currently Implemented

- PTV API key kept server-side.
- Backend `.env` excluded from Git.
- Frontend does not receive the PTV credential.
- Backend validates external API responses.
- Vicmap response structure is checked before use.
- Request result limits are bounded.
- Missing or invalid external responses return controlled API errors.
- Backend CORS middleware is enabled.
- SQLite database access is separated from the frontend.
- Application does not store sensitive health information.

---

# 24. Security Risk Summary

| Risk | Potential Impact | Current Mitigation |
| --- | --- | --- |
| API credential exposure | Unauthorised API use or quota abuse | Store PTV key in backend `.env`; exclude from Git |
| External API outage | Live page may temporarily lack data | Backend error handling and user-visible error states |
| Invalid external API response | Runtime errors or bad UI data | Response validation before mapping |
| Excessive realtime requests | External service load or quota use | Short backend PTV cache and request limits |
| Sensitive-data collection | Privacy risk | Minimal-data design; no health records or detailed location history |
| Missing source fields | Misleading information | Do not fabricate unavailable provider or service information |

A fuller project-specific risk assessment should be maintained in the Project Governance Portfolio security documentation.

---

# 25. Environment Configuration

## 25.1 Frontend

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Example configuration is provided in:

```text
.env.example
```

## 25.2 Backend

Create:

```text
age-friendly-database/.env
```

and add:

```env
PTV_API_KEY=YOUR_PRIVATE_PTV_API_KEY
```

Do not commit this file.

---

# 26. Local Development

The application requires two development processes:

1. Vue frontend
2. Express backend

## 26.1 Install Frontend Dependencies

From the project root:

```bash
npm install
```

On Windows PowerShell:

```powershell
npm.cmd install
```

Start the frontend:

```bash
npm run dev
```

or:

```powershell
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:5173
```

## 26.2 Install Backend Dependencies

Open another terminal:

```powershell
cd age-friendly-database
npm.cmd install
```

Start the backend in development mode:

```powershell
npm.cmd run dev
```

Backend URL:

```text
http://localhost:3000
```

The backend development script uses:

```text
node --watch server.js
```

## 26.3 Production-Style Backend Start

```powershell
npm.cmd start
```

which runs:

```text
node server.js
```

---

# 27. Production Build

From the project root:

```bash
npm run build
```

or on Windows:

```powershell
npm.cmd run build
```

A successful frontend build creates:

```text
dist/
```

Preview locally:

```bash
npm run preview
```

or:

```powershell
npm.cmd run preview
```

The iteration submission should use the deployed production build URL required by the unit rather than localhost.

---

# 28. Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/activities` | Activity discovery |
| `/activities/:id` | Activity details |
| `/services` | Service discovery |
| `/services/:id` | Service details |
| `/live` | Vicmap and PTV current/live information |
| `/saved` | Saved items |
| `/preferences` | Preferences and accessibility settings |

---

# 29. Project Structure

```text
age-friendly-australia/
│
├── src/
│   ├── components/
│   │   └── AppNavbar.vue
│   │
│   ├── router/
│   │   └── index.js
│   │
│   ├── services/
│   │   ├── activityService.js
│   │   ├── serviceService.js
│   │   ├── transitStopsService.js
│   │   ├── liveDataService.js
│   │   ├── distanceService.js
│   │   ├── preferencesService.js
│   │   ├── savedItemsService.js
│   │   ├── suburbCoordinates.js
│   │   └── venueCoordinates.js
│   │
│   └── views/
│       ├── HomeView.vue
│       ├── ActivitiesView.vue
│       ├── ActivityDetailView.vue
│       ├── ServicesView.vue
│       ├── ServiceDetailView.vue
│       ├── LiveInformationView.vue
│       ├── SavedView.vue
│       └── PreferencesView.vue
│
├── age-friendly-database/
│   ├── age-friendly.db
│   ├── server.js
│   ├── initDb.js
│   ├── importData.js
│   ├── vicmapFoiService.js
│   ├── ptvRealtimeService.js
│   ├── testVicmapService.js
│   ├── testPtvRealtimeService.js
│   ├── package.json
│   └── .env
│
├── data/
│   └── sample/
│
├── .env.example
├── package.json
└── README.md
```

---

# 30. Backend Data Services

## 30.1 Vicmap Service

Implemented in:

```text
age-friendly-database/vicmapFoiService.js
```

Responsibilities include:

- Constructing Vicmap queries
- Escaping query values used in the ArcGIS WHERE clause
- Requesting GeoJSON
- Validating HTTP responses
- Handling ArcGIS error responses
- Validating returned feature arrays
- Validating coordinates
- Converting GeoJSON features into application-friendly objects

## 30.2 PTV Realtime Service

Implemented in:

```text
age-friendly-database/ptvRealtimeService.js
```

Responsibilities include:

- Reading the private backend PTV API key
- Requesting GTFS-Realtime vehicle information
- Parsing transport data
- Returning simplified bus-position objects

The private API key is not exposed to frontend code.

---

# 31. Testing

The current build has been manually verified through backend endpoint tests and frontend functional checks.

## 31.1 Backend Verification

| Test | Expected Result | Current Result |
| --- | --- | --- |
| `GET /api/health` | Backend reports running | ✅ Pass |
| `GET /api/activities` | Activity records returned | ✅ 20 records |
| `GET /api/services` | Service records returned | ✅ 198 records |
| `GET /api/transit-stops` | Transit stops returned | ✅ 4,994 records |
| Vicmap request | Valid venue array returned | ✅ Pass |
| PTV realtime request | Live vehicle objects returned | ✅ Pass |

## 31.2 Frontend Verification

| Feature | Current Result |
| --- | --- |
| Activities load through backend | ✅ Pass |
| Services load through backend | ✅ Pass |
| Transit stops load through backend | ✅ Pass |
| Activity filters | ✅ Pass |
| Service filters | ✅ Pass |
| Saved items | ✅ Pass |
| Preferences | ✅ Pass |
| Text-size control | ✅ Pass |
| Live venue display | ✅ Pass |
| Live venue refresh | ✅ Pass |
| External venue map link | ✅ Pass |
| Live bus display | ✅ Pass |
| Bus route filter | ✅ Pass |
| Live bus refresh | ✅ Pass |
| External bus-position map link | ✅ Pass |

Dedicated external-service test files include:

```text
age-friendly-database/testVicmapService.js
age-friendly-database/testPtvRealtimeService.js
```

Formal test cases, screenshots and acceptance-test evidence should also be maintained in the Project Governance Portfolio and aligned with current LeanKit acceptance criteria.

---

# 32. Iteration Alignment and Acceptance

The build should remain aligned with:

- Current LeanKit epics
- Current user stories
- Current acceptance criteria
- Test cases
- Project Governance Portfolio documentation
- Mentor feedback and requirement changes

When requirements change, the corresponding LeanKit cards, acceptance criteria, testing artefacts and project documentation should also be updated so that the build and governance artefacts remain consistent.

The backend/database change should therefore be reflected in the current iteration documentation rather than being treated as an undocumented implementation change.

---

# 33. Data Management Plan Alignment

The Project Governance Portfolio data-management documentation should describe, for each relevant dataset:

- Data source
- Access format such as API, CSV, XLSX, GTFS or GeoJSON
- Source update frequency where known
- Application update frequency
- Cleaning and filtering steps
- Transformation and normalisation
- Storage method
- Archiving or reproducibility approach
- How the data supports user needs
- Ethical, legal and privacy considerations
- Licensing or attribution requirements

The README summarises the technical implementation, but the formal Data Management Plan should contain the detailed governance evidence for each iteration.

---

# 34. Data Quality Principles

## Verified Information

Information should be derived from identified datasets or external services.

## No Fabrication

If a source does not provide a field, the application should not invent a value.

## Separation of Source and Presentation

Raw data is normalised before being displayed in the user interface.

## Source-Aware Behaviour

The interface acknowledges that external data can change when providers update their records.

## Appropriate Freshness Claims

The project distinguishes between:

- Stored data
- Dynamic external data
- Realtime data

and does not describe static snapshots as realtime.

---

# 35. Known Limitations

The current implementation has several known limitations.

1. The activity sample does not provide every field required by the final acceptance criteria.
2. Some activities do not contain complete organiser, accessibility, availability or registration information.
3. The current activity sample does not provide complete Greater Melbourne coverage.
4. The service dataset focuses primarily on aged-care services rather than every healthcare or essential-service category.
5. Accessibility information is limited by current service-source fields.
6. Phone numbers are not consistently available in the current service source.
7. Opening hours are not consistently available in the current service source.
8. Eligibility information is not consistently available in the current service source.
9. National Public Toilet Map data has not yet been integrated.
10. The transit-stop table is based on prepared GTFS schedule data rather than live arrival information.
11. Vicmap venues are dynamically retrieved but are not yet ordered by the user's precise GPS location.
12. PTV vehicle availability depends on the current GTFS-Realtime feed.
13. External APIs may temporarily be unavailable.
14. Local development requires both frontend and backend processes to be running.
15. Production deployment is still required for final iteration submission and review.

Missing source information is not fabricated by the application.

---

# 36. Future Development

Potential future work includes:

- User-location-based venue ordering
- Additional Vicmap facility categories
- National Public Toilet Map integration
- Weather information
- UV Index information
- Air-quality information
- Outdoor activity suitability indicators
- Scheduled server-side data refresh
- Improved automated backend testing
- Improved accessibility-source coverage
- Wider healthcare and essential-service coverage
- Production deployment configuration
- Additional backend monitoring and logging
- More robust API timeout and retry behaviour where appropriate

---

# 37. Iteration Roadmap Summary

## Current Completed Work

- Core Vue frontend
- Home page
- Activity discovery
- Activity filtering
- Activity details
- Preference-based activity scoring
- Preferences
- Saved activities
- Saved services
- Services interface
- Verified aged-care service dataset
- Service filtering
- Service distance calculation
- Service distance ordering
- PTV GTFS stop lookup
- Nearest-stop calculation
- Activity nearest-stop information
- Service nearest-stop information
- Global text-size control
- Privacy-aware design
- Source-aware missing-field handling
- SQLite database
- Express backend
- Frontend-to-backend REST integration
- Vicmap dynamic facility integration
- PTV GTFS-Realtime integration
- Live Information page
- Live bus route filtering
- Backend credential protection

## Planned or Future Work

- National Public Toilet Map
- Additional Vicmap categories
- Weather integration
- UV Index
- Air Quality
- Outdoor Activity Suitability
- Wider service coverage
- Improved accessibility data
- Scheduled backend data refresh
- Production deployment and production environment configuration

---

# 38. Requirement Source Documents

Project requirements, implementation decisions and future plans should remain aligned with:

- User Stories and Epic Mapping
- Acceptance Criteria
- LeanKit
- Updated Personas
- Open Data Research
- Data Governance / Data Management Plan
- Security Plan
- Testing Artefacts
- Mentor Feedback and Meeting Minutes
- Iteration Build Documentation

These artefacts should remain consistent with the current build.

---

# 39. Project Principles

## Accessibility First

Information should remain:

- Readable
- Clearly structured
- Easy to navigate
- Supported by large controls
- Suitable for older adults with varying digital confidence

## Privacy-Aware

The platform should avoid collecting unnecessary sensitive information.

Personalisation should use voluntary, non-sensitive preferences.

## Trusted Information

The application should display verified source information.

Missing provider information should not be guessed or fabricated.

## Simple Decision Support

Additional features such as transport, live venue information and future environmental data should support the user's main task without overwhelming the interface.

## Maintainable Architecture

The project should keep frontend, backend, database and external-service responsibilities clearly separated.

## Incremental Development

New datasets and features should be introduced gradually across iterations while preserving the existing user experience and keeping LeanKit, acceptance criteria, tests and governance artefacts aligned with the build.

---

# 40. Repository

Repository:

```text
YUCHENLU666/age-friendly-australia
```

The development workflow uses feature branches before integration into `main`.
