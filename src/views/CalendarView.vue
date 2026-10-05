<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  RouterLink,
} from 'vue-router'

import {
  getActivities,
} from '@/services/activityService'

import {
  getServices,
} from '@/services/serviceService'

import {
  getSavedActivityIds,
  getSavedServiceIds,
} from '@/services/savedItemsService'

import {
  getPlannedServiceVisits,
  savePlannedServiceVisit,
} from '@/services/calendarService'

// ======================================================
// Page state
// ======================================================
//
// savedActivities:
// Complete activity objects that the user
// previously saved.
//
// savedServices:
// Complete service objects that the user
// previously saved.
//
const savedActivities = ref([])
const savedServices = ref([])

// Stores planned visit dates already saved
// in localStorage.
//
// Example:
//
// {
//   "3": "2026-10-15",
//   "7": "2026-11-02"
// }
//
const plannedVisits = ref({})

// Stores the Day / Month / Year values
// currently selected by the user.
//
// Example:
//
// {
//   "3": {
//     day: "15",
//     month: "10",
//     year: "2026"
//   }
// }
//
const selectedDateParts = ref({})

// Loading and error states.
const loading = ref(true)
const errorMessage = ref('')

// ======================================================
// Custom English date selector
// ======================================================
//
// We intentionally do NOT use:
//
// <input type="date">
//
// because native browser date pickers may
// display labels such as "Today" and "Clear"
// using the operating system language.
//
// Using normal <select> elements means our
// interface always stays in English.
//

// English month options.
const months = [
  {
    value: '01',
    label: 'January',
  },
  {
    value: '02',
    label: 'February',
  },
  {
    value: '03',
    label: 'March',
  },
  {
    value: '04',
    label: 'April',
  },
  {
    value: '05',
    label: 'May',
  },
  {
    value: '06',
    label: 'June',
  },
  {
    value: '07',
    label: 'July',
  },
  {
    value: '08',
    label: 'August',
  },
  {
    value: '09',
    label: 'September',
  },
  {
    value: '10',
    label: 'October',
  },
  {
    value: '11',
    label: 'November',
  },
  {
    value: '12',
    label: 'December',
  },
]

// Create day options:
//
// 01, 02, 03 ... 31
//
const days =
  Array.from(
    {
      length: 31,
    },
    (_, index) =>
      String(
        index + 1,
      ).padStart(
        2,
        '0',
      ),
  )

// Allow users to plan visits for
// the current year and the next 4 years.
const currentYear =
  new Date().getFullYear()

const years =
  Array.from(
    {
      length: 5,
    },
    (_, index) =>
      String(
        currentYear +
        index,
      ),
  )

// ======================================================
// Activity date helper
// ======================================================

/**
 * Read the date from an activity.
 *
 * Activity information may contain a value such as:
 *
 * 2026-10-18T14:00:00
 *
 * The calendar only needs:
 *
 * 2026-10-18
 *
 * Therefore, we extract the YYYY-MM-DD section.
 */
function getActivityDate(
  activity,
) {
  const value =
    activity.exactDate ||
    activity.schedule ||
    ''

  const match =
    String(value).match(
      /\d{4}-\d{2}-\d{2}/,
    )

  return match
    ? match[0]
    : ''
}

// ======================================================
// Save / update planned service visit
// ======================================================

/**
 * Save a planned visit date for one service.
 *
 * Day, Month and Year are stored separately
 * in selectedDateParts.
 *
 * Before saving, we combine them into:
 *
 * YYYY-MM-DD
 *
 * Example:
 *
 * day   = "15"
 * month = "10"
 * year  = "2026"
 *
 * becomes:
 *
 * 2026-10-15
 *
 * Saving the same service ID again updates
 * its existing planned date.
 */
function saveServiceDate(
  serviceId,
) {
  const parts =
    selectedDateParts.value[
      serviceId
    ]

  // The user must select all three fields.
  if (
    !parts?.day ||
    !parts?.month ||
    !parts?.year
  ) {
    return
  }

  const date =
    `${parts.year}-${parts.month}-${parts.day}`

  // Save the planned date in localStorage.
  savePlannedServiceVisit(
    serviceId,
    date,
  )

  // Read the updated data again so that
  // the calendar changes immediately.
  plannedVisits.value =
    getPlannedServiceVisits()
}

// ======================================================
// Build calendar entries
// ======================================================

/**
 * Combine two types of calendar items:
 *
 * 1. Saved activities
 *    → use their real scheduled event date.
 *
 * 2. Saved services
 *    → use the personal planned visit date
 *      selected by the user.
 *
 * Both types are converted to the same
 * simple data structure and sorted by date.
 */
const calendarEntries =
  computed(() => {
    // --------------------------------------
    // Saved activities
    // --------------------------------------
    const activityEntries =
      savedActivities.value
        .map(
          (activity) => ({
            id:
              activity.id,

            type:
              'Activity',

            name:
              activity.name,

            date:
              getActivityDate(
                activity,
              ),

            link:
              `/activities/${activity.id}`,
          }),
        )
        // Only show activities
        // with a usable date.
        .filter(
          (item) =>
            item.date,
        )

    // --------------------------------------
    // Saved services
    // --------------------------------------
    const serviceEntries =
      savedServices.value
        .map(
          (service) => ({
            id:
              service.id,

            type:
              'Service',

            name:
              service.name,

            // Services do not have a
            // personal visit date by default.
            //
            // The date comes from the user's
            // saved personal plan.
            date:
              plannedVisits.value[
                service.id
              ] || '',

            link:
              `/services/${service.id}`,
          }),
        )
        // Only display services after
        // the user has selected a date.
        .filter(
          (item) =>
            item.date,
        )

    // Merge activities and services
    // into one calendar list.
    const combinedEntries = [
      ...activityEntries,
      ...serviceEntries,
    ]

    // Sort from earliest date
    // to latest date.
    return combinedEntries.sort(
      (a, b) =>
        a.date.localeCompare(
          b.date,
        ),
    )
  })

// ======================================================
// Date display helper
// ======================================================

/**
 * Convert:
 *
 * 2026-10-15
 *
 * into:
 *
 * 15 October 2026
 *
 * en-AU keeps the visible calendar
 * date consistently in English.
 */
function formatDate(
  date,
) {
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat(
    'en-AU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${date}T00:00:00`,
    ),
  )
}

// ======================================================
// Load calendar data
// ======================================================
//
// When CalendarView opens:
//
// 1. Read saved activity IDs.
// 2. Read saved service IDs.
// 3. Load full activity and service data.
// 4. Match IDs with complete objects.
// 5. Load previously planned service dates.
// 6. Prepare Day / Month / Year selectors.
//
onMounted(async () => {
  try {
    // --------------------------------------
    // Read saved IDs
    // --------------------------------------
    const savedActivityIds =
      getSavedActivityIds()

    const savedServiceIds =
      getSavedServiceIds()

    // --------------------------------------
    // Load complete data
    // --------------------------------------
    //
    // Promise.all allows activities
    // and services to load together.
    //
    const [
      activities,
      services,
    ] =
      await Promise.all([
        getActivities(),
        getServices(),
      ])

    // --------------------------------------
    // Match saved activity IDs
    // --------------------------------------
    savedActivities.value =
      activities.filter(
        (activity) =>
          savedActivityIds.includes(
            String(
              activity.id,
            ),
          ),
      )

    // --------------------------------------
    // Match saved service IDs
    // --------------------------------------
    savedServices.value =
      services.filter(
        (service) =>
          savedServiceIds.includes(
            String(
              service.id,
            ),
          ),
      )

    // --------------------------------------
    // Load planned service visits
    // --------------------------------------
    plannedVisits.value =
      getPlannedServiceVisits()

    // --------------------------------------
    // Prepare the custom date selectors
    // --------------------------------------
    //
    // If a service already has:
    //
    // 2026-10-15
    //
    // split it into:
    //
    // year  = 2026
    // month = 10
    // day   = 15
    //
    // so the existing date appears
    // in the dropdown controls.
    //
    savedServices.value.forEach(
      (service) => {
        const existingDate =
          plannedVisits.value[
            service.id
          ] || ''

        const [
          year = '',
          month = '',
          day = '',
        ] =
          existingDate.split(
            '-',
          )

        selectedDateParts.value[
          service.id
        ] = {
          day,
          month,
          year,
        }
      },
    )
  } catch (error) {
    console.error(
      'Unable to load calendar.',
      error,
    )

    errorMessage.value =
      'Unable to load your calendar.'
  } finally {
    loading.value =
      false
  }
})
</script>

<template>
  <main class="calendar-page">

    <!-- ==================================
         Page heading
    =================================== -->
    <section class="calendar-header">

      <p class="calendar-eyebrow">
        PERSONAL CALENDAR
      </p>

      <h1>
        My calendar
      </h1>

      <p>
        View your saved activities
        and plan visits to saved services.
      </p>

    </section>

    <!-- ==================================
         Important scope notice
    =================================== -->
    <!--
      Epic 7 only provides personal planning.

      Selecting a date here does NOT create
      a real booking with the service provider.
    -->
    <div class="calendar-notice">
      Planned service visits are personal
      plans only. They do not confirm a
      booking with the service provider.
    </div>

    <!-- ==================================
         Loading state
    =================================== -->
    <p v-if="loading">
      Loading calendar...
    </p>

    <!-- ==================================
         Error state
    =================================== -->
    <p
      v-else-if="errorMessage"
      class="calendar-error"
    >
      {{ errorMessage }}
    </p>

    <!-- ==================================
         Main calendar content
    =================================== -->
    <template v-else>

      <!-- ==================================
           Saved service planning
      =================================== -->
      <section class="calendar-section">

        <h2>
          Plan saved service visits
        </h2>

        <p>
          Choose a date for a saved service.
          You can change the date at any time.
        </p>

        <!-- No saved services -->
        <p
          v-if="
            savedServices.length === 0
          "
        >
          You have no saved services.
        </p>

        <!-- One planning row for
             each saved service -->
        <div
          v-for="
            service in savedServices
          "
          :key="service.id"
          class="service-plan"
        >

          <!-- Service information -->
          <div class="service-plan-info">
            <strong>
              {{ service.name }}
            </strong>

            <p>
              {{
                service.suburb ||
                'Location not provided'
              }}
            </p>
          </div>

          <!-- ==================================
               Custom English date selector
          =================================== -->
          <!--
            We use three normal <select>
            controls instead of the browser's
            native date picker.

            This keeps Day / Month / Year
            consistently in English.
          -->
          <div class="date-selectors">

            <!-- Day -->
            <select
              v-model="
                selectedDateParts[
                  service.id
                ].day
              "
              :aria-label="
                `Day for ${service.name}`
              "
            >
              <option value="">
                Day
              </option>

              <option
                v-for="day in days"
                :key="day"
                :value="day"
              >
                {{ day }}
              </option>
            </select>

            <!-- Month -->
            <select
              v-model="
                selectedDateParts[
                  service.id
                ].month
              "
              :aria-label="
                `Month for ${service.name}`
              "
            >
              <option value="">
                Month
              </option>

              <option
                v-for="
                  month in months
                "
                :key="
                  month.value
                "
                :value="
                  month.value
                "
              >
                {{ month.label }}
              </option>
            </select>

            <!-- Year -->
            <select
              v-model="
                selectedDateParts[
                  service.id
                ].year
              "
              :aria-label="
                `Year for ${service.name}`
              "
            >
              <option value="">
                Year
              </option>

              <option
                v-for="year in years"
                :key="year"
                :value="year"
              >
                {{ year }}
              </option>
            </select>

          </div>

          <!--
            The same button is used for both:
            - setting a new date
            - updating an existing date
          -->
          <button
            type="button"
            class="save-date-button"
            @click="
              saveServiceDate(
                service.id,
              )
            "
          >
            Save date
          </button>

        </div>
      </section>

      <!-- ==================================
           Combined personal calendar
      =================================== -->
      <section class="calendar-section">

        <h2>
          Your calendar
        </h2>

        <!-- Empty calendar -->
        <p
          v-if="
            calendarEntries.length === 0
          "
        >
          No dated items are currently
          available in your calendar.
        </p>

        <!--
          Activities and planned services
          are displayed together and
          sorted by date.
        -->
        <article
          v-for="
            item in calendarEntries
          "
          :key="
            `${item.type}-${item.id}`
          "
          class="calendar-item"
        >

          <!-- Date -->
          <div class="calendar-date">
            {{
              formatDate(
                item.date,
              )
            }}
          </div>

          <!-- Item information -->
          <div class="calendar-item-content">

            <!-- Activity / Service -->
            <span class="calendar-type">
              {{ item.type }}
            </span>

            <h3>
              {{ item.name }}
            </h3>

            <!-- Link back to detail page -->
            <RouterLink
              :to="item.link"
              class="calendar-detail-link"
            >
              View details
            </RouterLink>

          </div>
        </article>

      </section>

    </template>

  </main>
</template>

<style scoped>
/* ======================================================
   Main page
====================================================== */

.calendar-page {
  max-width: 1000px;

  margin:
    0 auto;

  padding:
    40px
    24px
    60px;
}

/* ======================================================
   Page heading
====================================================== */

.calendar-header {
  margin-bottom:
    24px;
}

.calendar-eyebrow {
  margin-bottom:
    8px;

  font-weight:
    700;

  letter-spacing:
    0.08em;
}

.calendar-header h1 {
  margin:
    8px
    0;

  font-size:
    2.2rem;
}

.calendar-header p {
  margin:
    0;
}

/* ======================================================
   Booking notice
====================================================== */

.calendar-notice {
  margin-bottom:
    32px;

  padding:
    16px;

  border:
    1px solid
    #bbb;

  border-radius:
    10px;
}

/* ======================================================
   Sections
====================================================== */

.calendar-section {
  margin-top:
    36px;
}

.calendar-section h2 {
  margin-bottom:
    6px;
}

.calendar-section > p {
  margin-top:
    0;
}

/* ======================================================
   Saved service planning row
====================================================== */

.service-plan {
  display:
    grid;

  grid-template-columns:
    minmax(
      220px,
      1fr
    )
    auto
    auto;

  gap:
    16px;

  align-items:
    center;

  margin-top:
    16px;

  padding:
    18px;

  border:
    1px solid
    #ddd;

  border-radius:
    12px;
}

.service-plan-info p {
  margin:
    4px
    0
    0;
}

/* ======================================================
   Custom Day / Month / Year selector
====================================================== */

.date-selectors {
  display:
    flex;

  gap:
    8px;
}

.date-selectors select {
  min-height:
    44px;

  padding:
    0
    10px;

  font-size:
    1rem;

  border:
    1px solid
    #aaa;

  border-radius:
    6px;

  background:
    white;
}

/* ======================================================
   Save button
====================================================== */

.save-date-button {
  min-height:
    44px;

  padding:
    0
    18px;

  font-size:
    1rem;

  cursor:
    pointer;

  border:
    1px solid
    #aaa;

  border-radius:
    6px;

  background:
    white;
}

.save-date-button:hover {
  background:
    #f3f3f3;
}

/* ======================================================
   Calendar item
====================================================== */

.calendar-item {
  display:
    grid;

  grid-template-columns:
    180px
    1fr;

  gap:
    24px;

  margin-top:
    16px;

  padding:
    20px;

  border:
    1px solid
    #ddd;

  border-radius:
    12px;
}

.calendar-date {
  font-weight:
    700;
}

.calendar-type {
  font-size:
    0.9rem;

  font-weight:
    700;

  text-transform:
    uppercase;

  letter-spacing:
    0.05em;
}

.calendar-item h3 {
  margin:
    6px
    0
    10px;
}

.calendar-detail-link {
  font-weight:
    600;
}

/* ======================================================
   Error message
====================================================== */

.calendar-error {
  font-weight:
    700;
}

/* ======================================================
   Mobile layout
====================================================== */

@media (
  max-width:
    700px
) {
  .service-plan {
    grid-template-columns:
      1fr;
  }

  .date-selectors {
    flex-wrap:
      wrap;
  }

  .calendar-item {
    grid-template-columns:
      1fr;
  }
}
</style>