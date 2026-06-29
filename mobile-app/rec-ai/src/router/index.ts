import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/splash'
  },
  {
    path: '/splash',
    name: 'Splash',
    component: () => import('@/views/SplashPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { guest: true }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('@/views/VerifyEmailPage.vue'),
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordPage.vue'),
    meta: { guest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { auth: true }
  },
  {
    path: '/record',
    name: 'Record',
    component: () => import('@/views/RecordPage.vue'),
    meta: { auth: true }
  },
  {
    path: '/recordings',
    name: 'Recordings',
    component: () => import('@/views/RecordingsPage.vue'),
    meta: { auth: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchPage.vue'),
    meta: { auth: true }
  },
  {
    path: '/recording/:id',
    name: 'RecordingDetail',
    component: () => import('@/views/RecordingDetailPage.vue'),
    meta: { auth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfilePage.vue'),
    meta: { auth: true }
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('@/views/PricingPage.vue'),
    meta: { auth: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Auth guard - import store lazily to avoid circular deps
router.beforeEach(async (to, _from, next) => {
  // Splash handles its own auth check and navigation
  if (to.name === 'Splash') {
    next();
    return;
  }

  const { useAuthStore } = await import('@/stores/auth');
  const auth = useAuthStore();

  // Initialize auth on first navigation
  if (!auth.isAuthenticated && !auth.loading) {
    await auth.initialize();
  }

  if (to.meta.auth && !auth.isAuthenticated) {
    next('/login');
  } else if (to.meta.guest && auth.isAuthenticated) {
    next('/home');
  } else {
    next();
  }
});

export default router;
