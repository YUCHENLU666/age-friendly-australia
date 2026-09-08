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
// />
//
// If activity.suburb is "Oakleigh",
// this component will display
// Oakleigh weather information.
const props = defineProps({
  suburb: {
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
// The JSON file is currently stored at:
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
    // matches the suburb received from the parent.
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
// Find current weather hour
// =========================
//
// Open-Meteo stores weather as hourly arrays.
//
// Example:
//
// time:
// [
//   "2026-09-08T13:00",
//   "2026-09-08T14:00",
//   "2026-09-08T15:00"
// ]
//
// temperature_2m:
// [
//   16,
//   17,
//   18
// ]
//
// We need the same index from these arrays.
const currentHourIndex = computed(() => {
  const hourly =
    locationWeather.value?.weather
      ?.hourly

  if (!hourly) {
    return -1
  }

  // Get current Melbourne time.
  const melbourneTime =
    new Date().toLocaleString(
      'sv-SE',
      {
        timeZone:
          'Australia/Melbourne',
        hour12: false,
      },
    )

  // Example:
  //
  // 2026-09-08 15:42:00
  //
  // becomes:
  //
  // 2026-09-08T15:00
  const currentHour =
    `${melbourneTime.slice(
      0,
      13,
    ).replace(' ', 'T')}:00`

  return hourly.time.indexOf(
    currentHour,
  )
})

// =========================
// Get one weather value
// =========================
//
// Example:
//
// getWeatherValue('temperature_2m')
//
// returns the current temperature.
const getWeatherValue = (field) => {
  const hourly =
    locationWeather.value?.weather
      ?.hourly

  const index =
    currentHourIndex.value

  if (
    !hourly ||
    index === -1
  ) {
    return null
  }

  return hourly[field]?.[index] ??
    null
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
      Some activity records use "Monash LGA".

      That is not an exact suburb,
      so our Python pipeline does not
      provide weather for it.
    -->
    <p
      v-else-if="!locationWeather"
      class="weather-message"
    >
      Local weather unavailable
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
              )
            }}°C
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
              )
            }}%
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
              )
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
    repeat(3, 1fr);
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
</style>