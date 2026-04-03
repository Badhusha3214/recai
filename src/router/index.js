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
import DeleteAccount from '../views/DeleteAccount.vue'
import PrivacyPolicy from '../views/PrivacyPolicy.vue'
import AdminPanel from '../views/AdminPanel.vue'
import ContactUs from '../views/ContactUs.vue'
import RequestDeletion from '../views/RequestDeletion.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome
  },
  {
    path: '/delete-account',
    name: 'DeleteAccount',
    component: DeleteAccount,
    meta: { requiresAuth: true },
  },
  {
    path: '/contact',
    name: 'ContactUs',
    component: ContactUs,
  },
  {
    path: '/request-deletion',
    name: 'RequestDeletion',
    component: RequestDeletion,
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicy',
    component: PrivacyPolicy,
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAuth: true, requiresAdmin: true },
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
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isGuestRoute = to.matched.some(record => record.meta.guest)

  if (requiresAuth && !authState.isAuthenticated) {
    next('/login')
  } else if (requiresAdmin && authState.user?.role !== 'admin') {
    next('/dashboard')
  } else if (isGuestRoute && authState.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
