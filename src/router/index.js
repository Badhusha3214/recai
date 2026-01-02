import { createRouter, createWebHistory } from 'vue-router'
import { authState, initAuth } from '../api'
import Welcome from '../views/Welcome.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import DashboardHome from '../views/DashboardHome.vue'
import NewRecording from '../views/NewRecording.vue'
import RecordingsList from '../views/RecordingsList.vue'
import RecordingDetail from '../views/RecordingDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: DashboardHome
      },
      {
        path: 'record',
        name: 'NewRecording',
        component: NewRecording
      },
      {
        path: 'recordings',
        name: 'RecordingsList',
        component: RecordingsList
      },
      {
        path: 'recordings/:id',
        name: 'RecordingDetail',
        component: RecordingDetail
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Initialize auth state
initAuth()

// Navigation guards
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some(record => record.meta.guest)

  if (requiresAuth && !authState.isAuthenticated) {
    next('/login')
  } else if (isGuestRoute && authState.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
