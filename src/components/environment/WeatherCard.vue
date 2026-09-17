<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

// =========================
// Receive suburb from parent component
// =========================
//
// Example:
//
// ActivityCard.vue
//
// <WeatherCard
//   :suburb="activity.suburb"
//   :activity-time="activity.schedule"
// />
//
// If activity.suburb is "Oakleigh",
// this component will display
// Oakleigh weather information.
//
const props = defineProps({
  suburb: {
    type: String,
    required: true,
  },

  activityTime: {
    type: String,
    required: true,
  },
})

// Store the matching suburb weather.
const locationWeather = ref(null)

// Loading status.
const loading = ref(true)

// Error message.
const errorMessage = ref('')

// =========================
// Load weather JSON
// =========================
//
// The JSON file is stored at:
//
// public/data/melbourne_suburb_weather.json
//
// Files inside public/ can be accessed
// directly from the browser using:
//
// /data/melbourne_suburb_weather.json
//
onMounted(async () => {
  try {
    const response = await fetch(
      '/data/melbourne_suburb_weather.json',
    )

    if (!response.ok) {
      throw new Error(
        'Could not load weather data.',
      )
    }

    const data = await response.json()

    // Find the weather record whose suburb
    // matches the suburb received from parent.
    //
    // Example:
    //
    // props.suburb = "Oakleigh"
    //
    //              ↓
    //
    // Find Oakleigh inside data.locations
    locationWeather.value =
      data.locations.find(
        (location) =>
          location.suburb ===
            props.suburb &&
          location.weather_available,
      ) || null
  } catch (error) {
    console.error(error)

    errorMessage.value =
      'Weather unavailable.'
  } finally {
    loading.value = false
  }
})

// =========================
// Find activity weather hour
// =========================
//
// Example:
//
// 2026-09-17 14:30:00
//
// becomes:
//
// 2026-09-17T14:00
//
const activityHour = computed(() => {
  if (!props.activityTime) {
    return null
  }

  const match =
    props.activityTime.match(
      /(\d{4}-\d{2}-\d{2})[ T](\d{2})/,
    )

  if (!match) {
    return null
  }

  return `${match[1]}T${match[2]}:00`
})

// =========================
// Find matching weather hour
// =========================

const activityHourIndex = computed(() => {
  const hourly =
    locationWeather.value?.weather
      ?.hourly

  if (
    !hourly ||
    !activityHour.value
  ) {
    return -1
  }

  return hourly.time.indexOf(
    activityHour.value,
  )
})

// =========================
// Find matching air quality hour
// =========================

const airQualityHourIndex = computed(() => {
  const hourly =
    locationWeather.value
      ?.air_quality
      ?.hourly

  if (
    !hourly ||
    !activityHour.value
  ) {
    return -1
  }

  return hourly.time.indexOf(
    activityHour.value,
  )
})

// =========================
// Get one weather value
// =========================

const getWeatherValue = (field) => {
  const hourly =
    locationWeather.value?.weather
      ?.hourly

  const index =
    activityHourIndex.value

  if (
    !hourly ||
    index === -1
  ) {
    return null
  }

  return (
    hourly[field]?.[index] ??
    null
  )
}

// =========================
// Get one air quality value
// =========================

const getAirQualityValue = (field) => {
  const hourly =
    locationWeather.value
      ?.air_quality
      ?.hourly

  const index =
    airQualityHourIndex.value

  if (
    !hourly ||
    index === -1
  ) {
    return null
  }

  return (
    hourly[field]?.[index] ??
    null
  )
}
</script>

<template>
  <div class="weather-card">
    <!-- While JSON is loading -->
    <p
      v-if="loading"
      class="weather-message"
    >
      Loading weather...
    </p>

    <!-- If loading fails -->
    <p
      v-else-if="errorMessage"
      class="weather-message"
    >
      {{ errorMessage }}
    </p>

    <!--
      Some activity records may use an area
      rather than an exact suburb.

      If no matching suburb weather exists,
      show this message.
    -->
    <p
      v-else-if="!locationWeather"
      class="weather-message"
    >
      Local weather unavailable
    </p>

    <!--
      Weather exists for the suburb,
      but forecast data does not cover
      this activity's date/time.
    -->
    <p
      v-else-if="
        activityHourIndex === -1 &&
        airQualityHourIndex === -1
      "
      class="weather-message"
    >
      Forecast not available for this activity date
    </p>

    <!-- Weather available -->
    <div v-else>
      <div class="weather-header">
        <strong>
          Local conditions
        </strong>

        <span>
          {{ suburb }}
        </span>
      </div>

      <div class="weather-values">
        <!-- Temperature -->
        <div>
          <span class="weather-label">
            Temperature
          </span>

          <strong>
            {{
              getWeatherValue(
                'temperature_2m',
              ) ?? 'N/A'
            }}<template
              v-if="
                getWeatherValue(
                  'temperature_2m',
                ) !== null
              "
            >°C</template>
          </strong>
        </div>

        <!-- Rain -->
        <div>
          <span class="weather-label">
            Rain
          </span>

          <strong>
            {{
              getWeatherValue(
                'precipitation_probability',
              ) ?? 'N/A'
            }}<template
              v-if="
                getWeatherValue(
                  'precipitation_probability',
                ) !== null
              "
            >%</template>
          </strong>
        </div>

        <!-- UV -->
        <div>
          <span class="weather-label">
            UV
          </span>

          <strong>
            {{
              getWeatherValue(
                'uv_index',
              ) ?? 'N/A'
            }}
          </strong>
        </div>

        <!-- Air quality -->
        <div>
          <span class="weather-label">
            AQI (US)
          </span>

          <strong>
            {{
              getAirQualityValue(
                'us_aqi',
              ) ?? 'N/A'
            }}
          </strong>
        </div>
      </div>

      <small class="weather-source">
        Source: Open-Meteo
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
  gap: 12px;
  margin-bottom: 14px;
}

.weather-header span {
  color: #5f6b65;
}

.weather-values {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 12px;
}

.weather-values > div {
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

.weather-source {
  display: block;
  margin-top: 12px;
  color: #68736e;
}

.weather-message {
  margin: 0;
  color: #5f6b65;
}

@media (max-width: 700px) {
  .weather-values {
    grid-template-columns:
      repeat(2, 1fr);
  }
}
</style>