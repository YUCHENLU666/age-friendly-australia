import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(
    import.meta.env.BASE_URL,
  ),
  //Make the website use normal browser URLs

  routes: [
    {
      path: '/', //URL
      name: 'home', //Name of the route
      component: HomeView, //Component to render when the route is matched
    },
    //Import Homepage

    {
      path: '/activities',
      name: 'activities',
      component: () =>
        import(
          '@/views/ActivitiesView.vue'
        ),
    },
    //Import Activities page

    {
      path: '/activities/:id', //route with a dynamic segment for activity ID
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
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],

  scrollBehavior() {
    return {
      top: 0,
    }
  }, //After each route navigation, scroll the page to the top.
})

export default router
