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
  // /login
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
    // Login page
    // =========================
    {
      // When the browser URL is:
      //
      // /login
      //
      // Vue Router loads LoginView.vue.
      path: '/login',

      // Route name.
      name: 'login',

      // Lazy-load LoginView.vue.
      //
      // This means the component is loaded
      // only when the user visits /login.
      component: () =>
        import(
          '@/views/LoginView.vue'
        ),

      // IMPORTANT:
      //
      // We do NOT add:
      //
      // meta: {
      //   requiresAuth: true
      // }
      //
      // because the login page must be
      // accessible before the user logs in.
    },

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

      // This route is protected.
      //
      // The navigation guard below
      // will check this value.
      meta: {
        requiresAuth: true,
      },
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

      // User must be logged in.
      meta: {
        requiresAuth: true,
      },
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

      // This page is also protected.
      meta: {
        requiresAuth: true,
      },
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

      // User must be logged in.
      meta: {
        requiresAuth: true,
      },
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

      // This page also requires login.
      meta: {
        requiresAuth: true,
      },
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

      // This page requires login,
      // consistent with other feature pages.
      meta: {
        requiresAuth: true,
      },
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

      // This page is protected.
      meta: {
        requiresAuth: true,
      },
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

      // Keep the calendar protected
      // like the other main feature pages.
      meta: {
        requiresAuth: true,
      },
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

      // This page is protected.
      //
      // Only logged-in users can access
      // the preferences page.
      meta: {
        requiresAuth: true,
      },
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
// Global Navigation Guard
// =========================
//
// beforeEach() runs BEFORE every route change.
//
// Example:
//
// User enters:
//
// /calendar
//
//        ↓
//
// router.beforeEach()
//
//        ↓
//
// Check whether Calendar
// requires login.
//
//        ↓
//
// Check localStorage login status.
//
//        ↓
//
// Logged in?
//
// YES → continue to /calendar
//
// NO → redirect to /login
//
router.beforeEach((to) => {
  // =========================
  // Read login status
  // =========================
  //
  // LoginView.vue saves this value
  // after successful login:
  //
  // localStorage.setItem(
  //   'ageFriendlyAdminLoggedIn',
  //   'true'
  // )
  //
  // localStorage stores strings,
  // so we compare the stored value
  // with the string "true".
  const isLoggedIn =
    localStorage.getItem(
      'ageFriendlyAdminLoggedIn',
    ) === 'true'

  // =========================
  // Protect private routes
  // =========================
  //
  // "to" represents the page
  // that the user wants to visit.
  //
  // Example:
  //
  // User wants:
  //
  // /calendar
  //
  // Then:
  //
  // to.meta.requiresAuth
  //
  // will be true.
  if (
    to.meta.requiresAuth &&
    !isLoggedIn
  ) {
    // User is trying to visit
    // a protected page without logging in.
    //
    // Redirect them to LoginView.vue.
    return {
      name: 'login',
    }
  }

  // =========================
  // Prevent logged-in user
  // from returning to login
  // =========================
  //
  // Example:
  //
  // User logs in successfully
  //        ↓
  // Goes to homepage
  //        ↓
  // Manually enters /login
  //        ↓
  // Redirect back to homepage
  //
  if (
    to.name === 'login' &&
    isLoggedIn
  ) {
    return {
      name: 'home',
    }
  }

  // If no return happens above,
  // Vue Router allows navigation normally.
})

// =========================
// Export router
// =========================
//
// main.js imports this router
// and installs it into the Vue application.
export default router