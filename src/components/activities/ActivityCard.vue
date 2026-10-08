<script setup>
import { RouterLink } from 'vue-router'

import WeatherCard from '@/components/environment/WeatherCard.vue'


// ======================================================
// Activity card component
// ======================================================
//
// ActivityCard displays one normalised activity received
// from its parent component.
//
// Responsibilities:
//
// - display activity information
// - show older-adult suitability
// - show activity tags
// - display activity-time weather conditions
// - allow the user to save / unsave the activity
// - provide navigation to the activity detail page
//
// ActivityCard does not fetch activity data itself and
// does not manage saved storage directly.
//
// Saved activity IDs are managed by the parent through
// savedItemsService. Other features, such as the personal
// calendar, can later reuse those saved IDs.
//


// ======================================================
// Props received from parent
// ======================================================

defineProps({
  // Complete normalised activity object supplied by
  // ActivitiesView or another parent component.
  activity: {
    type: Object,
    required: true,
  },

  // Indicates whether this activity is currently saved.
  saved: {
    type: Boolean,
    default: false,
  },
})


// ======================================================
// Events sent to parent
// ======================================================
//
// ActivityCard does not manage saved activity storage.
//
// When the user clicks Save / Saved, the component emits:
//
// toggle-save(activity.id)
//
// The parent component then updates the saved state
// through savedItemsService.
//
// Saved activities can later be reused by other features,
// including the personal calendar.
//
defineEmits([
  'toggle-save',
])
</script>


<template>
  <!-- ==============================================
       Activity card
  =============================================== -->
  <article class="activity-card">

    <!-- ============================================
         Activity image and save action
    ============================================= -->
    <div class="activity-card-image-wrap">
      <img
        :src="activity.image"
        :alt="`${activity.name} activity`"
        class="activity-card-image"
      />

      <!-- Primary activity category -->
      <span class="activity-card-category">
        {{ activity.primaryTag }}
      </span>

      <!--
        Save state is controlled by the parent.

        Clicking this button emits the activity ID back
        to the parent component.

        The parent then updates savedItemsService, which
        keeps the saved state available to other features.
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


    <!-- ============================================
         Main activity information
    ============================================= -->
    <div class="activity-card-body">

      <div class="activity-card-heading">

        <!--
          Suitability values are normalised by
          activityService before reaching this component.
        -->
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

        <!-- Activity venue and suburb -->
        <p class="activity-location">
          {{ activity.venue }}

          <span aria-hidden="true">
            ·
          </span>

          {{ activity.suburb }}
        </p>
      </div>


      <!-- ============================================
           Schedule information
    ============================================= -->
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


      <!-- ============================================
           Activity interests
    ============================================= -->
      <!--
        Display up to three activity tags to keep the
        card compact while still showing key interests.
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


      <!-- ============================================
           Weather information
    ============================================= -->
      <!--
        WeatherCard receives the activity suburb and
        scheduled activity time.

        It attempts to match weather and air-quality
        conditions to the specific activity hour.

        If the activity time is outside the available
        forecast range, the component shows a forecast
        availability message instead of substituting
        current weather.
      -->
      <WeatherCard
        :suburb="activity.suburb"
        :activity-time="activity.schedule"
      />


      <!-- ============================================
           Card footer
    ============================================= -->
      <div class="activity-card-footer">

        <!-- Original activity data source -->
        <p class="activity-source">
          <span>
            Source
          </span>

          {{ activity.source }}
        </p>


        <!--
          Navigate to the individual activity detail page.

          Example route:
          /activities/1

          Vue Router then loads ActivityDetailView.
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