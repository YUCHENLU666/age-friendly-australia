<script setup>
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

const emit = defineEmits([
  'update:filters',
  'clear',
])

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
    <div class="service-filter-heading">
      <div>
        <p class="section-kicker">
          Find support
        </p>

        <h2 id="service-filter-heading">
          Search essential services
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
          The search structure is ready, but
          verified provider and access data
          is not yet available.
        </p>
      </div>
    </div>

    <div class="service-filter-grid">
      <div
        class="service-filter-field service-filter-search"
      >
        <label for="service-search">
          Search
        </label>

        <input
          id="service-search"
          type="search"
          :value="filters.search"
          :disabled="!dataAvailable"
          placeholder="Search by service or provider"
          @input="
            updateField(
              'search',
              $event.target.value,
            )
          "
        />

        <small
          v-if="!dataAvailable"
          class="service-filter-helper"
        >
          Available after verified service
          data is connected.
        </small>
      </div>

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