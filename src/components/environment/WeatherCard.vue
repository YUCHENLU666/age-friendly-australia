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
  getForecastMessage,
  getForecastState,
  getHourlyValue,
  getOutdoorConditions,
  getRefreshState,
} from '@/services/weatherConditions'

// =========================
// Props
// =========================
// ActivityCard passes the suburb
// and activity date/time.
const props = defineProps({
  suburb: {
    type: String,
    required: true,
  },

  activityTime: {
    type: String,
    default: '',
  },
})

// =========================
// Component state
// =========================
const weatherData = ref(null)
const refreshStatus = ref(null)
const loading = ref(true)
const errorMessage = ref('')

// Find the weather record for
// the activity suburb.
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

// =========================
// Load weather JSON
// =========================
onMounted(async () => {
  try {
    const {
      data,
      status,
    } =
      await loadWeatherData()

    weatherData.value = data
    refreshStatus.value = status
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

// =========================
// Activity hour
// =========================
// Example:
//
// 2026-10-06 14:30:00
//
// becomes:
//
// 2026-10-06T14:00
//
// An unavailable activity forecast
// is not replaced with current weather.
const activityHour =
  computed(() =>
    activityTimeToHour(
      props.activityTime,
    ),
  )

// =========================
// Forecast coverage
// =========================
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

const hasConditions =
  computed(
    () =>
      weatherState.value ===
        'available' ||
      airQualityState.value ===
        'available',
  )

// =========================
// Refresh status
// =========================
const refreshState =
  computed(() =>
    getRefreshState(
      weatherData.value
        ?.fetched_at,

      refreshStatus.value,
    ),
  )

const refreshNote =
  computed(() => {
    if (
      refreshState.value ===
      'failed'
    ) {
      return hasConditions.value
        ? 'Data refresh failed. Temporarily using the previous forecast.'
        : 'Data refresh failed. The previous forecast has been retained.'
    }

    if (
      refreshState.value ===
      'stale'
    ) {
      return (
        'Forecast data may be ' +
        'out of date. Waiting ' +
        'for the next update.'
      )
    }

    return ''
  })

const unavailableNote =
  computed(() =>
    getForecastMessage(
      weatherState.value,
      airQualityState.value,
      refreshState.value,
    ),
  )

const lastUpdated =
  computed(() => {
    const date = new Date(
      weatherData.value
        ?.fetched_at ?? '',
    )

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return ''
    }

    return date.toLocaleString(
      'en-AU',
      {
        timeZone:
          'Australia/Melbourne',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      },
    )
  })

// =========================
// Read weather value
// =========================
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

// =========================
// Read air quality value
// =========================
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

// =========================
// UV and AQI categories
// =========================
//
// Keep the original numbers and
// add a simple text category.
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

// =========================
// Outdoor conditions summary
// =========================
//
// Use the same activity-hour
// values shown in the card.
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

      stale:
        refreshState.value !==
        'current',
    }),
  )

</script>

<template>
  <div class="weather-card">
    <!-- Loading -->
    <p
      v-if="loading"
      class="weather-message"
    >
      Loading weather...
    </p>

    <!-- JSON could not be loaded -->
    <p
      v-else-if="errorMessage"
      class="weather-message"
    >
      {{ errorMessage }}
    </p>

    <div v-else>
      <div class="weather-header">
        <div>
          <strong>
            Activity conditions
          </strong>

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

        <span>
          {{ suburb }}
        </span>
      </div>

      <!-- Latest API refresh failed -->
      <p
        v-if="refreshNote"
        class="weather-update-note"
        role="status"
      >
        {{ refreshNote }}
      </p>

      <!-- Suburb not found -->
      <p
        v-if="!locationWeather"
        class="weather-message"
      >
        Local weather unavailable
      </p>

      <!-- Activity has no usable date -->
      <p
        v-else-if="!activityHour"
        class="weather-message"
      >
        Activity date/time not provided.
        Forecast unavailable.
      </p>

      <template v-else>
        <!-- Activity outside forecast -->
        <p
          v-if="!hasConditions"
          class="weather-message"
        >
          {{ unavailableNote }}
        </p>

        <!-- Forecast values -->
        <div
          v-if="hasConditions"
          class="weather-values"
        >
          <!-- Temperature -->
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

          <!-- Rain -->
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

          <!-- UV -->
          <div>
            <span class="weather-label">
              UV
            </span>

            <!-- Keep the original value -->
            <strong>
              {{
                getWeatherValue(
                  'uv_index',
                ) ?? 'N/A'
              }}
            </strong>

            <!-- Add the UV category -->
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

          <!-- Air quality -->
          <div>
            <span class="weather-label">
              AQI (US)
            </span>

            <!-- Keep the original value -->
            <strong>
              {{
                getAirQualityValue(
                  'us_aqi',
                ) ?? 'N/A'
              }}
            </strong>

            <!-- Add the AQI category -->
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

        <!-- AQI has a shorter forecast -->
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
              'future' &&
            refreshState ===
              'current'
              ? 'Air quality forecast available closer to the activity date'
              : 'AQI unavailable in the saved forecast for this activity time.'
          }}
        </p>

        <!-- Weather value unavailable -->
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
        <!-- Outdoor conditions summary -->
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

          <small>
            Based on UV, rain probability
            and US AQI only.
          </small>
        </div>
      </template>

      <small
        v-if="
          lastUpdated &&
          refreshState !== 'current'
        "
        class="weather-source"
      >
        Last successful update:
        {{ lastUpdated }}
      </small>

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
.weather-card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #d8dedb;
  border-radius: 10px;
  background: #f7faf8;
}

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

/* Moderate */
.weather-category--moderate {
  background: #fff4cc;
  color: #6d5000;
}

/* High UV or sensitive AQI */
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

/* Invalid or missing value */
.weather-category--neutral {
  background: #e9edeb;
  color: #45544c;
}

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

@media (max-width: 700px) {
  .weather-values {
    grid-template-columns:
      repeat(2, 1fr);
  }
}
</style>