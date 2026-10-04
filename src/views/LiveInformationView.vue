<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  getLiveBusPositions,
  getLiveCommunityVenues,
} from '@/services/liveDataService'

const venues = ref([])
const buses = ref([])

const venuesLoading = ref(false)
const busesLoading = ref(false)

const venuesError = ref('')
const busesError = ref('')

const routeId = ref('')

const venuesUpdatedAt = ref(null)
const busesUpdatedAt = ref(null)

const formatCoordinate = (value) => {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return 'Not available'
  }

  return number.toFixed(5)
}

const formatUpdatedTime = (date) => {
  if (!date) {
    return 'Not updated yet'
  }

  return new Intl.DateTimeFormat(
    'en-AU',
    {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    },
  ).format(date)
}

const formatVehicleTime = (
  timestamp,
) => {
  const value =
    Number(timestamp)

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 'Live time unavailable'
  }

  return new Intl.DateTimeFormat(
    'en-AU',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(
    new Date(value * 1000),
  )
}

const getMapUrl = (
  latitude,
  longitude,
) =>
  `https://www.google.com/maps?q=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}`

const loadVenues = async () => {
  venuesLoading.value = true
  venuesError.value = ''

  try {
    venues.value =
      await getLiveCommunityVenues(
        10,
      )

    venuesUpdatedAt.value =
      new Date()
  } catch (error) {
    venues.value = []

    venuesError.value =
      error instanceof Error
        ? error.message
        : 'Unable to load venue information.'
  } finally {
    venuesLoading.value = false
  }
}

const loadBuses = async () => {
  busesLoading.value = true
  busesError.value = ''

  try {
    buses.value =
      await getLiveBusPositions({
        routeId:
          routeId.value,
        limit: 10,
      })

    busesUpdatedAt.value =
      new Date()
  } catch (error) {
    buses.value = []

    busesError.value =
      error instanceof Error
        ? error.message
        : 'Unable to load live bus information.'
  } finally {
    busesLoading.value = false
  }
}

const clearRoute = async () => {
  routeId.value = ''
  await loadBuses()
}

const venueCount =
  computed(
    () => venues.value.length,
  )

const busCount =
  computed(
    () => buses.value.length,
  )

onMounted(async () => {
  await Promise.all([
    loadVenues(),
    loadBuses(),
  ])
})
</script>

<template>
  <main class="live-page">
    <section class="live-hero">
      <p class="live-eyebrow">
        LIVE INFORMATION
      </p>

      <h1>
        Current local information
      </h1>

      <p class="live-intro">
        Explore senior-friendly community
        venues from Vicmap and current bus
        positions supplied through PTV
        realtime data.
      </p>

      <div class="live-source-note">
        <span
          class="live-source-icon"
          aria-hidden="true"
        >
          i
        </span>

        <p>
          This page uses external data
          retrieved through the Age Friendly
          Australia backend. Information may
          change when the source providers
          update their records.
        </p>
      </div>
    </section>

    <section
      class="live-section"
      aria-labelledby="venues-heading"
    >
      <div class="live-section-header">
        <div>
          <p class="live-section-label">
            VICMAP
          </p>

          <h2 id="venues-heading">
            Senior-friendly community venues
          </h2>

          <p>
            Community venues currently
            returned by the Victorian
            Features of Interest service.
          </p>
        </div>

        <button
          type="button"
          class="live-refresh-button"
          :disabled="venuesLoading"
          @click="loadVenues"
        >
          {{
            venuesLoading
              ? 'Refreshing…'
              : 'Refresh venues'
          }}
        </button>
      </div>

      <div class="live-status-row">
        <span>
          {{
            venueCount
          }}
          venues shown
        </span>

        <span>
          Updated
          {{
            formatUpdatedTime(
              venuesUpdatedAt,
            )
          }}
        </span>
      </div>

      <div
        v-if="venuesError"
        class="live-message live-message--error"
        role="alert"
      >
        {{ venuesError }}
      </div>

      <div
        v-else-if="
          venuesLoading &&
          venues.length === 0
        "
        class="live-message"
      >
        Loading community venues…
      </div>

      <div
        v-else-if="
          venues.length === 0
        "
        class="live-message"
      >
        No community venues are currently
        available.
      </div>

      <div
        v-else
        class="live-grid"
      >
        <article
          v-for="venue in venues"
          :key="
            `${venue.name}-${venue.latitude}-${venue.longitude}`
          "
          class="live-card"
        >
          <div class="live-card-badge">
            Community venue
          </div>

          <h3>
            {{
              venue.name ||
              'Unnamed venue'
            }}
          </h3>

          <p class="live-card-subtitle">
            {{
              venue.featureSubtype ||
              'Senior-friendly facility'
            }}
          </p>

          <dl class="live-details">
            <div>
              <dt>
                Latitude
              </dt>

              <dd>
                {{
                  formatCoordinate(
                    venue.latitude,
                  )
                }}
              </dd>
            </div>

            <div>
              <dt>
                Longitude
              </dt>

              <dd>
                {{
                  formatCoordinate(
                    venue.longitude,
                  )
                }}
              </dd>
            </div>
          </dl>

          <a
            v-if="
              venue.latitude != null &&
              venue.longitude != null
            "
            class="live-card-link"
            :href="
              getMapUrl(
                venue.latitude,
                venue.longitude,
              )
            "
            target="_blank"
            rel="noopener noreferrer"
          >
            View location
            <span aria-hidden="true">
              →
            </span>
          </a>
        </article>
      </div>
    </section>

    <section
      class="live-section"
      aria-labelledby="buses-heading"
    >
      <div class="live-section-header">
        <div>
          <p class="live-section-label">
            PTV GTFS-REALTIME
          </p>

          <h2 id="buses-heading">
            Live bus positions
          </h2>

          <p>
            View current bus vehicle
            positions reported through PTV
            realtime transport data.
          </p>
        </div>

        <button
          type="button"
          class="live-refresh-button"
          :disabled="busesLoading"
          @click="loadBuses"
        >
          {{
            busesLoading
              ? 'Refreshing…'
              : 'Refresh buses'
          }}
        </button>
      </div>

      <div class="live-route-filter">
        <label for="route-id">
          Bus route
        </label>

        <div class="live-route-controls">
          <input
            id="route-id"
            v-model="routeId"
            type="text"
            inputmode="numeric"
            placeholder="Example: 200 or 907"
            @keyup.enter="loadBuses"
          />

          <button
            type="button"
            class="live-primary-button"
            :disabled="busesLoading"
            @click="loadBuses"
          >
            Apply route
          </button>

          <button
            v-if="routeId"
            type="button"
            class="live-secondary-button"
            :disabled="busesLoading"
            @click="clearRoute"
          >
            Clear
          </button>
        </div>

        <p>
          Leave the route blank to view
          vehicles from multiple routes.
        </p>
      </div>

      <div class="live-status-row">
        <span>
          {{
            busCount
          }}
          live vehicles shown
        </span>

        <span>
          Updated
          {{
            formatUpdatedTime(
              busesUpdatedAt,
            )
          }}
        </span>
      </div>

      <div
        v-if="busesError"
        class="live-message live-message--error"
        role="alert"
      >
        {{ busesError }}
      </div>

      <div
        v-else-if="
          busesLoading &&
          buses.length === 0
        "
        class="live-message"
      >
        Loading live bus positions…
      </div>

      <div
        v-else-if="
          buses.length === 0
        "
        class="live-message"
      >
        No live buses were returned for
        this route.
      </div>

      <div
        v-else
        class="live-grid"
      >
        <article
          v-for="bus in buses"
          :key="
            `${bus.vehicleId}-${bus.timestamp}`
          "
          class="live-card"
        >
          <div class="live-card-top">
            <span class="live-route-badge">
              Route
              {{
                bus.routeId ||
                'Unknown'
              }}
            </span>

            <span class="live-dot-label">
              <span
                class="live-dot"
                aria-hidden="true"
              />

              Live
            </span>
          </div>

          <h3>
            Bus
            {{
              bus.vehicleId ||
              'vehicle'
            }}
          </h3>

          <p class="live-card-subtitle">
            Latest vehicle position
          </p>

          <dl class="live-details">
            <div>
              <dt>
                Reported
              </dt>

              <dd>
                {{
                  formatVehicleTime(
                    bus.timestamp,
                  )
                }}
              </dd>
            </div>

            <div>
              <dt>
                Bearing
              </dt>

              <dd>
                {{
                  bus.bearing != null
                    ? `${bus.bearing}°`
                    : 'Not available'
                }}
              </dd>
            </div>

            <div>
              <dt>
                Latitude
              </dt>

              <dd>
                {{
                  formatCoordinate(
                    bus.latitude,
                  )
                }}
              </dd>
            </div>

            <div>
              <dt>
                Longitude
              </dt>

              <dd>
                {{
                  formatCoordinate(
                    bus.longitude,
                  )
                }}
              </dd>
            </div>
          </dl>

          <a
            v-if="
              bus.latitude != null &&
              bus.longitude != null
            "
            class="live-card-link"
            :href="
              getMapUrl(
                bus.latitude,
                bus.longitude,
              )
            "
            target="_blank"
            rel="noopener noreferrer"
          >
            View current position
            <span aria-hidden="true">
              →
            </span>
          </a>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.live-page {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 42px 0 72px;
}

.live-hero,
.live-section {
  background: #ffffff;
  border: 1px solid #dde6e1;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(35, 58, 51, 0.06);
}

.live-hero {
  padding: 38px;
  margin-bottom: 24px;
}

.live-eyebrow,
.live-section-label {
  margin: 0 0 8px;
  color: #a36c15;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.live-hero h1 {
  margin: 0;
  color: #183047;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.12;
}

.live-intro {
  max-width: 760px;
  margin: 16px 0 0;
  color: #586b76;
  font-size: 1.08rem;
  line-height: 1.7;
}

.live-source-note {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-top: 26px;
  padding: 18px 20px;
  border-radius: 16px;
  background: #f2f7f5;
  color: #52666b;
}

.live-source-note p {
  margin: 0;
  line-height: 1.55;
}

.live-source-icon {
  display: grid;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: #dcece6;
  color: #346858;
  font-weight: 800;
}

.live-section {
  padding: 34px;
  margin-top: 24px;
}

.live-section-header {
  display: flex;
  gap: 24px;
  justify-content: space-between;
  align-items: flex-start;
}

.live-section-header h2 {
  margin: 0;
  color: #183047;
  font-size: clamp(1.55rem, 3vw, 2rem);
}

.live-section-header p:not(
    .live-section-label
  ) {
  max-width: 670px;
  margin: 10px 0 0;
  color: #61727b;
  line-height: 1.6;
}

.live-refresh-button,
.live-primary-button,
.live-secondary-button {
  min-height: 46px;
  border-radius: 12px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.live-refresh-button,
.live-primary-button {
  border: 1px solid #2f6858;
  background: #356e5d;
  color: #ffffff;
}

.live-refresh-button {
  padding: 0 18px;
  white-space: nowrap;
}

.live-secondary-button {
  padding: 0 18px;
  border: 1px solid #b9c9c3;
  background: #ffffff;
  color: #29483f;
}

.live-refresh-button:disabled,
.live-primary-button:disabled,
.live-secondary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.live-status-row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 24px 0 18px;
  color: #6a7a82;
  font-size: 0.93rem;
}

.live-grid {
  display: grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(245px, 1fr)
    );
  gap: 18px;
}

.live-card {
  display: flex;
  flex-direction: column;
  min-height: 260px;
  padding: 22px;
  border: 1px solid #dce6e2;
  border-radius: 18px;
  background: #fbfdfc;
}

.live-card-badge,
.live-route-badge {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e5f0ec;
  color: #315f52;
  font-size: 0.78rem;
  font-weight: 800;
}

.live-card h3 {
  margin: 18px 0 4px;
  color: #1f384c;
  font-size: 1.15rem;
  line-height: 1.35;
}

.live-card-subtitle {
  margin: 0;
  color: #718089;
  line-height: 1.45;
}

.live-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 22px 0;
}

.live-details div {
  min-width: 0;
}

.live-details dt {
  margin-bottom: 4px;
  color: #7a898f;
  font-size: 0.78rem;
  font-weight: 700;
}

.live-details dd {
  margin: 0;
  color: #233f50;
  font-weight: 700;
  word-break: break-word;
}

.live-card-link {
  margin-top: auto;
  color: #285e50;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.live-card-top {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}

.live-dot-label {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  color: #47665e;
  font-size: 0.82rem;
  font-weight: 800;
}

.live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #348c62;
}

.live-message {
  padding: 22px;
  border-radius: 14px;
  background: #f2f6f4;
  color: #566a72;
}

.live-message--error {
  background: #fff2f0;
  color: #8a352b;
}

.live-route-filter {
  margin-top: 26px;
  padding: 22px;
  border: 1px solid #dde6e2;
  border-radius: 18px;
  background: #f7faf9;
}

.live-route-filter label {
  display: block;
  margin-bottom: 9px;
  color: #203c4d;
  font-weight: 800;
}

.live-route-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.live-route-controls input {
  flex: 1 1 240px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid #b9cbc4;
  border-radius: 12px;
  background: #ffffff;
  color: #203c4d;
  font: inherit;
}

.live-primary-button {
  padding: 0 20px;
}

.live-route-filter p {
  margin: 10px 0 0;
  color: #718088;
  font-size: 0.9rem;
}

@media (max-width: 760px) {
  .live-page {
    width: min(
      100% - 20px,
      1180px
    );
    padding-top: 24px;
  }

  .live-hero,
  .live-section {
    padding: 24px;
    border-radius: 18px;
  }

  .live-section-header {
    flex-direction: column;
  }

  .live-refresh-button {
    width: 100%;
  }

  .live-details {
    grid-template-columns: 1fr;
  }
}
</style>