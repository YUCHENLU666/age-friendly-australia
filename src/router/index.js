import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(
    import.meta.env.BASE_URL,
  ),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

    {
      path: '/activities',
      name: 'activities',
      component: () =>
        import(
          '@/views/ActivitiesView.vue'
        ),
    },

    {
      path: '/activities/:id',
      name: 'activity-detail',
      component: () =>
        import(
          '@/views/ActivityDetailView.vue'
        ),
    },

    {
      path: '/services',
      name: 'services',
      component: () =>
        import(
          '@/views/ServicesView.vue'
        ),
    },

    {
      path: '/services/:id',
      name: 'service-detail',
      component: () =>
        import(
          '@/views/ServiceDetailView.vue'
        ),
    },

    {
      path: '/saved',
      name: 'saved',
      component: () =>
        import(
          '@/views/SavedView.vue'
        ),
    },

    {
      path: '/preferences',
      name: 'preferences',
      component: () =>
        import(
          '@/views/PreferencesView.vue'
        ),
    },
  ],

  scrollBehavior() {
    return {
      top: 0,
    }
  },
})

export default router