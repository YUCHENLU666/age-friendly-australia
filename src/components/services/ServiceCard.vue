<!--
src/components/services/ServiceCard.vue
Show a service card; send Save clicks to the parent page.

How calls move:
Save button -> emit toggle-save(service.id) -> parent save handler;
View details -> RouterLink /services/:id.

Reading tips:
  Examples show one possible case, not fixed API or model results.
  ref: a page value; changing it lets Vue update the screen.

Notes:
  Inputs: service is the page-ready service object; saved is true or false.
  Save click sends toggle-save with service.id; the parent saves the ID.
  There are no named local functions or computed values in this file.
  Example input: service.id="7", saved=false; click Save.
  Example result: sends toggle-save("7"); the parent handles the storage change.
  The View details link opens /services/7 for this example.
  Optional service fields are shown only when real data is available.
  Missing fields are hidden instead of displaying placeholder text.
-->

<script setup>
import {
  RouterLink,
} from 'vue-router'

// Read the service object and saved true/false value sent by the parent.
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

// Allow the toggle-save event; the parent page writes the saved ID to storage.
defineEmits([
  'toggle-save',
])
</script>

<template>
  <article class="service-card">
    <!-- ============================================
         Service heading and save button
    ============================================= -->
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
        {{
          saved
            ? '★ Saved'
            : '☆ Save'
        }}
      </button>
    </div>

    <!-- ============================================
         Service purpose
    ============================================= -->
    <p
      v-if="service.purpose"
      class="service-purpose"
    >
      {{ service.purpose }}
    </p>

    <!-- ============================================
         Service details

         Only fields containing real data are shown.
         Missing fields are hidden instead of showing
         "Not provided by source".
    ============================================= -->
    <dl class="service-card-details">
      <!-- Distance -->
      <div
        v-if="
          service.distanceLabel
        "
      >
        <dt>
          Distance
        </dt>

        <dd>
          {{ service.distanceLabel }}
        </dd>
      </div>

      <!-- Location -->
      <div
        v-if="
          service.address ||
          service.suburb
        "
      >
        <dt>
          Location
        </dt>

        <dd>
          {{
            service.address ||
            service.suburb
          }}
        </dd>
      </div>

      <!-- Opening hours -->
      <div
        v-if="
          service.openingHours
        "
      >
        <dt>
          Opening hours
        </dt>

        <dd>
          {{ service.openingHours }}
        </dd>
      </div>

      <!-- Eligibility -->
      <div
        v-if="
          service.eligibility
        "
      >
        <dt>
          Eligibility
        </dt>

        <dd>
          {{ service.eligibility }}
        </dd>
      </div>

      <!-- Contact -->
      <div
        v-if="
          service.phone
        "
      >
        <dt>
          Contact
        </dt>

        <dd>
          {{ service.phone }}
        </dd>
      </div>
    </dl>

    <!-- ============================================
         Accessibility information
    ============================================= -->
    <div
      v-if="
        service.accessibility?.length
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

    <!-- ============================================
         Card footer
    ============================================= -->
    <div class="service-card-footer">
      <!--
        Only show the source label when source
        information is actually available.
      -->
      <p
        v-if="service.source"
        class="service-source"
      >
        <strong>
          Source
        </strong>

        {{ service.source }}
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