<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  RouterLink,
} from 'vue-router'

import {
  getActivities,
} from '@/services/activityService'

import {
  getPreferences,
} from '@/services/preferencesService'

import {
  getRecommendations,
} from '@/services/recommendationService'

// ======================================================
// Homepage explore cards
// ======================================================

const exploreCards = [
  {
    title: 'Local activities',
    description:
      'Browse activities, classes and events by general area, preferred date and interest.',
    image: '/images/activities.jpg',
    alt:
      'Older adults taking part in a group activity',
    tag: 'Activities',
    to: '/activities',
    action: 'Browse activities',
  },
  {
    title: 'Aged-care support',
    description:
      'Browse verified aged-care support services with clear location and source information.',
    image: '/images/healthcare.jpg',
    alt:
      'An older adult accessing healthcare support',
    tag: 'Health & support',
    to: '/services',
    action: 'Find support',
  },
]

// ======================================================
// Homepage benefits
// ======================================================

const benefits = [
  {
    code: 'Aa',
    title: 'Easy to read',
    description:
      'Readable text, clear language and large controls support confident browsing.',
  },
  {
    code: '✓',
    title: 'Useful details',
    description:
      'Check access information, opening details and other important information before you decide.',
  },
  {
    code: '★',
    title: 'Simple filtering',
    description:
      'Use general area, interest and schedule filters to narrow the results yourself.',
  },
  {
    code: '◇',
    title: 'Privacy-aware',
    description:
      'Sensitive personal information and detailed location history are not required.',
  },
]

// ======================================================
// Hero trust items
// ======================================================

const trustItems = [
  'Clear source information',
  'Accessibility details',
  'Simple navigation',
]

// ======================================================
// AI recommendation state
// ======================================================
//
// recommendations:
// Raw ranking results returned by the backend.
//
// activities:
// Normalised activity objects returned by
// activityService.js.
//
// We combine both datasets later using activity IDs.
// ======================================================

const recommendations =
  ref([])

const activities =
  ref([])

const recommendationLoading =
  ref(false)

const recommendationError =
  ref('')

// Read preferences already saved in localStorage.
const preferences =
  ref(
    getPreferences(),
  )

// ======================================================
// Check whether useful recommendation preferences exist
// ======================================================
//
// textSize is deliberately excluded because it only
// controls the interface and should not affect activity
// recommendation ranking.
// ======================================================

const hasPreferences =
  computed(() => {
    return Boolean(
      preferences.value.generalArea ||
      preferences.value.interests
        .length ||
      preferences.value.preferredDays
        .length ||
      preferences.value.activityTypes
        .length,
    )
  })

// ======================================================
// Convert recommendation reasons into a safe array
// ======================================================
//
// Backend normally returns:
//
// [
//   'Relevant to your selected interests',
//   'Located in Clayton'
// ]
//
// This helper also protects the frontend if a plain
// string is returned instead.
// ======================================================

function normaliseReasons(
  reasons,
) {
  if (
    Array.isArray(
      reasons,
    )
  ) {
    return reasons.filter(
      Boolean,
    )
  }

  if (reasons) {
    return [
      String(reasons),
    ]
  }

  return []
}

// ======================================================
// Combine AI ranking results with full activity objects
// ======================================================
//
// Recommendation API returns:
//
// activityId
// score
// reasons
// breakdown
//
// Activity service returns:
//
// name
// image
// suburb
// schedule
// category
// etc.
//
// The UI needs both, so they are joined by activity ID.
// ======================================================

const recommendedActivities =
  computed(() => {
    return recommendations.value
      .map(
        (recommendation) => {
          const activity =
            activities.value.find(
              (item) =>
                String(
                  item.id,
                ) ===
                String(
                  recommendation.activityId,
                ),
            )

          // If an activity cannot be found,
          // skip that recommendation rather than
          // showing an incomplete card.
          if (!activity) {
            return null
          }

          return {
            ...activity,

            // Keep the score internally in case it is
            // useful later, but do not display it as
            // a percentage to the user.
            recommendationScore:
              recommendation.score,

            recommendationReasons:
              normaliseReasons(
                recommendation.reasons,
              ),

            recommendationBreakdown:
              recommendation.breakdown,
          }
        },
      )
      .filter(Boolean)
  })

// ======================================================
// Load AI recommendations
// ======================================================

async function loadRecommendations() {
  // Do not call the AI endpoint until the user has
  // selected at least one meaningful preference.
  if (
    !hasPreferences.value
  ) {
    return
  }

  recommendationLoading.value =
    true

  recommendationError.value =
    ''

  try {
    // Load activity data and AI ranking data together.
    const [
      activityResults,
      recommendationResults,
    ] =
      await Promise.all([
        getActivities(),

        getRecommendations(
          preferences.value,
        ),
      ])

    activities.value =
      activityResults

    recommendations.value =
      recommendationResults
  } catch (error) {
    console.error(
      'Unable to load AI recommendations:',
      error,
    )

    recommendationError.value =
      error?.message ||
      'Personalised recommendations are temporarily unavailable.'
  } finally {
    recommendationLoading.value =
      false
  }
}

// ======================================================
// Load recommendations when the homepage opens
// ======================================================

onMounted(() => {
  loadRecommendations()
})
</script>

<template>
  <div class="home-page">
    <!-- =====================================================
         HERO
         ===================================================== -->

    <section class="home-hero">
      <div
        class="hero-decoration hero-decoration--one"
        aria-hidden="true"
      ></div>

      <div
        class="hero-decoration hero-decoration--two"
        aria-hidden="true"
      ></div>

      <div class="page-container home-hero-grid">
        <div class="home-hero-content">
          <div class="hero-location">
            <span
              class="hero-location-dot"
              aria-hidden="true"
            ></span>

            Greater Melbourne
          </div>

          <h1>
            Find activities and essential services

            <span>
              with confidence.
            </span>
          </h1>

          <p class="home-hero-lead">
            Discover local activities, healthcare,
            aged-care support and useful everyday
            services through one clear and accessible
            place.
          </p>

          <div class="home-hero-actions">
            <RouterLink
              class="primary-cta"
              to="/activities"
            >
              <span>
                Find activities
              </span>

              <span
                class="cta-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </RouterLink>

            <RouterLink
              class="secondary-cta"
              to="/services"
            >
              Find services
            </RouterLink>
          </div>

          <div
            class="hero-trust-row"
            aria-label="Platform benefits"
          >
            <div
              v-for="item in trustItems"
              :key="item"
              class="hero-trust-item"
            >
              <span
                class="trust-check"
                aria-hidden="true"
              >
                ✓
              </span>

              <span>
                {{ item }}
              </span>
            </div>
          </div>

          <p class="hero-privacy-note">
            No sensitive personal information or detailed
            location history is required.
          </p>
        </div>

        <div class="home-hero-visual">
          <div class="hero-image-frame">
            <img
              class="home-hero-image"
              src="/images/hero-seniors.jpg"
              alt="Older adults enjoying time together"
            />

            <div
              class="hero-overlay hero-overlay--top"
              aria-hidden="true"
            >
              <span class="hero-overlay-icon">
                ✓
              </span>

              <span class="hero-overlay-copy">
                <strong>
                  Age-friendly
                </strong>

                <small>
                  Clear and simple
                </small>
              </span>
            </div>

            <div
              class="hero-overlay hero-overlay--bottom"
              aria-hidden="true"
            >
              <span
                class="hero-overlay-icon hero-overlay-icon--gold"
              >
                ○
              </span>

              <span class="hero-overlay-copy">
                <strong>
                  Local information
                </strong>

                <small>
                  Greater Melbourne
                </small>
              </span>
            </div>
          </div>

          <div
            class="hero-image-accent"
            aria-hidden="true"
          ></div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         AI PERSONALISED RECOMMENDATIONS
         ===================================================== -->

    <section
      class="ai-recommendation-section"
      aria-labelledby="ai-recommendation-heading"
    >
      <div class="page-container">
        <div class="ai-recommendation-panel">

          <!-- =========================
               Recommendation heading
               ========================= -->

          <div class="ai-recommendation-heading-row">
            <div>
              <p class="section-kicker">
                AI personalised suggestions
              </p>

              <h2 id="ai-recommendation-heading">
                Recommended for you
              </h2>

              <p class="ai-recommendation-intro">
                Suggestions are ranked using your saved
                interests, preferred area, activity types
                and preferred days.
              </p>
            </div>

            <RouterLink
              class="ai-preferences-link"
              to="/preferences"
            >
              {{
                hasPreferences
                  ? 'Update preferences'
                  : 'Set preferences'
              }}

              <span aria-hidden="true">
                →
              </span>
            </RouterLink>
          </div>

          <!-- =================================================
               No preferences
               ================================================= -->

          <div
            v-if="!hasPreferences"
            class="ai-empty-state"
          >
            <div
              class="ai-empty-icon"
              aria-hidden="true"
            >
              ✦
            </div>

            <div>
              <h3>
                Make activity discovery more personal
              </h3>

              <p>
                Tell us a few optional preferences and
                our recommendation system can suggest
                activities that may suit you.
              </p>

              <RouterLink
                class="primary-cta"
                to="/preferences"
              >
                Set my preferences

                <span aria-hidden="true">
                  →
                </span>
              </RouterLink>
            </div>
          </div>

          <!-- =================================================
               Loading
               ================================================= -->

          <div
            v-else-if="recommendationLoading"
            class="ai-loading-state"
            role="status"
            aria-live="polite"
          >
            <div
              class="ai-loading-spinner"
              aria-hidden="true"
            ></div>

            <div>
              <strong>
                Finding activities for you...
              </strong>

              <p>
                The recommendation model is comparing
                your preferences with available
                activities.
              </p>
            </div>
          </div>

          <!-- =================================================
               Recommendation error
               ================================================= -->

          <div
            v-else-if="recommendationError"
            class="ai-error-state"
            role="alert"
          >
            <div>
              <strong>
                Recommendations are temporarily unavailable.
              </strong>

              <p>
                {{ recommendationError }}
              </p>
            </div>

            <button
              type="button"
              class="ai-retry-button"
              @click="loadRecommendations"
            >
              Try again
            </button>
          </div>

          <!-- =================================================
               Top 3 AI recommendation cards
               ================================================= -->

          <div
            v-else-if="recommendedActivities.length"
            class="ai-recommendation-grid"
          >
            <article
              v-for="activity in recommendedActivities"
              :key="activity.id"
              class="ai-recommendation-card"
            >
              <!-- =========================
                   Activity image
                   ========================= -->

              <RouterLink
                :to="`/activities/${activity.id}`"
                class="ai-card-image-link"
                :aria-label="`View ${activity.name}`"
              >
                <img
                  :src="activity.image"
                  :alt="`${activity.name} activity`"
                  class="ai-card-image"
                />
              </RouterLink>

              <!-- =========================
                   Activity content
                   ========================= -->

              <div class="ai-card-content">
                <div>
                  <p class="ai-card-tag">
                    {{ activity.primaryTag }}
                  </p>

                  <h3>
                    {{ activity.name }}
                  </h3>

                  <p class="ai-card-meta">
                    <span>
                      {{ activity.suburb }}
                    </span>

                    <span
                      aria-hidden="true"
                    >
                      ·
                    </span>

                    <span>
                      {{ activity.schedule }}
                    </span>
                  </p>
                </div>

                <!-- =========================
                     AI recommendation reasons
                     ========================= -->

                <div class="ai-reason-box">
                  <strong>
                    Why this may suit you
                  </strong>

                  <ul
                    v-if="
                      activity
                        .recommendationReasons
                        .length
                    "
                  >
                    <li
                      v-for="
                        reason in
                          activity
                            .recommendationReasons
                      "
                      :key="reason"
                    >
                      {{ reason }}
                    </li>
                  </ul>

                  <p v-else>
                    Recommended based on your saved
                    preferences.
                  </p>
                </div>

                <!-- =========================
                     Open activity details
                     ========================= -->

                <RouterLink
                  class="ai-card-action"
                  :to="`/activities/${activity.id}`"
                >
                  View activity

                  <span aria-hidden="true">
                    →
                  </span>
                </RouterLink>
              </div>
            </article>
          </div>

          <!-- =================================================
               No AI result
               ================================================= -->

          <div
            v-else
            class="ai-empty-state"
          >
            <div
              class="ai-empty-icon"
              aria-hidden="true"
            >
              ◇
            </div>

            <div>
              <h3>
                No matching activities found
              </h3>

              <p>
                Try changing your interests, preferred
                area or activity types.
              </p>

              <RouterLink
                class="primary-cta"
                to="/preferences"
              >
                Update preferences
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
         EXPLORE
         ===================================================== -->

    <section
      class="explore-section"
      aria-labelledby="explore-heading"
    >
      <div class="page-container">
        <div class="section-heading-row">
          <div class="section-heading-copy">
            <p class="section-kicker">
              Explore
            </p>

            <h2 id="explore-heading">
              What would you like to find?
            </h2>

            <p>
              Choose a starting point and narrow your
              results using the options that matter to
              you.
            </p>
          </div>

          <RouterLink
            class="section-text-link"
            to="/activities"
          >
            Explore all activities

            <span aria-hidden="true">
              →
            </span>
          </RouterLink>
        </div>

        <div class="explore-grid">
          <article
            v-for="card in exploreCards"
            :key="card.title"
            class="explore-card"
          >
            <RouterLink
              :to="card.to"
              class="explore-card-image-link"
              :aria-label="card.action"
            >
              <div class="explore-card-image-wrap">
                <img
                  :src="card.image"
                  :alt="card.alt"
                  class="explore-card-image"
                />

                <span class="explore-card-tag">
                  {{ card.tag }}
                </span>
              </div>
            </RouterLink>

            <div class="explore-card-content">
              <div>
                <h3>
                  {{ card.title }}
                </h3>

                <p>
                  {{ card.description }}
                </p>
              </div>

              <RouterLink
                class="explore-card-action"
                :to="card.to"
              >
                {{ card.action }}

                <span
                  class="card-action-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              </RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- =====================================================
         BENEFITS
         ===================================================== -->

    <section
      class="benefits-section"
      aria-labelledby="benefits-heading"
    >
      <div class="page-container">
        <div class="benefits-heading">
          <div>
            <p class="section-kicker">
              Designed around your needs
            </p>

            <h2 id="benefits-heading">
              Clear information without unnecessary
              complexity.
            </h2>
          </div>

          <p class="benefits-intro">
            Find what matters with fewer steps,
            understandable information and privacy-aware
            browsing.
          </p>
        </div>

        <div class="benefits-grid">
          <article
            v-for="benefit in benefits"
            :key="benefit.title"
            class="benefit-card"
          >
            <span
              class="benefit-icon"
              aria-hidden="true"
            >
              {{ benefit.code }}
            </span>

            <div>
              <h3>
                {{ benefit.title }}
              </h3>

              <p>
                {{ benefit.description }}
              </p>
            </div>
          </article>
        </div>

        <!-- =================================================
             SAVED CTA
             ================================================= -->

        <div class="saved-banner">
          <div
            class="saved-banner-decoration"
            aria-hidden="true"
          ></div>

          <div class="saved-banner-content">
            <p class="saved-banner-kicker">
              Save & return
            </p>

            <h2>
              Found something useful?
            </h2>

            <p>
              Save activities and services so you can
              quickly return to important information
              later.
            </p>
          </div>

          <RouterLink
            class="saved-banner-button"
            to="/saved"
          >
            View saved items

            <span aria-hidden="true">
              →
            </span>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>