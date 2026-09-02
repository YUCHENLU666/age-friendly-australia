<script setup>
import { RouterLink } from 'vue-router'

const exploreCards = [
  {
    title: 'Local activities',
    description:
      'Browse activities, classes and events by general area, preferred date and interest.',
    image: '/images/activities.jpg',
    alt: 'Older adults taking part in a group activity',
    tag: 'Activities',
    to: '/activities',
    action: 'Browse activities',
  },
  {
    title: 'Aged-care support',
    description:
      'Browse verified aged-care support services with clear location and source information.',
    image: '/images/healthcare.jpg',
    alt: 'An older adult accessing healthcare support',
    tag: 'Health & support',
    to: '/services',
    action: 'Find support',
  },
]

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

const trustItems = [
  'Clear source information',
  'Accessibility details',
  'Simple navigation',
]
</script>

<template>
  <div class="home-page">
    <!-- =====================================================
         HERO
         ===================================================== -->
    <section class="home-hero">
      <div class="hero-decoration hero-decoration--one" aria-hidden="true"></div>
      <div class="hero-decoration hero-decoration--two" aria-hidden="true"></div>

      <div class="page-container home-hero-grid">
        <div class="home-hero-content">
          <div class="hero-location">
            <span class="hero-location-dot" aria-hidden="true"></span>
            Greater Melbourne
          </div>

          <h1>
            Find activities and essential services
            <span>with confidence.</span>
          </h1>

          <p class="home-hero-lead">
            Discover local activities, healthcare, aged-care support and
            useful everyday services through one clear and accessible place.
          </p>

          <div class="home-hero-actions">
            <RouterLink class="primary-cta" to="/activities">
              <span>Find activities</span>

              <span class="cta-arrow" aria-hidden="true">
                →
              </span>
            </RouterLink>

            <RouterLink class="secondary-cta" to="/services">
              Find services
            </RouterLink>
          </div>

          <div class="hero-trust-row" aria-label="Platform benefits">
            <div
              v-for="item in trustItems"
              :key="item"
              class="hero-trust-item"
            >
              <span class="trust-check" aria-hidden="true">✓</span>
              <span>{{ item }}</span>
            </div>
          </div>

          <p class="hero-privacy-note">
            No sensitive personal information or detailed location history is
            required.
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
              <span class="hero-overlay-icon">✓</span>

              <span class="hero-overlay-copy">
                <strong>Age-friendly</strong>
                <small>Clear and simple</small>
              </span>
            </div>

            <div
              class="hero-overlay hero-overlay--bottom"
              aria-hidden="true"
            >
              <span class="hero-overlay-icon hero-overlay-icon--gold">
                ○
              </span>

              <span class="hero-overlay-copy">
                <strong>Local information</strong>
                <small>Greater Melbourne</small>
              </span>
            </div>
          </div>

          <div class="hero-image-accent" aria-hidden="true"></div>
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
            <p class="section-kicker">Explore</p>

            <h2 id="explore-heading">
              What would you like to find?
            </h2>

            <p>
              Choose a starting point and narrow your results using the
              options that matter to you.
            </p>
          </div>

          <RouterLink
            class="section-text-link"
            to="/activities"
          >
            Explore all activities
            <span aria-hidden="true">→</span>
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

                <span class="card-action-arrow" aria-hidden="true">
                  →
                </span>
              </RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- =====================================================
         VALUE / BENEFITS
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
              Clear information without unnecessary complexity.
            </h2>
          </div>

          <p class="benefits-intro">
            Find what matters with fewer steps, understandable information
              and privacy-aware browsing.
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
          <div class="saved-banner-decoration" aria-hidden="true"></div>

          <div class="saved-banner-content">
            <p class="saved-banner-kicker">
              Save & return
            </p>

            <h2>
              Found something useful?
            </h2>

            <p>
              Save activities and services so you can quickly return to
              important information later.
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
