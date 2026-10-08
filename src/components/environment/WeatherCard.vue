<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  loadWeatherData,
} from '@/services/weatherService'

import {
  activityTimeToHour,
  classifyAqi,
  classifyUv,
  getForecastState,
  getHourlyValue,
  getOutdoorConditions,
} from '@/services/weatherConditions'


// ======================================================
// Weather card component
// ======================================================
//
// WeatherCard displays weather and air-quality
// information for a specific activity.
//
// Main data flow:
//
// ActivityCard
//   ↓
// suburb + activityTime
//   ↓
// WeatherCard
//   ↓
// weatherService
//   ↓
// Melbourne suburb weather dataset
//   ↓
// weatherConditions helpers
//   ↓
// Temperature / Rain / UV / AQI
//   ↓
// Outdoor conditions summary
//
// Weather data is matched to the scheduled activity time.
//
// If the activity time is outside the available forecast
// range, current weather is NOT used as a replacement.
// Instead, the card explains that the forecast is not
// currently available.
//


// ======================================================
// Props received from ActivityCard
// ======================================================

const props = defineProps({
  // Activity suburb used to find the matching
  // location in the weather dataset.
  suburb: {
    type: String,
    required: true,
  },

  // Scheduled activity date/time.
  //
  // Example:
  // 2026-10-06 14:30:00
  activityTime: {
    type: String,
    default: '',
  },
})


// ======================================================
// Component state
// ======================================================

// Complete weather dataset loaded through weatherService.
const weatherData = ref(null)

// Loading state while the weather data is being read.
const loading = ref(true)

// User-facing message shown if weather loading fails.
const errorMessage = ref('')


// ======================================================
// Match activity suburb to weather data
// ======================================================
//
// The suburb supplied by ActivityCard is matched against
// the weather dataset.
//
// Matching is case-insensitive and ignores surrounding
// whitespace.
//
const locationWeather =
  computed(() => {
    const targetSuburb =
      String(
        props.suburb ?? '',
      )
        .trim()
        .toLowerCase()

    return (
      weatherData.value
        ?.locations
        ?.find(
          (location) =>
            String(
              location.suburb ?? '',
            )
              .trim()
              .toLowerCase() ===
            targetSuburb,
        ) || null
    )
  })


// ======================================================
// Load weather data
// ======================================================
//
// weatherService manages shared loading and caching.
//
// This is important because ActivitiesView may render
// many ActivityCard / WeatherCard components at once.
//
// The shared service prevents every WeatherCard from
// independently downloading the same weather dataset.
//
onMounted(async () => {
  try {
    const {
      data,
    } =
      await loadWeatherData()

    weatherData.value = data
  } catch (error) {
    console.error(
      'Weather loading error:',
      error,
    )

    errorMessage.value =
      'Weather unavailable.'
  } finally {
    loading.value = false
  }
})


// ======================================================
// Normalise activity time
// ======================================================
//
// Convert the activity date/time into the hourly format
// used by the weather dataset.
//
// Example:
//
// 2026-10-06 14:30:00
//
// becomes:
//
// 2026-10-06T14:00
//
// Forecast matching always uses the scheduled activity
// hour rather than the current time.
//
const activityHour =
  computed(() =>
    activityTimeToHour(
      props.activityTime,
    ),
  )


// ======================================================
// Forecast availability
// ======================================================
//
// Weather and air-quality forecasts may cover different
// time ranges, so their availability is checked
// separately.
//
// weatherState checks:
// - temperature
// - precipitation probability
// - UV index
//
// airQualityState checks:
// - US AQI
//
const weatherState =
  computed(() =>
    getForecastState(
      locationWeather.value
        ?.weather
        ?.hourly,

      activityHour.value,

      [
        'temperature_2m',
        'precipitation_probability',
        'uv_index',
      ],
    ),
  )

const airQualityState =
  computed(() =>
    getForecastState(
      locationWeather.value
        ?.air_quality
        ?.hourly,

      activityHour.value,

      [
        'us_aqi',
      ],
    ),
  )

// At least one type of condition must be available
// before forecast values are displayed.
const hasConditions =
  computed(
    () =>
      weatherState.value ===
        'available' ||
      airQualityState.value ===
        'available',
  )


// ======================================================
// Forecast unavailable message
// ======================================================
//
// "future":
//   The activity is outside the current forecast window.
//
// Other unavailable states:
//   The requested activity hour cannot be matched to
//   usable forecast data.
//
const unavailableNote =
  computed(() => {
    if (
      weatherState.value === 'future' ||
      airQualityState.value === 'future'
    ) {
      return (
        'Forecast available closer ' +
        'to the activity date'
      )
    }

    return (
      'Forecast unavailable for ' +
      'this activity time.'
    )
  })


// ======================================================
// Hourly weather lookup
// ======================================================
//
// Read one weather field for the scheduled activity hour.
//
function getWeatherValue(
  field,
) {
  return getHourlyValue(
    locationWeather.value
      ?.weather
      ?.hourly,

    activityHour.value,

    field,
  )
}


// ======================================================
// Hourly air-quality lookup
// ======================================================
//
// Read one air-quality field for the scheduled
// activity hour.
//
function getAirQualityValue(
  field,
) {
  return getHourlyValue(
    locationWeather.value
      ?.air_quality
      ?.hourly,

    activityHour.value,

    field,
  )
}


// ======================================================
// UV and AQI classification
// ======================================================
//
// Keep the original numeric values for transparency,
// while also providing a simple user-facing category
// and colour tone.
//
const uvCategory =
  computed(() =>
    classifyUv(
      getWeatherValue(
        'uv_index',
      ),
    ),
  )

const aqiCategory =
  computed(() =>
    classifyAqi(
      getAirQualityValue(
        'us_aqi',
      ),
    ),
  )


// ======================================================
// Outdoor conditions summary
// ======================================================
//
// Combine three conditions from the same activity hour:
//
// - UV index
// - rain probability
// - air quality
//
// weatherConditions converts these values into a simple
// outdoor suitability label and explanation.
//
const outdoorConditions =
  computed(() =>
    getOutdoorConditions({
      uv:
        getWeatherValue(
          'uv_index',
        ),

      rain:
        getWeatherValue(
          'precipitation_probability',
        ),

      aqi:
        getAirQualityValue(
          'us_aqi',
        ),
    }),
  )
</script>


<template>
  <!-- ==============================================
       Activity weather card
  =============================================== -->
  <div class="weather-card">

    <!-- ============================================
         Loading state
    ============================================= -->
    <p
      v-if="loading"
      class="weather-message"
    >
      Loading weather...
    </p>


    <!-- ============================================
         Weather loading error
    ============================================= -->
    <p
      v-else-if="errorMessage"
      class="weather-message"
    >
      {{ errorMessage }}
    </p>


    <!-- ============================================
         Weather content
    ============================================= -->
    <div v-else>

      <!-- ==========================================
           Weather card heading
      =========================================== -->
      <div class="weather-header">
        <div>
          <strong>
            Activity conditions
          </strong>

          <!--
            Show the exact hourly key currently being used
            to match the forecast.

            All displayed times use Melbourne time.
          -->
          <small
            v-if="activityHour"
            class="weather-fallback-note"
          >
            {{
              activityHour.replace(
                'T',
                ' ',
              )
            }}
            · Melbourne time
          </small>
        </div>

        <!-- Activity suburb -->
        <span>
          {{ suburb }}
        </span>
      </div>


      <!-- ==========================================
           Suburb not found
      =========================================== -->
      <!--
        The activity suburb could not be matched to a
        location in the current weather dataset.
      -->
      <p
        v-if="!locationWeather"
        class="weather-message"
      >
        Local weather unavailable
      </p>


      <!-- ==========================================
           Activity time unavailable
      =========================================== -->
      <!--
        Weather matching requires a usable activity
        date/time.

        Current weather is not substituted because it
        would not represent conditions at the activity
        time.
      -->
      <p
        v-else-if="!activityHour"
        class="weather-message"
      >
        Activity date/time not provided.
        Forecast unavailable.
      </p>


      <template v-else>

        <!-- ========================================
             Forecast outside available coverage
        ========================================= -->
        <p
          v-if="!hasConditions"
          class="weather-message"
        >
          {{ unavailableNote }}
        </p>


        <!-- ========================================
             Forecast values
        ========================================= -->
        <!--
          Weather and air-quality data are displayed
          only when at least one forecast source has
          usable values for the activity hour.
        -->
        <div
          v-if="hasConditions"
          class="weather-values"
        >

          <!-- ======================================
               Temperature
          ======================================= -->
          <div>
            <span class="weather-label">
              Temperature
            </span>

            <strong>
              <template
                v-if="
                  getWeatherValue(
                    'temperature_2m',
                  ) !== null
                "
              >
                {{
                  getWeatherValue(
                    'temperature_2m',
                  )
                }}°C
              </template>

              <template v-else>
                N/A
              </template>
            </strong>
          </div>


          <!-- ======================================
               Rain probability
          ======================================= -->
          <div>
            <span class="weather-label">
              Rain
            </span>

            <strong>
              <template
                v-if="
                  getWeatherValue(
                    'precipitation_probability',
                  ) !== null
                "
              >
                {{
                  getWeatherValue(
                    'precipitation_probability',
                  )
                }}%
              </template>

              <template v-else>
                N/A
              </template>
            </strong>
          </div>


          <!-- ======================================
               UV index
          ======================================= -->
          <div>
            <span class="weather-label">
              UV
            </span>

            <!-- Original numeric UV value -->
            <strong>
              {{
                getWeatherValue(
                  'uv_index',
                ) ?? 'N/A'
              }}
            </strong>

            <!--
              Add a simple category to make the numeric
              UV value easier to interpret.
            -->
            <span
              v-if="
                getWeatherValue(
                  'uv_index',
                ) !== null
              "
              :class="[
                'weather-category',
                'weather-category--' +
                  uvCategory.tone,
              ]"
            >
              {{ uvCategory.label }}
            </span>
          </div>


          <!-- ======================================
               Air quality
          ======================================= -->
          <div>
            <span class="weather-label">
              AQI (US)
            </span>

            <!-- Original numeric AQI value -->
            <strong>
              {{
                getAirQualityValue(
                  'us_aqi',
                ) ?? 'N/A'
              }}
            </strong>

            <!--
              Add a user-friendly AQI category while
              preserving the original numeric value.
            -->
            <span
              v-if="
                getAirQualityValue(
                  'us_aqi',
                ) !== null
              "
              :class="[
                'weather-category',
                'weather-category--' +
                  aqiCategory.tone,
              ]"
            >
              {{ aqiCategory.label }}
            </span>
          </div>
        </div>


        <!-- ========================================
             Air-quality forecast coverage
        ========================================= -->
        <!--
          Air-quality forecasts can have a shorter
          coverage window than general weather data.

          The card therefore reports AQI availability
          separately.
        -->
        <p
          v-if="
            hasConditions &&
            airQualityState !==
              'available'
          "
          class="weather-coverage-note"
        >
          {{
            airQualityState ===
              'future'
              ? 'Air quality forecast available closer to the activity date'
              : 'Air quality forecast unavailable for this activity time.'
          }}
        </p>


        <!-- ========================================
             Weather forecast coverage
        ========================================= -->
        <!--
          AQI may still be available even if the general
          weather forecast is unavailable for this hour.
        -->
        <p
          v-if="
            hasConditions &&
            weatherState !==
              'available'
          "
          class="weather-coverage-note"
        >
          Weather forecast unavailable
          for this activity time.
        </p>


        <!-- ========================================
             Outdoor conditions summary
        ========================================= -->
        <!--
          Combine UV, rain probability and AQI into one
          simple summary for planning outdoor activities.
        -->
        <div
          v-if="hasConditions"
          class="weather-outdoor"
        >
          <div class="weather-outdoor-heading">
            <strong>
              Outdoor conditions
            </strong>

            <span
              :class="[
                'weather-category',
                'weather-category--' +
                  outdoorConditions.tone,
              ]"
            >
              {{ outdoorConditions.label }}
            </span>
          </div>

          <p>
            {{
              outdoorConditions
                .reasons
                .join(' · ')
            }}
          </p>
        </div>
      </template>


      <!-- ==========================================
           Weather data sources
      =========================================== -->
      <!--
        Weather conditions come from Open-Meteo.

        Air-quality information is based on CAMS data.
      -->
      <small class="weather-source">
        Data:

        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open-Meteo
        </a>

        · Air quality:

        <a
          href="https://atmosphere.copernicus.eu/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CAMS
        </a>
      </small>
    </div>
  </div>
</template>


<style scoped>
/* ======================================================
   Weather card container
====================================================== */

.weather-card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #d8dedb;
  border-radius: 10px;
  background: #f7faf8;
}


/* ======================================================
   Header
====================================================== */

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.weather-header > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weather-header span {
  color: #5f6b65;
}

.weather-fallback-note {
  color: #68736e;
  font-size: 12px;
  font-weight: 400;
}


/* ======================================================
   Weather values grid
====================================================== */

.weather-values {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0, 1fr)
    );
  gap: 12px;
}

.weather-values > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weather-label {
  font-size: 14px;
  color: #5f6b65;
}

.weather-values strong {
  font-size: 18px;
}


/* ======================================================
   Weather condition categories
====================================================== */

.weather-category {
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  padding: 4px 6px;
  border-radius: 6px;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
}


/* Low UV or Good AQI */
.weather-category--good {
  background: #e3f3e9;
  color: #165837;
}


/* Moderate conditions */
.weather-category--moderate {
  background: #fff4cc;
  color: #6d5000;
}


/* High UV or AQI concern for sensitive users */
.weather-category--caution {
  background: #ffead6;
  color: #874100;
}


/* Very High UV or Unhealthy AQI */
.weather-category--danger {
  background: #fde8e6;
  color: #8f1d20;
}


/* Extreme UV or Very Unhealthy AQI */
.weather-category--severe {
  background: #f2e6f8;
  color: #652680;
}


/* Hazardous AQI */
.weather-category--hazardous {
  background: #f5e2eb;
  color: #73172e;
}


/* Missing or invalid condition value */
.weather-category--neutral {
  background: #e9edeb;
  color: #45544c;
}


/* ======================================================
   Source and status messages
====================================================== */

.weather-source {
  display: block;
  margin-top: 12px;
  color: #68736e;
}

.weather-message {
  margin: 0;
  color: #5f6b65;
}

.weather-update-note {
  margin: 0 0 14px;
  padding: 10px;
  border-left:
    3px solid #805900;
  background: #fff4d6;
  color: #5b4100;
}

.weather-coverage-note {
  margin: 12px 0 0;
  color: #5f6b65;
}


/* ======================================================
   Outdoor conditions summary
====================================================== */

.weather-outdoor {
  margin-top: 16px;
  padding-top: 12px;
  border-top:
    1px solid #d8dedb;
}

.weather-outdoor-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.weather-outdoor p {
  margin: 8px 0;
  color: #34443c;
}

.weather-outdoor small {
  color: #68736e;
}


/* ======================================================
   Responsive layout
====================================================== */

@media (max-width: 700px) {
  .weather-values {
    grid-template-columns:
      repeat(2, 1fr);
  }
}
</style>