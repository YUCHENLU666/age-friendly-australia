<script setup>
// RouterLink is used to navigate
// from this activity card
// to the activity detail page.
//
// Example:
//
// /activities/1
// /activities/5
import { RouterLink } from 'vue-router'

// Import the reusable weather component.
//
// WeatherCard receives a suburb
// and the activity schedule.
import WeatherCard from '@/components/environment/WeatherCard.vue'

// =========================
// Props received from parent
// =========================
//
// ActivityCard.vue does not load activity data itself.
//
// The parent page, such as ActivitiesView.vue,
// passes one activity object into this component.
//
// Example:
//
// <ActivityCard
//   :activity="activity"
//   :saved="true"
// />
//
defineProps({
  // Full activity information.
  //
  // Example:
  //
  // {
  //   id: 1,
  //   name: 'Brain Training',
  //   suburb: 'Oakleigh',
  //   venue: 'Oakleigh Senior Citizens Centre'
  // }
  activity: {
    type: Object,
    required: true,
  },

  // Whether this activity has already
  // been saved by the user.
  saved: {
    type: Boolean,
    default: false,
  },
})

// =========================
// Events sent to parent
// =========================
//
// When the Save button is clicked,
// this component sends the activity ID
// back to the parent page.
//
// The parent page then handles
// the actual save / unsave logic.
//
defineEmits([
  'toggle-save',
])
</script>

<template>
  <!--
    One reusable activity card.

    ActivitiesView.vue can display
    many ActivityCard components
    using v-for.
  -->
  <article class="activity-card">

    <!-- =========================
         Activity image area
         ========================= -->
    <div class="activity-card-image-wrap">
      <img
        :src="activity.image"
        :alt="`${activity.name} activity`"
        class="activity-card-image"
      />

      <!-- Main activity category -->
      <span class="activity-card-category">
        {{ activity.primaryTag }}
      </span>

      <!-- =========================
           Save button
           =========================

           Clicking this button sends:

           toggle-save
                 +
           activity.id

           back to the parent component.
      -->
      <button
        class="activity-save-button"
        type="button"
        :class="{
          'activity-save-button--saved':
            saved,
        }"
        :aria-pressed="saved"
        @click="$emit('toggle-save', activity.id)"
      >
        <span aria-hidden="true">
          {{ saved ? '★' : '☆' }}
        </span>

        {{ saved ? 'Saved' : 'Save' }}
      </button>
    </div>

    <!-- =========================
         Main card content
         ========================= -->
    <div class="activity-card-body">

      <!-- Activity heading -->
      <div class="activity-card-heading">

        <!-- Suitability label -->
        <div class="activity-suitability-row">
          <span
            class="activity-suitability"
            :class="{
              'activity-suitability--yes':
                activity.suitability === 'yes',

              'activity-suitability--partial':
                activity.suitability === 'partial',

              'activity-suitability--no':
                activity.suitability === 'no',
            }"
          >
            {{ activity.suitabilityLabel }}
          </span>
        </div>

        <!-- Activity name -->
        <h2>
          {{ activity.name }}
        </h2>

        <!--
          Activity venue and suburb.

          Example:

          Oakleigh Senior Citizens Centre
          ·
          Oakleigh
        -->
        <p class="activity-location">
          {{ activity.venue }}

          <span aria-hidden="true">
            ·
          </span>

          {{ activity.suburb }}
        </p>
      </div>

      <!-- =========================
           Activity schedule details
           ========================= -->
      <dl class="activity-card-details">
        <div>
          <dt>
            When
          </dt>

          <dd>
            {{
              activity.schedule ||
              'Schedule not provided'
            }}
          </dd>
        </div>

        <div>
          <dt>
            Schedule
          </dt>

          <dd>
            {{ activity.recurrence }}
          </dd>
        </div>
      </dl>

      <!-- =========================
           Activity tags
           =========================

           Only show this section
           if the activity has tags.

           We display up to 3 tags.
      -->
      <div
        v-if="activity.tags.length"
        class="activity-tag-list"
        aria-label="Activity interests"
      >
        <span
          v-for="
            tag in activity.tags.slice(0, 3)
          "
          :key="tag"
          class="activity-tag"
        >
          {{ tag }}
        </span>
      </div>

      <!-- =========================
           Reusable Weather Component
           =========================

           ActivityCard passes:

           activity.suburb
                  ↓
              "Oakleigh"

           and:

           activity.schedule
                  ↓
           "2026-09-20 14:30:00"

           WeatherCard first tries to show
           weather for the activity time.

           If that time is outside the
           forecast range, WeatherCard
           falls back to current local
           conditions.
      -->
      <WeatherCard
        :suburb="activity.suburb"
        :activity-time="activity.schedule"
      />

      <!-- =========================
           Card footer
           ========================= -->
      <div class="activity-card-footer">

        <!-- Activity data source -->
        <p class="activity-source">
          <span>
            Source
          </span>

          {{ activity.source }}
        </p>

        <!--
          PAGE NAVIGATION

          Clicking "View details"
          changes the URL from something like:

          /activities

          to:

          /activities/1

          Vue Router then loads
          ActivityDetailView.vue.
        -->
        <RouterLink
          class="activity-details-link"
          :to="`/activities/${activity.id}`"
        >
          View details

          <span aria-hidden="true">
            →
          </span>
        </RouterLink>
      </div>
    </div>
  </article>
</template>