# Age-Friendly Australia

**Accessible local activities, health and essential service discovery for older adults in Greater Melbourne.**

Age-Friendly Australia is a Vue-based web application designed to help older adults living independently in Greater Melbourne discover, understand and revisit useful local activities, aged-care services and supporting access information through one simple, readable and privacy-aware interface.

The broader project scope also includes healthcare and essential-service discovery, but the **current coded service catalogue is primarily backed by the verified Aged Care Service List**. Broader GP/healthcare and other essential-service datasets are not yet connected to the production service directory.

The project responds to a recurring problem identified through the team’s design-thinking work: important information is often fragmented across multiple websites, while complex navigation, small text, inconsistent layouts, unfamiliar service terminology and incomplete accessibility information can make independent information-seeking difficult for older adults.

> **How might we help older adults in Greater Melbourne independently discover, understand and access suitable local activities, healthcare, aged-care support and essential services through a simple, accessible and trustworthy platform?**

---

## Live Deployment

### Frontend

https://age-friendly-australia.onrender.com

### Backend API

https://age-friendly-australia-api.onrender.com

Health check:

```text
https://age-friendly-australia-api.onrender.com/api/health
```

> The Render free tier may cold-start after inactivity, so the first request can take longer than later requests.

---

## 1. Project Scope

### In scope

- Local activities, classes, programs and events
- Healthcare, aged-care support and essential service discovery
- Search and filtering using general, non-sensitive criteria
- Preference-based activity relevance
- Saved activities and services
- Age-friendly interface and text-size controls
- Location and accessibility information where verified data is available
- Nearest public-transport-stop information
- Dynamic Victorian community-venue information
- Live PTV bus vehicle information
- External map and directions links
- Privacy-aware use of voluntarily provided preferences

### Out of scope

- User-to-user social networking
- Public user profiles
- User posts, chat or private messaging
- Storage of medical records or diagnosis information
- Detailed user location history
- Full journey planning
- Clinical advice or healthcare diagnosis
- In-platform service eligibility decisions
- In-platform transport ticketing

Transport information is treated as **supporting access information**, not as the primary purpose of the platform.

---

## 2. Target Users and Personas

The primary target users are older adults living independently in Greater Melbourne.

The project uses three complementary personas:

| Persona | Primary epic(s) | Supporting epic(s) | Primary need |
| --- | --- | --- | --- |
| **Wang Yu** | EP1, EP2, EP6 | EP3, EP4, EP5 | Find, understand and revisit local activity and essential-service information independently |
| **Robert Wilson** | EP2 | EP3, EP5, EP6 | Understand and access healthcare, aged-care and essential support |
| **Margaret Evans** | EP1, EP4 | EP3, EP5, EP6 | Discover relevant local activities and events with less repeated searching |

These personas represent different combinations of digital confidence, service-access needs, activity-discovery needs and accessibility concerns.

---

## 3. Design Thinking and Design Principles

### 3.1 Updated Lotus Blossom process

The requirements were refined through two linked Lotus Blossom activities rather than starting from a predetermined feature list.

#### Stage 1 — Problem exploration

The first Lotus Blossom placed **Age-Friendly Australia** at the centre and explored eight recurring problem areas:

| Problem theme | Examples identified |
| --- | --- |
| **Information Fragmentation** | Multiple sources, scattered activity/service information and difficult comparison |
| **Healthcare Access** | Finding nearby healthcare, providers, opening hours and contact information |
| **Aged-Care Complexity** | Unclear terminology, eligibility, providers, costs and support options |
| **Activity Discovery** | Activities spread across websites, unclear schedules and difficulty matching interests |
| **Digital Accessibility** | Small text/buttons, complex navigation, unclear icons and inconsistent layouts |
| **Information Trust** | Unclear sources/update dates, conflicting details and potentially outdated information |
| **Location & Access** | Unclear venue/service locations, directions, distance and mobility information |
| **Privacy Concerns** | Unnecessary personal details, health-information concerns and location tracking |

These findings were consolidated into three focused problem directions:

1. Local Activity Discovery
2. Healthcare & Aged-Care Service Access
3. Digital Accessibility & Information Fragmentation

They were then combined into the overarching problem statement and How Might We question used by the project.

#### Stage 2 — Solution exploration

The second Lotus Blossom placed the How Might We question at the centre. Eight solution clusters were generated and evaluated against user value, problem alignment, data availability and implementation feasibility.

| Solution cluster | Requirements outcome |
| --- | --- |
| **Activity Discovery** | EP1 — Local Activities & Events Discovery |
| **Health & Service Discovery** | EP2 — Health & Essential Services Discovery |
| **Clear Information** | Cross-cutting principle integrated mainly across EP2 and EP3 |
| **Age-Friendly Accessibility** | EP3 — Age-Friendly Accessibility |
| **Relevant Discovery** | EP4 — Preference-Based Personalisation |
| **Privacy & User Control** | Cross-cutting principle across EP3, EP4 and EP5 |
| **Save & Revisit** | EP5 — Saved & Recent Items |
| **Location & Access** | EP6 — Location & Access Information |

This process produced six final epics. **Clear Information** and **Privacy & User Control** were intentionally retained as cross-cutting principles rather than being turned into separate epics.

### 3.2 Design principles

The interface is designed around age-friendly interaction principles:

- **Readable by default** — clear typography, strong contrast and generous spacing
- **Simple navigation** — visible top-level destinations and shallow navigation
- **Large labelled controls** — actions use understandable labels rather than relying only on icons
- **Clear information hierarchy** — important details are prioritised
- **Low information overload** — repeated card patterns and concise content
- **Source-aware presentation** — unavailable information is not fabricated
- **Privacy-aware personalisation** — preferences are voluntary and non-sensitive
- **Accessible decision support** — location, distance, transport and accessibility information are shown where supported

The project’s high-fidelity prototype explored a wider end-to-end interaction concept. The current coded build focuses primarily on **discovery, understanding, saving and access support** rather than implementing a full booking platform.

---

## 4. Epic Structure

The final requirements were organised into six epics.

| Epic | Name | Current Build |
| --- | --- | --- |
| **EP1** | Local Activities & Events Discovery | ✅ Implemented |
| **EP2** | Health & Essential Services Discovery | 🟡 Core service-discovery flow implemented with aged-care data; broader healthcare/essential-service coverage is not yet connected |
| **EP3** | Age-Friendly Accessibility | ✅ Implemented |
| **EP4** | Preference-Based Personalisation | ✅ Implemented for supported activity preferences |
| **EP5** | Saved & Recent Items | 🟡 Saving implemented; recently viewed remains future work |
| **EP6** | Location & Access Information | ✅ Implemented where source/location data is available |

### Requirements baseline

The refined baseline contains **14 Detailed User Stories**: **9 Must** priorities and **5 Should** priorities.

| Epic | Detailed User Stories | Priority split |
| --- | --- | --- |
| **EP1** | US1.1–US1.3 | 3 Must |
| **EP2** | US2.1–US2.3 | 2 Must, 1 Should |
| **EP3** | US3.1–US3.2 | 2 Must |
| **EP4** | US4.1–US4.2 | 2 Should |
| **EP5** | US5.1–US5.2 | 1 Must, 1 Should |
| **EP6** | US6.1–US6.2 | 1 Must, 1 Should |

Acceptance Criteria are maintained as checklist tasks inside the corresponding Detailed User Story cards on LeanKit. They should only be marked complete when the current build and testing evidence demonstrate the required behaviour.

### EP1 — Local Activities & Events Discovery

Users can:

- Browse local activities
- Search activities
- Filter by supported criteria
- View activity details
- Use voluntarily selected preferences to improve relevance
- Save activities for later

The current Iteration 1 activity dataset contains **20 prepared activity records** compiled from public library/council information.

### EP2 — Health & Essential Services Discovery

The current coded build implements the **core service-discovery flow**, using the verified Aged Care Service List as the connected production dataset.

Users can:

- Browse aged-care service information
- Search the connected service records
- Filter by general area and service type
- View service details
- Sort services by approximate distance from a selected area
- Save services for later

The current database contains **198 verified aged-care service records** focused on South-East Melbourne.

The following ideas remain part of the wider requirements/design space but are **not yet backed by dedicated production datasets**:

- GP services
- Broader healthcare search
- Broader essential-service coverage

Some desired fields from the requirements, such as opening hours, phone numbers, eligibility details or accessibility attributes, are **source-dependent**. The detail UI can present these fields when supplied, but the application does not invent values when the verified source does not provide them.

### EP3 — Age-Friendly Accessibility

Current accessibility support includes:

- Global text-size adjustment
- Readable typography
- Large controls
- Clear headings and labels
- Consistent layouts
- Simple navigation
- Clear loading, empty and error states

### EP4 — Preference-Based Personalisation

Users can voluntarily provide supported non-sensitive preferences such as:

- General area
- Interests
- Preferred days
- Activity type

Activity relevance is improved using preference scoring rather than sensitive personal or health information.

### EP5 — Saved & Recent Items

Current build:

- ✅ Save activities
- ✅ Save services
- ✅ View saved activities
- ✅ View saved services
- ✅ Remove saved items
- ✅ Saved item references stay in the local browser
- ⏳ Recently viewed activity/service history is not yet implemented as a separate feature

### EP6 — Location & Access Information

Current support includes:

- Destination location
- Approximate service distance from supported suburb locations
- Nearest public transport stop
- Approximate distance to the nearest stop
- Location and nearest-stop information on activity/service detail pages
- External map links in the Live Information experience
- Accessibility information where provided by the source

A dedicated **Directions** action from the current activity/service detail pages is not yet implemented.

---

## 5. Current Implementation Status

### Core application

| Feature | Status |
| --- | --- |
| Home page | ✅ |
| Activities listing | ✅ |
| Activity search/filtering | ✅ |
| Activity detail page | ✅ |
| Activity preference scoring | ✅ |
| Preferences page | ✅ |
| Aged-care services listing | ✅ |
| Service search/filtering for connected records | ✅ |
| Broader GP/healthcare/essential-service datasets | ⏳ |
| Service detail page | ✅ |
| Service distance sorting | ✅ |
| Saved activities/services | ✅ |
| Global text-size accessibility | ✅ |
| Nearest transport stop | ✅ |
| Approximate stop distance | ✅ |
| External map links on Live page | ✅ |
| Dedicated Directions action from activity/service details | ⏳ |
| Live information page | ✅ |
| Dynamic Vicmap community venues | ✅ |
| PTV GTFS-Realtime bus positions | ✅ |
| PTV route filtering | ✅ |
| Frontend → backend REST architecture | ✅ |
| SQLite database | ✅ |
| Express backend | ✅ |
| Production deployment on Render | ✅ |

### Partial / source-dependent

| Feature | Status |
| --- | --- |
| Service accessibility filter | 🟡 UI supported; source attributes are limited |
| Service opening hours | 🟡 Only when supplied by verified source |
| Service contact details | 🟡 Only when supplied by verified source |
| Service eligibility information | 🟡 Source-dependent / not available for all records |
| Activity accessibility details | 🟡 Source-dependent |
| Activity organiser / availability / registration information | 🟡 Source-dependent |

### Planned / future work

| Feature | Status |
| --- | --- |
| Recently viewed items | ⏳ |
| National Public Toilet Map integration | ⏳ |
| Production-grade scheduled database refresh | ⏳ |
| Weather integration | ⏳ |
| UV Index integration | ⏳ |
| Air Quality integration | ⏳ |
| Outdoor activity suitability indicator | ⏳ |
| Additional verified service fields | ⏳ |

---

## 6. System Architecture

Earlier prototypes loaded prepared datasets directly in the frontend.

The current implementation uses a separated frontend/backend architecture:

```text
                           +-----------------------------+
                           |        Vue Frontend         |
                           | Home / Activities /         |
                           | Services / Saved / Live     |
                           +-------------+---------------+
                                         |
                                         | REST API
                                         v
                           +-----------------------------+
                           |       Express Backend       |
                           |       Node.js + CORS        |
                           +------+---------------+------+
                                  |               |
                         Stored   |               | External
                         data     |               | services
                                  v               v
                       +----------------+   +----------------------+
                       | SQLite        |   | Vicmap FOI REST API  |
                       | activities    |   +----------------------+
                       | services      |
                       | transit_stops |   +----------------------+
                       +----------------+   | PTV GTFS-Realtime    |
                                            +----------------------+
```

This separates:

- Presentation logic
- Frontend data-access logic
- Backend API logic
- Stored application data
- Dynamic external data
- Realtime transport data
- Private backend credentials

---

## 7. Frontend Routes

The current Vue Router configuration includes:

```text
/                    Home
/activities          Activity discovery
/activities/:id      Activity details
/services            Service discovery
/services/:id        Service details
/preferences         Non-sensitive preferences
/saved               Saved activities and services
/live                Dynamic and realtime information
```

---

## 8. Data Architecture

Not all application data is realtime.

### Stored application data

Activities, services and transit stops are stored in SQLite and served to the frontend through the Express API.

```text
Prepared / verified source data
          |
          v
Filtering / cleaning / preparation
          |
          v
SQLite database
          |
          v
Express REST API
          |
          v
Frontend service layer
          |
          v
Vue views
```

### Dynamic external data

Vicmap community venue information is retrieved dynamically through the backend:

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
Live Information page
```

### Realtime data

PTV vehicle positions use GTFS-Realtime:

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
Live Information page
```

A short backend cache is used to reduce unnecessary repeated requests to the PTV realtime feed.

---

## 9. Database

Database file:

```text
age-friendly-database/age-friendly.db
```

The current backend opens the application database in **read-only mode** during normal API operation.

### `activities`

Current Iteration 1 records:

```text
20
```

Key fields include:

- Event name
- Category tags
- Venue
- Suburb
- Day/time
- Recurrence
- Older-adult relevance
- Source information

API:

```http
GET /api/activities
```

### `services`

Current verified records:

```text
198
```

Current scope:

```text
South-East Melbourne
```

Key fields include:

- Service name
- Provider name
- Care type
- Organisation type
- Address
- Suburb
- Postcode
- Latitude
- Longitude
- Source information

API:

```http
GET /api/services
```

### `transit_stops`

Current prepared GTFS lookup:

```text
4,994 bus stops
```

Key fields include:

- Stop ID
- Stop name
- Latitude
- Longitude

API:

```http
GET /api/transit-stops
```

These records support nearest-stop calculations for activity and service detail pages.

---

## 10. Open and Public Data Sources

| Dataset / Service | Source | Format | Current Use |
| --- | --- | --- | --- |
| **Aged Care Service List** | Australian Government aged-care data | XLSX / CSV | Service dataset and service-sync utility |
| **PTV GTFS Schedule** | Transport Victoria open data | GTFS ZIP | Static transit-stop lookup and GTFS sync utility |
| **Vicmap Features of Interest** | Victorian Government Data Vic | REST / GIS data | Dynamic community/senior-friendly venue information |
| **PTV GTFS-Realtime** | Transport Victoria open data | GTFS-Realtime | Live bus vehicle positions |
| **Public library/council event information** | Public local sources | Prepared records | Iteration 1 activity sample |
| **National Public Toilet Map** | data.gov.au | CSV / JSON / XML / API | Planned future integration |
| **Open-Meteo** | Open API | JSON | Future weather work |
| **EPA Victoria environmental monitoring** | Victorian environmental data | API | Future air-quality work |

### Data-quality principle

The application does **not fabricate missing source fields**.

If verified data does not provide a phone number, opening hours, eligibility information, accessibility information or another field, the UI should either omit the field or clearly indicate that the source did not provide it.

---

## 11. Data Freshness Strategy

The project distinguishes between stored, dynamic and realtime data.

| Data | Type | Current runtime behaviour |
| --- | --- | --- |
| Activities | Prepared Iteration 1 dataset | Stored in SQLite |
| Aged-care services | Verified source snapshot | Stored in SQLite |
| GTFS bus stops | GTFS Schedule snapshot | Stored in SQLite |
| Vicmap venues | Dynamic external data | Requested through backend |
| PTV vehicle positions | Realtime transport data | Requested through backend with short cache |

### Backend sync utilities

The repository now includes:

```text
age-friendly-database/syncAgedCareData.js
age-friendly-database/syncGtfsStops.js
```

`syncAgedCareData.js` can:

1. Download the official Victorian Aged Care Service List
2. Filter it to the project’s South-East Melbourne scope
3. Replace the `services` table with refreshed records

The script contains a daily 3:00 AM cron definition.

`syncGtfsStops.js` can:

1. Download the current Victorian GTFS Schedule
2. Extract Metro Bus `stops.txt`
3. Filter stops to the project’s South-East Melbourne bounding box
4. Replace the `transit_stops` table

The script contains a weekly Monday 3:00 AM cron definition.

### Important production note

These sync scripts are currently **backend maintenance utilities, not a guaranteed production scheduler**.

The deployed `server.js` does not automatically import or start these jobs. The production Render backend currently serves the committed SQLite database in read-only mode.

A future production-grade refresh design should use:

- Durable/persistent storage
- A reliable external scheduler or scheduled job
- Controlled database replacement/update
- Validation before refreshed data becomes active

Therefore the current README intentionally does **not** describe the deployed database as automatically updating every day/week.

---

## 12. Backend REST API

Default local backend:

```text
http://localhost:3000
```

Production backend:

```text
https://age-friendly-australia-api.onrender.com
```

### Health check

```http
GET /api/health
```

### Activities

```http
GET /api/activities
```

Returns activity records from SQLite.

### Services

```http
GET /api/services
```

Returns service records from SQLite.

### Transit stops

```http
GET /api/transit-stops
```

Returns the stored PTV GTFS bus-stop lookup.

### Dynamic Vicmap community venues

```http
GET /api/realtime/community-venues
```

Supported query parameters:

```text
type
subtype
limit
```

Example:

```text
/api/realtime/community-venues?subtype=senior%20citizens&limit=10
```

### PTV realtime bus positions

```http
GET /api/realtime/bus-positions
```

Supported query parameters:

```text
routeId
limit
```

Example:

```text
/api/realtime/bus-positions?routeId=901&limit=10
```

---

## 13. Frontend Service Layer

Vue views do not directly access the SQLite database.

Frontend data access is separated into service modules such as:

```text
src/services/activityService.js
src/services/serviceService.js
src/services/transitStopsService.js
src/services/liveDataService.js
src/services/preferencesService.js
src/services/savedItemsService.js
src/services/distanceService.js
```

Example runtime flow:

```text
ActivitiesView.vue
        |
        v
activityService.js
        |
        v
GET /api/activities
        |
        v
Express server.js
        |
        v
SQLite activities
```

The same pattern is used for services and transit stops.

---

## 14. Preference and Distance Logic

### Activity preference scoring

The current activity-discovery flow uses supported preference criteria to improve relevance.

The Iteration 1 scoring work considers factors such as:

- General area
- Interests
- Preferred days
- Activity type

Personalisation uses only voluntarily selected, non-sensitive preferences.

### Service distance sorting

Service distance is calculated from supported suburb centroid coordinates using a Haversine-distance implementation.

Relevant files include:

```text
src/services/suburbCoordinates.js
src/services/distanceService.js
```

### Nearest transport stop

The frontend uses the stored PTV GTFS stop lookup to find the nearest stop for supported activity and service locations.

Relevant file:

```text
src/services/transitStopsService.js
```

This is supplementary access information and is not presented as a full public-transport journey planner.

---

## 15. Privacy and Security

The project follows a data-minimisation approach.

The application does not require:

- Medical records
- Diagnosis information
- Detailed location history
- Public user profiles
- User posts
- Private messaging

Saved item references and preferences are stored locally in the browser where applicable.

Sensitive external API credentials are kept on the backend rather than exposed through frontend source code.

### Dependency security

The backend uses SheetJS `xlsx` 0.20.3 from the official SheetJS distribution rather than the older npm-registry `xlsx@0.18.5` version that produced high-severity audit findings during integration.

After the dependency update, the backend dependency audit reported:

```text
found 0 vulnerabilities
```

Security should continue to be checked as dependencies and external data integrations evolve.

---

## 16. Technology Stack

### Frontend

- Vue 3
- Vue Router
- Vite
- JavaScript
- HTML5
- CSS
- Browser `localStorage`

### Backend

- Node.js
- Express
- CORS
- dotenv

### Database and data processing

- SQLite
- sqlite3
- csv-parser
- unzipper
- SheetJS (`xlsx`)
- node-cron
- gtfs-realtime-bindings

### External data/services

- Victorian Government Vicmap Features of Interest
- PTV GTFS Schedule
- PTV GTFS-Realtime
- Australian Government aged-care data
- Public library/council information used for the activity sample

### Development and deployment

- Git
- GitHub
- Render

---

## 17. Project Structure

```text
age-friendly-australia/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── router/
│   ├── services/
│   ├── utils/
│   └── views/
│
├── age-friendly-database/
│   ├── age-friendly.db
│   ├── server.js
│   ├── initDb.js
│   ├── importData.js
│   ├── vicmapFoiService.js
│   ├── ptvRealtimeService.js
│   ├── syncAgedCareData.js
│   ├── syncGtfsStops.js
│   └── package.json
│
├── data/
│   └── sample/
│
├── package.json
└── README.md
```

---

## 18. Local Development

### Prerequisites

The frontend currently declares support for:

```text
Node.js ^22.18.0 or >=24.12.0
```

You also need:

- npm
- Git
- A PTV Open Data API key for the live PTV backend integration

---

### 18.1 Clone the repository

```bash
git clone https://github.com/YUCHENLU666/age-friendly-australia.git
cd age-friendly-australia
```

### 18.2 Install frontend dependencies

```bash
npm install
```

### 18.3 Install backend dependencies

```bash
cd age-friendly-database
npm install
cd ..
```

### 18.4 Configure backend environment variables

Create:

```text
age-friendly-database/.env
```

Add the required PTV credential using the environment-variable name expected by the backend PTV service.

Do **not** commit real API keys.

### 18.5 Configure frontend API base URL

Create a root `.env` when needed:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 18.6 Start the backend

From:

```text
age-friendly-database/
```

run:

```bash
npm start
```

Backend:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

### 18.7 Start the frontend

From the project root:

```bash
npm run dev
```

Vite will print the local frontend URL.

---

## 19. Important Database Safety Note

Do not run database rebuild or sync scripts casually against a database you want to preserve.

The following scripts can modify or recreate stored data:

```text
age-friendly-database/initDb.js
age-friendly-database/importData.js
age-friendly-database/syncAgedCareData.js
age-friendly-database/syncGtfsStops.js
```

In particular, the sync scripts replace the contents of their target tables.

Back up the database before destructive maintenance operations.

---

## 20. Production Deployment

### Frontend

Render Static Site:

```text
https://age-friendly-australia.onrender.com
```

Frontend environment:

```env
VITE_API_BASE_URL=https://age-friendly-australia-api.onrender.com/api
```

### Backend

Render Web Service:

```text
https://age-friendly-australia-api.onrender.com
```

Backend root directory:

```text
age-friendly-database
```

Backend build command:

```bash
npm ci --build-from-source=sqlite3
```

Backend start command:

```bash
npm start
```

The explicit SQLite build-from-source step is used to avoid native binary compatibility problems in the deployment environment.

---

## 21. Requirements Traceability Summary

The updated requirements and project-work traceability chain is:

```text
Research evidence
      ↓
Problem Exploration Lotus Blossom
      ↓
Three focused problem directions
      ↓
Overarching problem statement and HMW
      ↓
Personas and empathy maps
      ↓
Solution Exploration Lotus Blossom
      ↓
Eight solution clusters
      ↓
Six epics + cross-cutting principles
      ↓
Epic Stories
      ↓
14 Detailed User Stories
      ↓
Acceptance Criteria in LeanKit Tasks
      ↓
Implementation and evidence
      ↓
Testing / Definition of Done
```

Current examples:

| Identified problem | Epic | Implemented response |
| --- | --- | --- |
| Activity information fragmentation | EP1 | Search, filters, activity details |
| Healthcare / aged-care complexity | EP2 | Aged-care service discovery and structured service details; broader healthcare/essential-service coverage remains incomplete |
| Small text / complex navigation | EP3 | Text-size controls and accessible UI |
| Too many irrelevant options | EP4 | Non-sensitive preference scoring |
| Repeated searching | EP5 | Saved activities and services |
| Unclear location and access | EP6 | Location, distance and nearest-stop support; dedicated detail-page Directions action remains future work |

Acceptance criteria should be interpreted against the data the current verified sources actually provide. A requirement for a field does not mean the project should fabricate that field when the source does not contain it.

### LeanKit card hierarchy

The revised LeanKit board uses Parent/Child Cards to preserve traceability without creating a separate card for every Acceptance Criterion.

| Level | Card type | Code example | Relationship |
| --- | --- | --- | --- |
| **L0** | Project | `AFA` | Root card |
| **L1** | Workstream | `AFA-REQ` | Child of project |
| **L2** | Main artefact or epic | `AFA-REQ-EP1` | Child of workstream |
| **L3** | Supporting artefact or Epic Story | `AFA-REQ-EP1-ES` | Child of L2 card |
| **L4** | Detailed User Story | `AFA-REQ-EP1-US1.1` | Child of Epic Story |
| **Task** | AC, implementation or test checklist | `AC1 – Activity results displayed` | Inside the Detailed User Story card |

The seven L1 workstreams are:

```text
AFA – Age-Friendly Australia
├── AFA-DISC  Problem Discovery & Ideation
├── AFA-PER   Personas & Empathy Maps
├── AFA-REQ   Requirements Engineering
├── AFA-DATA  Open Data & Data Mapping
├── AFA-BUILD Prototype & UI Development
├── AFA-TEST  Testing & Validation
└── AFA-GOV   Project Governance Portfolio
```

Epic Story cards sit between each epic and its Detailed User Stories. Build cards reference the relevant User Story IDs, and testing cards reference the corresponding User Stories and Acceptance Criteria.

### Current documented board snapshot

The revised board plan contains **76 cards** across six team assignments.

| Lane | Cards | Current documented scope |
| --- | ---: | --- |
| **DONE** | 11 | Five problem-discovery/ideation artefacts and six persona/empathy-map artefacts |
| **DOING** | 59 | Board structure, requirements, epic hierarchy, data work, prototype/build work and governance |
| **TODO** | 6 | Testing, accessibility review, feedback, defect handling and requirements updates |
| **Total** | **76** | Complete planned card hierarchy |

These LeanKit lanes describe the status of project cards and evidence. They are separate from the coded feature-status tables in Section 5; a feature may already exist in code while its documentation, review or test evidence remains in `DOING`.

### Team assignment

| Member | Assigned scope | Planned cards |
| --- | --- | ---: |
| **Member 1** | Root, all L1 workstreams, Problem Discovery & Ideation | 13 |
| **Member 2** | Personas & Empathy Maps, EP1, initial open-data source identification | 12 |
| **Member 3** | Epic ideation, EP2 and EP3 | 13 |
| **Member 4** | EP4, EP5 and EP6 | 12 |
| **Member 5** | Open Data & Data Mapping, Prototype & UI Development | 13 |
| **Member 6** | Testing & Validation, Project Governance Portfolio | 13 |

Parent cards must be created before their children. Existing work should only be placed in `DONE` when the corresponding artefact or evidence exists; planned or partially verified work remains in `DOING` or `TODO`.

---

## 22. Current Limitations

The current build has several deliberate limitations:

1. The Iteration 1 activity dataset contains a small prepared sample rather than a comprehensive live Greater Melbourne event feed.
2. The aged-care dataset does not provide every desired UI field.
3. Accessibility metadata is incomplete across some source records.
4. The GTFS stop dataset is a stored schedule snapshot, not realtime stop information.
5. PTV vehicle positions are realtime, but the platform is not a journey planner.
6. Vicmap data is dynamically requested, but it should not be described as the same type of realtime feed as PTV vehicle positions.
7. The scheduled sync scripts are not currently guaranteed to execute in production.
8. Recently viewed items are not yet implemented as a separate feature.
9. Public toilet discovery is not yet connected to the current interface.
10. The current production service catalogue is aged-care focused; dedicated GP, broader healthcare and wider essential-service datasets are not yet connected.
11. Activity and service detail pages currently provide location/nearest-stop support but do not yet include a dedicated Directions action.

These limitations are documented rather than hidden so that project claims remain consistent with the implemented build.

---

## 23. Future Work

Potential future improvements include:

- Production-grade scheduled data refresh
- Durable cloud database/storage
- National Public Toilet Map integration
- More comprehensive Greater Melbourne activity feeds
- Broader GP, healthcare and essential-service datasets
- Additional verified service contact/opening/eligibility fields
- Dedicated Directions actions from activity/service detail pages
- Recently viewed activities and services
- Weather, UV and air-quality integrations
- Outdoor activity suitability indicators
- Expanded accessibility metadata
- Further usability testing with older adults
- Additional automated API and UI testing

---

## 24. SDG Alignment

### SDG 3 — Good Health and Well-being

The project supports access to healthcare, aged-care support and understandable service information that can help older adults manage everyday needs.

### SDG 11 — Sustainable Cities and Communities

The project supports more inclusive access to local activities, services and urban information for older people.

---

## 25. Design Prototype

High-fidelity prototype:

https://kiwi-navy-66840758.figma.site

The prototype informed the project’s age-friendly visual language, navigation structure and interaction principles. Some prototype concepts are broader than the currently implemented production scope.

---

## Repository

https://github.com/YUCHENLU666/age-friendly-australia
