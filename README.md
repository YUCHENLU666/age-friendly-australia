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
- Improve activity relevance using voluntarily selected preferences.
- Support older adults in making more confident decisions about local activities and services.
- Avoid requiring unnecessary sensitive personal information.
- Avoid storing health records, diagnosis information or detailed location history.

---

# Current Iteration

The current implementation focuses on the completed Iteration 1 frontend architecture, activity discovery, service discovery, personalisation, saved items, distance-based service ordering and supporting transport information.

### Current Status

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
| Service discovery interface | ✅ Implemented |
| Service search | ✅ Implemented |
| General-area service filtering | ✅ Implemented |
| Service-type filtering | ✅ Implemented |
| Accessibility service filter | 🟡 UI implemented; current dataset has limited accessibility data |
| Verified aged-care service dataset | ✅ Connected |
| Service detail page | ✅ Implemented |
| Service distance sorting | ✅ Implemented |
| Nearest public transport stop lookup | ✅ Implemented |
| Approximate transport-stop distance | ✅ Implemented |
| National Public Toilet Map integration | ⏳ Planned |
| Additional Vicmap facility integration | ⏳ Planned |
| Weather integration | ⏳ Iteration 2 |
| UV Index integration | ⏳ Iteration 2 |
| Air Quality integration | ⏳ Iteration 2 |
| Outdoor activity suitability indicator | ⏳ Iteration 2 |
| Scheduled backend data refresh | ⏳ Future implementation |

Iteration 1 currently includes a verified aged-care service dataset containing **198 service records** for South-East Melbourne.

The project also includes a filtered PTV GTFS bus-stop lookup containing approximately **4,994 bus stops** for South-East Melbourne. This data supports nearest-public-transport-stop calculations for both activity and service detail pages.

Service results can be searched, filtered and ordered using available verified information.

Missing information is not fabricated. If a verified source does not provide accessibility details, phone numbers, opening hours, eligibility information or another field, the application does not invent those values.

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

#### AC1 — Discovery and Recommendations

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

#### AC2 — Information and Transport Access

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

and receive relevant:

- Healthcare services
- Aged-care support
- Essential local services

The application should not require medical records or diagnosis information to provide these results.

#### AC2 — Clear and Trusted Service Information

Each service result should display verified available information including:

- Provider
- Service purpose
- Eligibility
- Opening hours
- Location
- Contact details
- Accessibility information
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
- Preferred date
- Interest
- Activity type

The system should use only these voluntarily provided preferences to improve activity relevance.

#### AC2 — Activity and Participation Information

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

#### AC3 — Saving, Accessibility and Privacy

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
| **EP2 — Health & Essential Services** | Discover healthcare, aged-care support and essential services | ✅ Aged-care service discovery implemented with verified data |
| **EP3 — Age-Friendly Accessibility** | Adjustable text size, clear navigation and readable interface | ✅ Implemented |
| **EP4 — Preference-Based Personalisation** | Use voluntary non-sensitive preferences to improve relevance | ✅ Implemented |
| **EP5 — Saved & Recent Items** | Save useful activities/services for later | ✅ Implemented |
| **EP6 — Location & Access Information** | Location, accessibility and supporting transport information | 🟡 Partially implemented; nearest-stop lookup completed and additional facility/accessibility integration planned |

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
| Activity preference scoring | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ Implemented |
| Preferences | Wang / Margaret | Wang AC1, Margaret AC1 | ✅ Implemented |
| Global text-size control | All personas | AC3 | ✅ Implemented |
| Clear navigation | All personas | AC3 | ✅ Implemented |
| Save activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ Implemented |
| View saved activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ Implemented |
| Remove saved activities | Wang / Margaret | Wang AC3, Margaret AC3 | ✅ Implemented |
| Service search | Wang / Robert | Wang AC1, Robert AC1 | ✅ Implemented |
| General-area service filtering | Wang / Robert | Wang AC1, Robert AC1 | ✅ Implemented |
| Service-type filtering | Robert | Robert AC1 | ✅ Implemented |
| Accessibility service filtering | Robert | Robert AC1 | 🟡 UI implemented; current source has limited accessibility attributes |
| Service information cards | Robert | Robert AC2 | ✅ Implemented with verified aged-care records |
| Service detail page | Robert | Robert AC2 | ✅ Implemented |
| Service distance sorting | Robert | Robert AC1 / AC2 | ✅ Implemented |
| Save services | Wang / Robert | Wang AC3, Robert AC3 | ✅ Implemented |
| View saved services | Wang / Robert | Wang AC3, Robert AC3 | ✅ Implemented |
| Remove saved services | Wang / Robert | Wang AC3, Robert AC3 | ✅ Implemented |
| Public toilet discovery | Wang | Wang AC1 | ⏳ Dataset integration planned |
| Nearest transport stop | Wang / Robert / Margaret | AC2 | ✅ Implemented |
| Approximate transport-stop distance | Wang / Robert / Margaret | AC2 | ✅ Implemented |
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
- Consistent access to the application's main functions

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
- Preference-based relevance scoring
- Activity cards
- Activity detail pages
- Source attribution
- Saved activities
- Nearest public transport stop information on detail pages
- Approximate distance to the nearest available transport stop

Activity information is normalised through the application's data service layer.

If a field is not provided by the original dataset, the interface does not invent the missing information.

---

## Activity Preference Scoring

The application supports preference-based activity ranking.

The current scoring mechanism uses four voluntarily provided, non-sensitive preference factors:

1. General area
2. Interests
3. Preferred days
4. Activity type

The scoring mechanism improves the relevance of activity ordering without requiring sensitive personal information.

This feature is implemented through the current activity filtering and preference architecture.

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
- Consistent interaction patterns
- Source-aware presentation of accessibility information

Accessibility information for individual services depends on the verified source dataset.

The current aged-care source does not provide complete accessibility attributes for every record. The interface therefore does not fabricate unavailable accessibility information.

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

The saved-item architecture supports both activity and service records.

---

## Services

The Services feature currently supports:

- Loading verified aged-care service records
- Keyword search
- General-area filtering
- Service-type filtering
- Accessibility filter architecture
- Distance-based service sorting
- Service cards
- Service detail pages
- Saved-service support
- Data-source fields
- Missing-data handling
- Privacy-aware messaging
- Nearest public transport stop lookup
- Approximate distance to the nearest available transport stop

### Current Service Data State

Iteration 1 uses:

```text
data/sample/EP2_aged_care_services_sample.csv
```

The dataset contains **198 aged-care service records**.

The records were filtered and deduplicated from an Australian Government aged-care service dataset.

The Iteration 1 sample focuses on South-East Melbourne, including:

- Monash
- Glen Eira
- Greater Dandenong
- Whitehorse
- Kingston
- Relevant surrounding and edge suburbs

Latitude and longitude are available for retained records and support distance-based calculations.

The current service dataset contains different aged-care service categories, including examples such as:

- Residential
- Home Care
- Short-Term Restorative Care
- Transition Care

Some information required by the final acceptance criteria is not consistently supplied by the current source.

This may include:

- Accessibility information
- Phone numbers
- Opening hours
- Eligibility details
- Additional provider information

Where information is unavailable from the verified source, the interface does not fabricate it.

---

# Service Distance Sorting

Iteration 1 includes distance-based service ordering.

The implementation uses:

```text
src/services/suburbCoordinates.js
src/services/distanceService.js
```

`suburbCoordinates.js` stores approximate coordinates for supported general areas.

`distanceService.js` calculates approximate geographic distance using the Haversine formula.

The basic calculation flow is:

```text
Selected general area
        ↓
Approximate suburb centroid
        ↓
Service latitude / longitude
        ↓
Haversine distance calculation
        ↓
Service results sorted nearest-first
```

Distance information is designed to support general local discovery rather than exact door-to-door navigation.

---

# Public Transport Access

Iteration 1 includes a filtered PTV GTFS bus-stop lookup dataset:

```text
data/sample/gtfs_stops_southeast_melbourne.csv
```

The lookup contains approximately **4,994 South-East Melbourne bus stops**.

It was prepared from the PTV GTFS Schedule dataset and is used programmatically rather than for direct manual browsing.

Nearest-stop functionality is implemented through:

```text
src/services/transitStopsService.js
```

The application uses a nearest-stop lookup for both:

- Activity detail pages
- Service detail pages

A typical result may be presented in the form:

```text
Nearest public transport stop:
Nepean Hwy / Centre Dandenong Rd
0.2 km away
```

This information is supplementary.

Transport journey planning is not the main purpose of Age Friendly Australia.

The current GTFS data is a static snapshot.

It does not provide:

- Live arrival times
- Live vehicle locations
- Delays
- Real-time disruption information

Those features would require additional real-time transport feeds and are outside the current Iteration 1 scope.

---

# Iteration 1 Technical Deliverables

The latest Iteration 1 technical work includes three key data-related features.

## AC-02 — Activity Preference Scoring

Activity relevance uses a four-factor weighted approach based on:

- General area
- Interests
- Preferred days
- Activity type

Status:

```text
✅ Implemented
```

---

## AC-03 — Service Distance Sorting

Service distance sorting uses:

```text
suburbCoordinates.js
+
distanceService.js
+
Haversine distance calculation
```

Results can be ordered nearest-first using the selected general area as an approximate reference point.

Status:

```text
✅ Implemented and verified
```

---

## AC-06 — Nearest Transport Stop

Nearest public transport stop lookup uses:

```text
gtfs_stops_southeast_melbourne.csv
+
transitStopsService.js
+
findNearestStop()
```

The functionality is applied to:

- Activity detail pages
- Service detail pages

Status:

```text
✅ Implemented and verified
```

---

# Data Sources

The Iteration 1 open-data research has confirmed the following core datasets.

| Dataset | Source / Coverage | Format | Intended Use | Current Status |
| --- | --- | --- | --- | --- |
| Aged Care Service List | Australian Government; statewide source filtered to South-East Melbourne | XLSX / CSV | Aged-care service discovery | ✅ Integrated |
| PTV GTFS Schedule | Victoria | GTFS | Public transport stops and nearest-stop lookup | ✅ Integrated as filtered snapshot |
| Vicmap Features of Interest | Victoria | GIS / Shapefile / REST API | Hospitals, libraries, community centres, aged-care facilities and other facilities | 🟡 Verified; further frontend integration planned |
| National Public Toilet Map | Australia | CSV / JSON / XML / API | Public toilets, essential facilities and accessibility support | 🟡 Verified; integration planned |
| Public library and council event sources | Local areas | Public web information / sample dataset | Community activity discovery | ✅ Used for Iteration 1 activity sample |
| Open-Meteo | Weather coverage | API | Weather and UV-related information | ⏳ Iteration 2 |
| EPA Victoria Environment Monitoring | Victoria | API | Air-quality information | ⏳ Iteration 2 |

---

# Iteration 1 Sample Datasets

## EP1 Activity Sample

Repository path:

```text
data/sample/EP1_sample_events_dataset.csv
```

Records:

```text
20
```

The activity sample was manually compiled using publicly available library and council event information.

It is used to validate:

- Activity discovery
- Filtering
- Personalisation
- Activity cards
- Activity detail pages
- Saved activities
- Preference scoring
- Transport-stop enrichment

The sample is considered final for Iteration 1.

---

## EP2 Aged-Care Services

Repository path:

```text
data/sample/EP2_aged_care_services_sample.csv
```

Records:

```text
198
```

The dataset was:

- Filtered from a statewide aged-care service source
- Deduplicated
- Focused on South-East Melbourne
- Prepared with latitude and longitude for retained records

The service dataset is considered final for Iteration 1.

---

## GTFS Bus Stops

Repository path:

```text
data/sample/gtfs_stops_southeast_melbourne.csv
```

Records:

```text
Approximately 4,994
```

The data was:

- Extracted from the PTV GTFS Schedule
- Filtered to relevant South-East Melbourne bus stops
- Deduplicated
- Prepared as a lookup table for nearest-stop calculations

This dataset supports AC-06 and is not intended for direct user browsing.

---

# Excluded or Replaced Data Sources

Some initially investigated sources were not suitable for direct implementation within the current student-project scope.

## Monash Public Library Events

The initially investigated Monash Public Library events source uses a commercial SaaS platform rather than a directly accessible public/open API suitable for the project.

For Iteration 1, the team therefore uses a manually compiled activity sample based on publicly available library and council event information.

---

## HealthDirect / NHSD

HealthDirect health-facility data was investigated.

However, the relevant National Health Services Directory access requires additional formal access arrangements such as:

- Registration
- API credentials
- Authentication
- OAuth Bearer Token access

This was not considered practical within the Iteration 1 student-project scope.

The project therefore uses or plans to use:

- **Aged Care Service List** for detailed aged-care records
- **Vicmap Features of Interest** for general facility discovery where appropriate

---

# Data Freshness Strategy

The project distinguishes between:

1. External APIs
2. Periodically updated datasets
3. Dynamic presentation
4. True real-time information

The core Iteration 1 datasets are generally published as periodically refreshed releases rather than continuous real-time streams.

The longer-term planned architecture is:

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

The backend may periodically retrieve updated CSV or API records and refresh the application's own data store.

The frontend could then use the team's backend rather than depending directly on several external services.

Potential advantages include:

- Faster frontend responses
- More predictable data formats
- Improved reliability
- Centralised error handling
- Controlled refresh frequency
- Reduced dependency on third-party availability
- Easier caching
- Easier dataset joining

The current prototype still supports local Iteration datasets.

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
   ├── savedItemsService
   ├── distanceService
   └── transitStopsService
   │
   ↓
Supporting Location Data
   │
   ├── suburbCoordinates
   ├── venueCoordinates
   └── GTFS stop lookup
   │
   ↓
Normalised Application Data
   │
   ↓
Local Iteration Dataset / Future Backend API
```

This structure allows the current frontend data source to be replaced or supplemented by a backend API without requiring a complete redesign of the user interface.

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

`VITE_USE_REMOTE_API=false` currently allows the application to use local Iteration datasets.

A future backend implementation could switch the application to:

```env
VITE_USE_REMOTE_API=true
```

without requiring major redesign of the frontend pages.

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

or on Windows:

```powershell
npm.cmd run preview
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

The application currently stores only voluntary non-sensitive settings and saved-item references required for the user experience.

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
- User-generated social posts
- Private messaging

The application should use verified source information and avoid fabricating unavailable provider or service details.

---

# Known Limitations

The current Iteration 1 implementation has several known limitations.

1. The activity sample dataset does not provide every field required by the final acceptance criteria.
2. Some activity records do not contain complete accessibility information, organiser details, availability or registration instructions.
3. The activity sample does not provide complete Greater Melbourne coverage.
4. The current service dataset focuses primarily on aged-care services rather than every healthcare and essential-service category.
5. Accessibility information is limited by the current aged-care source fields.
6. Phone numbers are not consistently supplied by the current service source.
7. Opening hours are not consistently supplied by the current service source.
8. Eligibility information is not consistently supplied by the current service source.
9. National Public Toilet Map records have not yet been integrated into the frontend.
10. Selected Vicmap facility records have not yet been fully integrated into the Services interface.
11. The GTFS stop dataset is a static snapshot.
12. Current transport support focuses on nearest-stop information rather than complete journey planning.
13. Real-time vehicle arrivals and service disruptions are outside the current scope.
14. Environmental information such as weather, UV and air quality has been deferred to Iteration 2.

Missing source information is not fabricated by the application.

---

# Iteration 2 Plan

Iteration 2 will build on the current local-discovery platform by adding environmental decision-support information and expanding verified service coverage.

The main planned environmental features are:

- Weather
- UV Index
- Air Quality

These features were investigated during Iteration 1 but intentionally deferred to Iteration 2.

---

## Weather and Forecast Information

Weather information is planned to be obtained using:

```text
Open-Meteo
```

Potential information includes:

- Current temperature
- Forecast temperature
- Weather conditions
- Precipitation
- Wind
- Daily forecast information

Weather data should support activity decisions rather than turning the platform into a dedicated weather application.

---

## UV Index

UV information is especially relevant to older users considering outdoor activities.

Potential information includes:

- Current UV Index
- Forecast UV Index
- Simple risk category
- Basic sun-protection reminder where appropriate

For example:

```text
UV Index
7 · High

Consider sun protection for outdoor activities.
```

UV information may be displayed alongside activity information where it provides useful decision support.

---

## Air Quality

Air-quality information is planned to be investigated and integrated using relevant EPA Victoria environmental monitoring data.

Potential information includes:

- Air-quality status
- Monitoring information
- Simple activity-support messages

The feature should avoid presenting medical diagnoses or personalised medical advice.

Its purpose is to provide general environmental context for local activity planning.

---

# Outdoor Activity Suitability

Rather than presenting Weather, UV and Air Quality as three unrelated technical datasets, Iteration 2 may combine them into a supplementary:

## Outdoor Activity Suitability Indicator

The purpose is to help older adults quickly understand whether environmental conditions appear suitable for an outdoor activity.

Potential presentation:

```text
Outdoor Conditions

Weather
22°C · Partly cloudy

UV Index
7 · High

Air Quality
Good

Outdoor Activity Guidance
Conditions are generally suitable.
Consider sun protection because UV is high.
```

This information would remain secondary to the activity itself.

The main platform purpose continues to be:

- Local activity discovery
- Service discovery
- Accessibility
- Independent living support

rather than weather forecasting.

---

# Iteration 2 Data Architecture

Weather, UV and air-quality information changes more rapidly than the static service and GTFS datasets.

A possible architecture is:

```text
Open-Meteo
      +
EPA Victoria
      ↓
Short Refresh Interval
(e.g. every few hours)
      ↓
Backend / Cache
      ↓
Normalised Environmental Data
      ↓
Vue Frontend
      ↓
Outdoor Activity Suitability
```

The exact refresh strategy will depend on the final Iteration 2 implementation.

---

# Planned Next Steps — Iteration 2

The next implementation stage may include:

1. Integrate weather data using Open-Meteo.
2. Add weather forecast information to relevant activity experiences.
3. Integrate UV Index information.
4. Add simple UV decision-support messaging.
5. Investigate and integrate EPA Victoria air-quality information.
6. Combine Weather, UV and Air Quality into an optional outdoor activity suitability indicator.
7. Integrate National Public Toilet Map data for essential facilities.
8. Use available public-toilet accessibility attributes where appropriate.
9. Integrate selected Vicmap Features of Interest.
10. Expand healthcare and community-facility discovery.
11. Improve aged-care service details if supplementary verified datasets become available.
12. Add verified phone, opening-hour, eligibility or accessibility information where supported.
13. Expand transport/location coverage beyond the current South-East Melbourne GTFS snapshot where appropriate.
14. Investigate scheduled backend refreshing for external datasets.
15. Introduce a team-managed database if required by later technical scope.
16. Connect the Vue frontend to the backend API while preserving the current frontend service-layer architecture.

---

# Potential Iteration 2–3 Extensions

## Pedestrian Crowd Information

The City of Melbourne Pedestrian Counting System may be investigated as a future enhancement.

Potential uses include:

- Crowd-level estimation
- Quieter-time recommendations
- Off-peak activity suggestions
- Additional decision support for users who prefer less crowded environments

This would be supplementary rather than a core platform requirement.

---

## Wider Service Coverage

Future service discovery may include additional verified records for:

- Hospitals
- Community health facilities
- Libraries
- Community centres
- Public toilets
- Government services
- Other essential local services

Potential sources include:

- Vicmap Features of Interest
- National Public Toilet Map
- Other verified Victorian Government or council open datasets

---

## Additional Provider Information

If suitable verified open datasets become available, future iterations may add:

- Phone numbers
- Opening hours
- Eligibility information
- Accessibility information
- Additional provider details
- More detailed service descriptions

Only verified source information should be displayed.

---

## Backend Data Refresh

Future iterations may move data preparation away from static frontend files.

Potential workflow:

```text
External Dataset / API
        ↓
Scheduled Fetch
        ↓
Validation
        ↓
Normalisation
        ↓
Team Database
        ↓
Backend API
        ↓
Vue Application
```

This would allow data to be refreshed without manually rebuilding frontend sample files.

---

# Iteration Roadmap Summary

## Iteration 1

### Completed

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
- PTV GTFS bus-stop lookup
- Nearest-stop calculation
- Activity nearest-stop information
- Service nearest-stop information
- Global text-size control
- Privacy-aware design
- Source-aware missing-field handling

### Partially Implemented

- Complete accessibility metadata
- Complete healthcare/essential-service coverage
- Wider Greater Melbourne activity coverage

---

## Iteration 2

### Planned

- Weather integration
- Weather forecast
- UV Index
- Air Quality
- Outdoor Activity Suitability
- National Public Toilet Map integration
- Additional Vicmap facilities
- Improved service accessibility information
- Wider service coverage
- Further data-refresh architecture

---

## Iteration 2–3 Possibilities

- Crowd-level information
- Off-peak activity recommendations
- Wider transport coverage
- Backend refresh scheduling
- Team database
- Additional formal API/data-sharing integrations

---

# Requirement Source Documents

Project requirements, implementation decisions and future plans are based on:

- User Stories & Epic Mapping
- Acceptance Criteria
- Updated Personas
- Open Data Research — Iteration 1 Dataset List
- Open Data → Epic Mapping — Iteration 1 Final

These documents should remain the source of truth when project scope, implementation status or future iteration plans change.

---

# Project Principles

The project should continue to follow the following principles across future iterations.

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

Additional features such as transport, Weather, UV and Air Quality should support the user's main task without overwhelming the interface.

## Incremental Development

New datasets and features should be introduced gradually across iterations while preserving the existing frontend architecture and core user experience.