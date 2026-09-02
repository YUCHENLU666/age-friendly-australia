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

  interests: {
    type: Array,
    default: () => [],
  },

  days: {
    type: Array,
    default: () => [],
  },

  recurrenceOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:filters',
  'clear',
])

const updateField = (field, value) => {
  emit('update:filters', {
    ...props.filters,
    [field]: value,
  })
}
</script>

<template>
  <section
    class="activity-filter-panel"
    aria-labelledby="activity-filter-heading"
  >
    <div class="activity-filter-heading">
      <div>
        <p class="activity-filter-kicker">
          Refine your results
        </p>

        <h2 id="activity-filter-heading">
          Find activities that suit you
        </h2>
      </div>

      <button
        class="clear-filter-button"
        type="button"
        @click="emit('clear')"
      >
        Clear filters
      </button>
    </div>

    <div class="activity-filter-grid">
      <div class="activity-filter-field filter-field--search">
        <label for="activity-search">
          Search
        </label>

        <input
          id="activity-search"
          type="search"
          :value="filters.search"
          placeholder="Try walking, technology, knitting..."
          @input="
            updateField(
              'search',
              $event.target.value,
            )
          "
        />
      </div>

      <div class="activity-filter-field">
        <label for="activity-area">
          General area
        </label>

        <select
          id="activity-area"
          :value="filters.area"
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
      </div>

      <div class="activity-filter-field">
        <label for="activity-interest">
          Interest
        </label>

        <select
          id="activity-interest"
          :value="filters.interest"
          @change="
            updateField(
              'interest',
              $event.target.value,
            )
          "
        >
          <option value="">
            All interests
          </option>

          <option
            v-for="interest in interests"
            :key="interest"
            :value="interest"
          >
            {{ interest }}
          </option>
        </select>
      </div>

      <div class="activity-filter-field">
        <label for="activity-day">
          Preferred day
        </label>

        <select
          id="activity-day"
          :value="filters.day"
          @change="
            updateField(
              'day',
              $event.target.value,
            )
          "
        >
          <option value="">
            Any day
          </option>

          <option
            v-for="day in days"
            :key="day"
            :value="day"
          >
            {{ day }}
          </option>
        </select>
      </div>

      <div class="activity-filter-field">
        <label for="activity-recurrence">
          Schedule type
        </label>

        <select
          id="activity-recurrence"
          :value="filters.recurrence"
          @change="
            updateField(
              'recurrence',
              $event.target.value,
            )
          "
        >
          <option value="">
            Any schedule
          </option>

          <option
            v-for="option in recurrenceOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </div>

      <div class="activity-filter-field">
        <label for="activity-suitability">
          Older-adult relevance
        </label>

        <select
          id="activity-suitability"
          :value="filters.suitability"
          @change="
            updateField(
              'suitability',
              $event.target.value,
            )
          "
        >
          <option value="all">
            All relevance levels
          </option>

          <option value="yes">
            Marked suitable
          </option>

          <option value="partial">
            May be suitable
          </option>

        </select>
      </div>
    </div>
  </section>
</template>
