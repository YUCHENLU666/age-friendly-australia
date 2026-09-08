import {
  createRouter,
  createWebHistory,
} from 'vue-router'

// Import the Home page directly.
// Because HomeView is used frequently, we import it normally.
import HomeView from '@/views/HomeView.vue'

// =========================
// Create Vue Router
// =========================
const router = createRouter({
  // createWebHistory() allows the website to use
  // normal browser URLs such as:
  //
  // /
  // /login
  // /activities
  // /services
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
      // /login
      //
      // Vue Router loads LoginView.vue.
      path: '/login',

      // Route name.
      // We can use this name later for navigation:
      //
      // router.push({ name: 'login' })
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
      // because the login page must be accessible
      // before the administrator logs in.
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

      // HomeView was imported at the top of this file.
      component: HomeView,

      // This route is protected.
      //
      // The navigation guard below will check this value.
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

      // Administrator must be logged in.
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
      // Example:
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

      // Administrator must be logged in.
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
      // Example:
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
    // Unknown URL handling
    // =========================
    {
      // This catches every URL
      // that does not match a route above.
      //
      // Example:
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
// /activities
//
//        ↓
//
// router.beforeEach()
//
//        ↓
//
// Check whether Activities requires login.
//
//        ↓
//
// Check localStorage login status.
//
//        ↓
//
// Logged in?
//
// YES → continue to /activities
//
// NO  → redirect to /login
//
router.beforeEach((to) => {
  // =========================
  // Read administrator login status
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
  // /activities
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
  // Prevent logged-in admin
  // from returning to login
  // =========================
  //
  // Example:
  //
  // Admin logs in successfully
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
  // Vue Router allows the navigation normally.
})

// =========================
// Export router
// =========================
//
// main.js imports this router
// and installs it into the Vue application.
export default router