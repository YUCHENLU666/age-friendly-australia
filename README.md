# Age Friendly Australia

Age Friendly Australia is a Vue-based web application designed to help older adults living independently in Greater Melbourne discover useful local activities, healthcare services, aged-care support and essential everyday services through a simple, accessible and privacy-aware interface.

The project focuses on reducing the need to search across multiple websites by bringing relevant information into one consistent interface.

---

## Project Goals

The application aims to:

- Help older adults discover suitable local activities and services.
- Present information using clear language and an age-friendly interface.
- Support filtering using broad, non-sensitive preferences.
- Allow users to save useful information for later.
- Provide adjustable text size and clear navigation.
- Present location, accessibility and supporting transport information when verified data is available.
- Avoid requiring unnecessary sensitive personal information.
- Avoid storing health records, diagnosis information or detailed location history.

---

# Current Iteration

The current implementation focuses on the core frontend architecture and Iteration 1 features.

### Current status

| Area | Status |
| --- | --- |
| Home page | ✅ Implemented |
| Activity discovery | ✅ Implemented |
| Activity filtering | ✅ Implemented |
| Activity detail page | ✅ Implemented |
| Preference-based personalisation | ✅ Implemented |
| Global text-size accessibility | ✅ Implemented |
| Saved activities | ✅ Implemented |
| Saved services architecture | ✅ Implemented |
| Service discovery interface | ✅ Implemented |
| Service filtering interface | ✅ Implemented |
| Verified service dataset | ⏳ Pending |
| Service detail page | ✅ Data-ready |
| Public transport data integration | ⏳ Pending |
| Scheduled backend data refresh | ⏳ Future implementation |

The Services interface is intentionally designed not to display fictional provider information. Search filters remain unavailable until verified service data is connected.

---

# User Stories

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

#### AC1 — Discovery and recommendations

The system should allow the user to use:

- General area
- Date
- Interest
- Result type

to discover matching:

- Local activities
- Healthcare services
- Senior support
- Essential services
- Public toilets

Recommendations should use only voluntarily selected, non-sensitive preferences.

#### AC2 — Information and transport access

Each result should display relevant available information including:

- Name
- Type
- Description
- Date or opening hours
- Location
- Contact information
- Accessibility information
- Data source

Where joined transport and location data is available, the platform should also provide:

- Nearest public transport stop
- Approximate distance

#### AC3 — Saving, accessibility and privacy

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
- Understand eligibility information.
- Check opening hours and contact information.
- Check location and accessibility information.
- Save useful services for later.
- Use the platform without providing medical records or diagnosis information.

### Acceptance Criteria

#### AC1 — Relevant service discovery

The user should be able to select:

- General area
- Service type
- Accessibility needs

and receive relevant:

- Healthcare services
- Aged-care support
- Essential local services

The application should not require medical records or diagnosis information to provide these results.

#### AC2 — Clear and trusted service information

Each service result should display verified information including:

- Provider
- Service purpose
- Eligibility
- Opening hours
- Location
- Contact details
- Accessibility information
- Data source

Where joined location data is available, the system should also display:

- Nearest public transport stop
- Approximate distance

#### AC3 — Saving, accessibility and privacy

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

#### AC1 — Activity discovery and matching

The user should be able to select:

- General area
- Preferred date
- Interest
- Activity type

The system should use only these voluntarily provided preferences to improve activity relevance.

#### AC2 — Activity and participation information

Where supplied by the source dataset, activity results should provide:

- Activity name
- Category
- Organiser
- Date and time
- Venue
- Availability
- Accessibility details
- Data source
- Joining or external registration information

Where joined transport data is available, the application should also display:

- Nearest public transport stop
- Approximate distance

#### AC3 — Saving, accessibility and privacy

Margaret should be able to:

- Save activities
- View saved activities
- Remove saved activities

The application should use:

- Readable text
- Large labelled controls
- Simple language
- Clear navigation

The platform does not require:

- Public user profiles
- User posts
- Private messages
- Sensitive personal information
- Detailed location history

---

# Epic Mapping

| Epic | Description | Current Implementation |
| --- | --- | --- |
| **EP1 — Local Activity Discovery** | Discover activities, classes and events with filtering | ✅ Implemented |
| **EP2 — Health & Essential Services** | Discover healthcare, aged-care support and essential services | 🟡 Interface implemented; verified service data pending |
| **EP3 — Age-Friendly Accessibility** | Adjustable text size, clear navigation and readable interface | ✅ Implemented |
| **EP4 — Preference-Based Personalisation** | Use voluntary non-sensitive preferences to improve relevance | ✅ Implemented |
| **EP5 — Saved & Recent Items** | Save useful activities/services for later | ✅ Saved architecture implemented |
| **EP6 — Location & Access Information** | Location, accessibility and supporting transport information | 🟡 Partial; transport integration pending |

---

# Requirements Traceability

The table below connects the project requirements with the current implementation.

| Feature | Related User Story | Related AC | Status |
| --- | --- | --- | --- |
| Activity search | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ Implemented |
| General-area activity filtering | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ Implemented |
| Interest filtering | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ Implemented |
| Activity-type filtering | Margaret | Margaret AC1 | ✅ Implemented |
| Activity information cards | Wang / Margaret | Wang AC2, Margaret AC2 | 🟡 Limited by available source fields |
| Activity details | Wang / Margaret | Wang AC2, Margaret AC2 | ✅ Implemented with source-aware missing-field handling |
| Preferences | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ Implemented |
| Global text-size control | All personas | AC3 | ✅ Implemented |
| Clear navigation | All personas | AC3 | ✅ Implemented |
| Save activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ Implemented |
| View saved activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ Implemented |
| Remove saved activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ Implemented |
| Service search interface | Wang / Robert | Wang AC1, Robert AC1 | ✅ Interface implemented |
| Service filters | Robert | Robert AC1 | 🟡 Disabled until verified service data is connected |
| Service information cards | Robert | Robert AC2 | 🟡 Data-ready |
| Service details | Robert | Robert AC2 | 🟡 Data-ready |
| Save services | Wang / Robert | Wang AC3, Robert AC3 | ✅ Architecture implemented |
| Public toilet discovery | Wang | Wang AC1 | ⏳ Dataset integration pending |
| Nearest transport stop | Wang / Robert / Margaret | AC2 | ⏳ Pending |
| Approximate transport distance | Wang / Robert / Margaret | AC2 | ⏳ Pending |
| No sensitive health information required | Wang / Robert | AC3 | ✅ Supported by design |
| No detailed location history | All personas | AC3 | ✅ Supported by design |

---

# Implemented Features

## Home

The Home page provides:

- Clear project introduction
- Direct navigation to activities and services
- Age-friendly content hierarchy
- Accessibility and privacy information

---

## Activities

The Activities feature currently supports:

- Loading activity records from the project dataset
- Keyword search
- General-area filtering
- Interest filtering
- Day filtering
- Recurrence filtering
- Older-adult relevance filtering
- Activity cards
- Activity detail pages
- Source attribution
- Saved activities

Activity information is normalised through the application's data service layer.

If a field is not provided by the original dataset, the interface does not invent the missing information.

---

## Preferences

Users can voluntarily save non-sensitive preferences including:

- General area
- Interests
- Preferred days
- Activity types
- Text size

These preferences are used to improve activity relevance.

Preferences are stored locally in the browser.

The application does not require private health information or detailed location history for personalisation.

---

## Accessibility

A global text-size control is available through the navigation bar.

Available settings are:

- Standard
- Large
- Extra large

The selected text size applies across the application.

Other accessibility design considerations include:

- Large interactive controls
- Clear visual hierarchy
- High readability
- Simple navigation
- Clear labels
- Responsive layout

---

## Saved Items

The Saved page supports a shared saved-item structure for:

- Activities
- Services

Saved item IDs are stored locally in the browser.

Users can:

- Save an item
- View saved items
- Remove saved items
- Filter the Saved page by item type

The architecture already supports service saving even though the verified service dataset has not yet been connected.

---

## Services

The Services interface has been implemented with:

- Search field
- General-area filter
- Service-type filter
- Accessibility filter
- Service cards
- Service detail route
- Saved-service support
- Data-source fields
- Missing-data handling
- Privacy-aware messaging

### Current Data State

A verified service dataset has not yet been connected.

For this reason, service search controls remain disabled rather than presenting fictional healthcare or aged-care provider information.

Once verified service records are available, the existing service architecture can display and filter them without redesigning the page.

---

# Data Sources

The Iteration 1 open-data research identifies the following core datasets.

| Dataset | Coverage | Format | Intended Use |
| --- | --- | --- | --- |
| PTV GTFS Schedule | Victoria | GTFS | Public transport stops, routes and schedules |
| National Public Toilet Map | Australia | CSV / JSON / XML / API | Essential facilities |
| Vicmap Features of Interest | Victoria | GIS / Shapefile / REST API | Hospitals and other facilities |
| City of Melbourne Open Data Portal | City of Melbourne LGA | CSV / GeoJSON / API | Activities and venues |

The activity source has a geographic limitation because the City of Melbourne dataset does not cover all Greater Melbourne areas.

---

# Data Freshness Strategy

The project distinguishes between an external API and true real-time data.

The identified Iteration 1 datasets are published as periodically updated releases rather than continuous real-time streams.

The planned architecture is:

```text
External Open Data Sources
        ↓
Scheduled Backend Refresh
        ↓
Team Database
        ↓
Backend API
        ↓
Vue Frontend
```

The backend may periodically retrieve the latest CSV or API data and refresh the application's database.

The frontend should eventually use the team's backend rather than depending directly on external endpoints.

A separate real-time transport feed would only be required if the project later introduced features such as live vehicle arrival times.

---

# Application Architecture

```text
Vue Views
   │
   ├── HomeView
   ├── ActivitiesView
   ├── ActivityDetailView
   ├── ServicesView
   ├── ServiceDetailView
   ├── SavedView
   └── PreferencesView
        │
        ↓
Service Layer
   │
   ├── activityService
   ├── serviceService
   ├── preferencesService
   └── savedItemsService
        │
        ↓
Normalised Application Data
        │
        ↓
Local Dataset / Future Backend API
```

This structure allows the current prototype data source to be replaced later by a backend API without redesigning the frontend pages.

---

# Technology Stack

- Vue 3
- Vue Router
- Vite
- JavaScript
- HTML5
- CSS
- LocalStorage
- Git
- GitHub

---

# Environment Configuration

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_REMOTE_API=false
```

`VITE_USE_REMOTE_API=false` currently allows the application to use local project data.

A future backend implementation can switch the project to:

```env
VITE_USE_REMOTE_API=true
```

without requiring major changes to the frontend interface.

---

# Running the Project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

On Windows PowerShell, if script execution prevents the normal npm command, use:

```powershell
npm.cmd run dev
```

The development server will normally be available at:

```text
http://localhost:5173/
```

---

# Production Build

Run:

```bash
npm run build
```

or on Windows:

```powershell
npm.cmd run build
```

A successful build creates the production files in:

```text
dist/
```

Preview the production build with:

```bash
npm run preview
```

---

# Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/activities` | Activity discovery |
| `/activities/:id` | Activity details |
| `/services` | Service discovery |
| `/services/:id` | Service details |
| `/saved` | Saved items |
| `/preferences` | Preferences and accessibility settings |

---

# Privacy Principles

The project follows a minimal-data approach.

The application currently stores only voluntary non-sensitive settings and saved item references required for the user experience.

Examples include:

- General area preference
- Activity interests
- Preferred activity days
- Activity types
- Text-size preference
- Saved activity IDs
- Saved service IDs

The design does not require:

- Medical records
- Diagnosis information
- Exact home address
- Detailed location history
- Public profiles
- Private messaging

---

# Known Limitations

The current Iteration 1 implementation has several known limitations:

1. The current activity dataset does not provide every field required by the final acceptance criteria.
2. Some activity records do not contain exact dates, accessibility details, organiser information, availability or registration instructions.
3. Verified service provider data has not yet been connected.
4. Service filters therefore remain unavailable until verified service records exist.
5. Public transport joining has not yet been implemented.
6. Nearest-stop and approximate-distance information is not yet displayed.
7. The current activity data source does not provide complete Greater Melbourne coverage.

Missing source information is not fabricated by the application.

---

# Planned Next Steps

The next implementation stages include:

1. Evaluate and connect verified service data.
2. Integrate National Public Toilet Map data for essential facilities.
3. Integrate selected Vicmap facility information.
4. Join relevant service/activity locations with PTV GTFS stop data.
5. Add nearest-stop and approximate-distance information where appropriate.
6. Move external data retrieval into a backend refresh process.
7. Store refreshed records in the team's database.
8. Connect the Vue frontend to the backend API.

---

# Requirement Source Documents

Project requirements and implementation decisions are based on:

- User Stories & Epic Mapping
- Acceptance Criteria
- Updated Personas
- Open Data Research — Iteration 1 Dataset List

These documents should remain the source of truth when project scope or implementation decisions change.