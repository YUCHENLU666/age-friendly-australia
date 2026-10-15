import {
  createRouter,
  createWebHistory,
} from 'vue-router'

// Import the Home page directly.
// Because HomeView is used frequently,
// we import it normally.
import HomeView from '@/views/HomeView.vue'

// =========================
// Create Vue Router
// =========================
const router = createRouter({
  // createWebHistory() allows the website
  // to use normal browser URLs such as:
  //
  // /
  // /activities
  // /services
  // /live
  // /saved
  // /calendar
  // /preferences
  //
  // instead of URLs with # symbols.
  history: createWebHistory(
    import.meta.env.BASE_URL,
  ),

  // =========================
  // Define all application routes
  // =========================
  routes: [
    // =========================
    // Homepage
    // =========================
    {
      // Website homepage:
      //
      // http://localhost:5173/
      path: '/',

      name: 'home',

      // HomeView was imported
      // at the top of this file.
      component: HomeView,
    },

    // =========================
    // Activities page
    // =========================
    {
      // URL:
      //
      // /activities
      path: '/activities',

      name: 'activities',

      // Load ActivitiesView.vue
      // when the user visits /activities.
      component: () =>
        import(
          '@/views/ActivitiesView.vue'
        ),
    },

    // =========================
    // Activity detail page
    // =========================
    {
      // :id is a dynamic URL parameter.
      //
      // Examples:
      //
      // /activities/1
      // /activities/2
      // /activities/15
      //
      // The value after /activities/
      // becomes the activity ID.
      path: '/activities/:id',

      name: 'activity-detail',

      // Load the detailed activity page.
      component: () =>
        import(
          '@/views/ActivityDetailView.vue'
        ),
    },

    // =========================
    // Services page
    // =========================
    {
      // URL:
      //
      // /services
      path: '/services',

      name: 'services',

      // Load ServicesView.vue.
      component: () =>
        import(
          '@/views/ServicesView.vue'
        ),
    },

    // =========================
    // Service detail page
    // =========================
    {
      // Dynamic service URL.
      //
      // Examples:
      //
      // /services/1
      // /services/5
      path: '/services/:id',

      name: 'service-detail',

      // Load ServiceDetailView.vue.
      component: () =>
        import(
          '@/views/ServiceDetailView.vue'
        ),
    },

    // =========================
    // Live real-time information page
    // =========================
    {
      // URL:
      //
      // /live
      path: '/live',

      name: 'live-information',

      // Load LiveInformationView.vue.
      component: () =>
        import(
          '@/views/LiveInformationView.vue'
        ),
    },

    // =========================
    // Saved items page
    // =========================
    {
      // URL:
      //
      // /saved
      path: '/saved',

      name: 'saved',

      // Load SavedView.vue.
      component: () =>
        import(
          '@/views/SavedView.vue'
        ),
    },

    // =========================
    // Personal Calendar page
    // =========================
    {
      // Epic 7 Personal Calendar.
      //
      // URL:
      //
      // /calendar
      //
      // This page allows users to:
      //
      // 1. View saved activities
      //    on their activity dates.
      //
      // 2. Choose planned visit dates
      //    for saved services.
      //
      // 3. View activities and planned
      //    service visits together.
      path: '/calendar',

      name: 'calendar',

      // Lazy-load CalendarView.vue
      // only when the user visits
      // the calendar page.
      component: () =>
        import(
          '@/views/CalendarView.vue'
        ),
    },

    // =========================
    // Preferences page
    // =========================
    {
      // URL:
      //
      // /preferences
      path: '/preferences',

      name: 'preferences',

      // Load PreferencesView.vue.
      component: () =>
        import(
          '@/views/PreferencesView.vue'
        ),
    },

    // =========================
    // Unknown URL handling
    // =========================
    {
      // This catches every URL
      // that does not match a route above.
      //
      // Examples:
      //
      // /abc
      // /test123
      // /something-that-does-not-exist
      //
      // All of them will redirect to "/".
      path: '/:pathMatch(.*)*',

      redirect: '/',
    },
  ],

  // =========================
  // Scroll behaviour
  // =========================
  //
  // Every time the user changes pages,
  // automatically scroll back to the top.
  scrollBehavior() {
    return {
      top: 0,
    }
  },
})

// =========================
// Export router
// =========================
//
// main.js imports this router
// and installs it into the Vue application.
export default router