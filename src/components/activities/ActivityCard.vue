<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  activity: {
    type: Object,
    required: true,
  },

  saved: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'toggle-save',
])
</script>

<template>
  <article class="activity-card">
    <div class="activity-card-image-wrap">
      <img
        :src="activity.image"
        :alt="`${activity.name} activity`"
        class="activity-card-image"
      />

      <span class="activity-card-category">
        {{ activity.primaryTag }}
      </span>

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

    <div class="activity-card-body">
      <div class="activity-card-heading">
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

        <h2>
          {{ activity.name }}
        </h2>

        <p class="activity-location">
          {{ activity.venue }}
          <span aria-hidden="true">·</span>
          {{ activity.suburb }}
        </p>
      </div>

      <dl class="activity-card-details">
        <div>
          <dt>When</dt>

          <dd>
            {{
              activity.schedule ||
              'Schedule not provided'
            }}
          </dd>
        </div>

        <div>
          <dt>Schedule</dt>

          <dd>
            {{ activity.recurrence }}
          </dd>
        </div>
      </dl>

      <div
        v-if="activity.tags.length"
        class="activity-tag-list"
        aria-label="Activity interests"
      >
        <span
          v-for="tag in activity.tags.slice(0, 3)"
          :key="tag"
          class="activity-tag"
        >
          {{ tag }}
        </span>
      </div>

      <div class="activity-card-footer">
        <p class="activity-source">
          <span>Source</span>
          {{ activity.source }}
        </p>

        <RouterLink
          class="activity-details-link"
          :to="`/activities/${activity.id}`"
        >
          View details
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </article>
</template>