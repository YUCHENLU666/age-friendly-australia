<script setup>
import {
  RouterLink,
} from 'vue-router'

defineProps({
  service: {
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
  <article class="service-card">
    <div class="service-card-top">
      <div>
        <span class="service-type-badge">
          {{ service.type }}
        </span>

        <h2>
          {{ service.name }}
        </h2>

        <p
          v-if="service.provider"
          class="service-provider"
        >
          {{ service.provider }}
        </p>
      </div>

      <button
        type="button"
        class="service-save-button"
        :class="{
          'service-save-button--saved':
            saved,
        }"
        :aria-pressed="saved"
        @click="
          $emit(
            'toggle-save',
            service.id,
          )
        "
      >
        {{ saved ? '★ Saved' : '☆ Save' }}
      </button>
    </div>

    <p
      v-if="service.purpose"
      class="service-purpose"
    >
      {{ service.purpose }}
    </p>

    <dl class="service-card-details">
      <div>
        <dt>Location</dt>

        <dd>
          {{
            service.address ||
            service.suburb ||
            'Not provided by source'
          }}
        </dd>
      </div>

      <div>
        <dt>Opening hours</dt>

        <dd>
          {{
            service.openingHours ||
            'Not provided by source'
          }}
        </dd>
      </div>

      <div>
        <dt>Eligibility</dt>

        <dd>
          {{
            service.eligibility ||
            'Not provided by source'
          }}
        </dd>
      </div>

      <div>
        <dt>Contact</dt>

        <dd>
          {{
            service.phone ||
            'Not provided by source'
          }}
        </dd>
      </div>
    </dl>

    <div
      v-if="
        service.accessibility.length
      "
      class="service-access-list"
    >
      <span
        v-for="
          access in
          service.accessibility
        "
        :key="access"
      >
        ✓ {{ access }}
      </span>
    </div>

    <div class="service-card-footer">
      <p class="service-source">
        <strong>Source</strong>

        {{
          service.source ||
          'Source not provided'
        }}
      </p>

      <RouterLink
        :to="
          `/services/${service.id}`
        "
        class="service-details-link"
      >
        View details
        <span aria-hidden="true">
          →
        </span>
      </RouterLink>
    </div>
  </article>
</template>