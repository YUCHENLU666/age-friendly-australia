<!--
src/components/services/ServiceFilters.vue
Show service filters and send changes to ServicesView.

How calls move:
Change -> updateField -> emit update:filters -> ServicesView.updateFilters;
Clear -> emit clear.

Reading tips:
  Examples show one possible case, not fixed API or model results.
  Promise: a result to wait for; await gets the result when the work finishes.
  ref: a page value; changing it lets Vue update the screen.

Functions:
  updateField - Change one filter and send the full filter object to the parent page.

Props and events:
  props - Receive filters, area/type/accessibility options and the dataAvailable flag from the parent.
  emit - Notify the parent through update:filters and clear component events.

Notes:
  This component does not load services or directly change the parent filters.
-->

<script setup>
// Receive filters, area/type/accessibility options
// and the dataAvailable flag from the parent.
const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },

  areas: {
    type: Array,
    default: () => [],
  },

  serviceTypes: {
    type: Array,
    default: () => [],
  },

  accessibilityOptions: {
    type: Array,
    default: () => [],
  },

  dataAvailable: {
    type: Boolean,
    default: false,
  },
})

// Notify the parent through update:filters
// and clear component events.
const emit = defineEmits([
  'update:filters',
  'clear',
])

// Change one filter and send the full filter object
// to the parent page.
//
// Example input:
// field='area', value='Clayton'
//
// Example result:
// Sends update:filters with area='Clayton'
// while keeping the other current filter values.
const updateField = (
  field,
  value,
) => {
  emit('update:filters', {
    ...props.filters,
    [field]: value,
  })
}
</script>

<template>
  <section
    class="service-filter-panel"
    aria-labelledby="service-filter-heading"
  >
    <!-- =========================================
         Filter heading
    ========================================== -->
    <div class="service-filter-heading">
      <div>
        <p class="section-kicker">
          Find support
        </p>

        <h2 id="service-filter-heading">
          Find essential services
        </h2>

        <p>
          Use broad, optional choices to
          narrow the results.
        </p>
      </div>

      <button
        type="button"
        class="service-clear-button"
        :disabled="!dataAvailable"
        @click="emit('clear')"
      >
        Clear filters
      </button>
    </div>


    <!-- =========================================
         Data availability note
    ========================================== -->
    <div
      v-if="!dataAvailable"
      class="service-filter-availability"
    >
      <span aria-hidden="true">
        i
      </span>

      <div>
        <strong>
          Filters will activate when service data is connected.
        </strong>

        <p>
          The filter structure is ready, but
          verified provider and access data
          is not yet available.
        </p>
      </div>
    </div>


    <!-- =========================================
         Filter controls
    ========================================== -->
    <div class="service-filter-grid">

      <!-- =======================================
           General area
      ======================================== -->
      <div class="service-filter-field">
        <label for="service-area">
          General area
        </label>

        <select
          id="service-area"
          :value="filters.area"
          :disabled="!dataAvailable"
          @change="
            updateField(
              'area',
              $event.target.value,
            )
          "
        >
          <option value="">
            All areas
          </option>

          <option
            v-for="area in areas"
            :key="area"
            :value="area"
          >
            {{ area }}
          </option>
        </select>

        <small
          v-if="!dataAvailable"
          class="service-filter-helper"
        >
          Area options will come from the
          connected dataset.
        </small>
      </div>


      <!-- =======================================
           Service type
      ======================================== -->
      <div class="service-filter-field">
        <label for="service-type">
          Service type
        </label>

        <select
          id="service-type"
          :value="filters.type"
          :disabled="!dataAvailable"
          @change="
            updateField(
              'type',
              $event.target.value,
            )
          "
        >
          <option value="">
            All service types
          </option>

          <option
            v-for="type in serviceTypes"
            :key="type"
            :value="type"
          >
            {{ type }}
          </option>
        </select>

        <small
          v-if="!dataAvailable"
          class="service-filter-helper"
        >
          Service categories will activate
          with the dataset.
        </small>
      </div>


      <!-- =======================================
           Accessibility
      ======================================== -->
      <div class="service-filter-field">
        <label for="service-accessibility">
          Accessibility
        </label>

        <select
          id="service-accessibility"
          :value="
            filters.accessibility
          "
          :disabled="!dataAvailable"
          @change="
            updateField(
              'accessibility',
              $event.target.value,
            )
          "
        >
          <option value="">
            Any access option
          </option>

          <option
            v-for="
              option in
              accessibilityOptions
            "
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>

        <small
          v-if="!dataAvailable"
          class="service-filter-helper"
        >
          Access options will be based on
          verified source information.
        </small>
      </div>
    </div>
  </section>
</template>